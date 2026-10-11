# Event albums: rollout, migration and operations runbook

How to take the authenticated foundation and event albums from code to
production, and how to run them. Pushing code deploys nothing by itself. The
client is deployed by hand to Firebase Hosting. The API repo is
`oleks-21/albumio_backend`; check whether Render auto-deploys it from `main`.

> **Order matters.** The new client only signs in through Firebase, and the
> new API rejects requests without a Firebase ID token. Deploy the API and the
> client together, after steps 1–3 below. Until then, keep running the
> previous builds.

## 1. Provision (once per environment)

1. **Firebase Authentication.** In the Firebase console for `albumio-47641`
   (or a staging project), enable the **Email/Password** provider. In
   Authentication › Settings › Authorized domains, add the hosting domains.
2. **Firestore.** Create the database in production mode. From `server/`,
   deploy the rules and indexes:
   ```sh
   firebase deploy --only firestore --project <project>
   ```
   `firestore.rules` denies all client access. Wait for every index in
   `firestore.indexes.json` to finish building.
3. **API credentials.** Create a service account with *Firebase Authentication
   Admin* and *Cloud Datastore User*. Store its JSON as
   `FIREBASE_SERVICE_ACCOUNT_JSON` in the API host's environment, together with
   `FIREBASE_PROJECT_ID`, the existing ImageKit and Sheets variables, and
   `CORS_ORIGINS`. See `server/.env.example`.
4. **ImageKit.**
   - Keep **Restrict unsigned URLs** on for private files.
   - Don't create named transformations that could serve private files.
   - After the first test upload, confirm that each of these fails for an
     event photo:
     - an unsigned URL;
     - an expired signed URL;
     - a signed URL with an edited `tr:` segment;
     - a URL through a named transformation.
5. **Client config.** Put the Firebase web config in `client/.env.production.local`
   (`REACT_APP_FIREBASE_*`, see `client/.env.example`). These values identify
   the project; they are not secrets.

## 2. Migrate existing accounts

Existing accounts have plaintext passwords in the legacy Google Sheet. They are
never imported. Each person creates a Firebase sign-in with the **same email**
and confirms it. The API then links the old library to that sign-in itself, and
only when the mapping is unambiguous.

1. **Back up** the Sheet: File › Make a copy. Store the copy in a restricted
   folder that only the operator can open. It's for recovery only.
2. **Audit** from `server/`:
   ```sh
   npm run audit:legacy
   ```
   Every account listed under "Need manual review" is a case-variant duplicate
   or a folder-name collision. Decide which sign-in owns which library. Then
   either fix the Sheet row, or write the `hosts/<uid>` and
   `legacyLinks/<lowercased email>` documents by hand after the person has
   signed up.
3. **Tell existing users** that they need to create an account again with the
   same email and confirm it from their inbox. The login dialog explains this,
   and so does the library page while confirmation is pending.
4. **After validation**, once linked libraries have been spot-checked for a
   few weeks, clear the password column (C) in the live Sheet. The API never
   reads it.

What the API does on a host's first library request:

| Situation | Result |
| --- | --- |
| No legacy row for the email | A new, empty library keyed `uid:<uid>` |
| One row, email **not** verified | 403 `email_verification_required`. The library page shows "Confirm your email" |
| One row, email verified | Linked once: `legacyLinks` stops a second sign-in from claiming it |
| Case-variant duplicates or folder collision | 409 `legacy_review_required` until resolved by hand |

## 3. Roll out event albums

1. Deploy the API with `EVENT_ALBUMS_ENABLED=false` together with the new
   client. That ships host authentication only.
2. In a **staging** project, set `EVENT_ALBUMS_ENABLED=true`. Then run the
   checklist below on a real iPhone (Safari) and a real Android phone (Chrome),
   in light and dark mode:
   - [ ] The host creates an event and a link, and downloads and prints the QR
     card.
   - [ ] A phone camera scan opens the HTTPS link, and the address bar no
     longer shows `#invite=`.
   - [ ] A guest chooses several photos and enters a name. Turn airplane mode
     on mid-upload, then retry the failed files: there are no duplicates.
   - [ ] HEIC from an iPhone set to "High Efficiency" shows the explanation.
   - [ ] An upload-only link shows no gallery, no count and no names.
   - [ ] A view-only link without download says originals are unavailable.
   - [ ] Revoking a link, closing uploads and turning off guest access each
     reach an open guest tab on its next refresh.
   - [ ] Hidden and removed photos disappear from guest views and the cover.
   - [ ] Check layouts at 360, 390, 768 and 1440 px, check keyboard focus,
     and confirm screen readers announce upload status.
3. Enable in production by setting `EVENT_ALBUMS_ENABLED=true` and restarting
   the API.
4. Rebuild the client with `REACT_APP_EVENT_ALBUMS=true` to show the homepage
   section, then deploy it:
   `npm run build && firebase deploy --only hosting --project albumio-47641`.

## Rollback

- **Event albums only:** set `EVENT_ALBUMS_ENABLED=false` and restart.
  - Event routes then answer `404 feature_disabled`.
  - Event data, invitations and photos stay in place for re-enabling.
  - Host authentication stays on.
- **Whole release:** redeploy the previous API and client builds together.
  - The legacy Sheet passwords still work until they are cleared, which is
    the last migration step.
  - Firebase sign-ins created in the meantime stay valid for the next
    attempt.

## Operations

- **Maintenance:** each API instance runs reconciliation and cleanup every
  minute.
  - With more than one instance, set `MAINTENANCE_INTERVAL_MS` very high and
    run `npm run maintenance` from a scheduler instead.
  - Cleanup jobs that keep failing end up as `storageCleanup` documents with
    `state: "failed"`. Check them weekly; `lastError` says why.
- **Limits** (per event, configurable):
  - 20 MB per file and 50 megapixels;
  - 2,000 photos and 5 GB;
  - at most 3 uploads at once per guest browser;
  - 30 invitation exchanges per 10 minutes per IP;
  - 600 uploads per 10 minutes per guest or host.
- **Revocation timing:** revoking a link, turning off guest access or blocking
  a session stops new API requests immediately.
  - Signed photo URLs already handed out stay valid for at most about three
    minutes.
  - Photos already viewed or downloaded can't be recalled.
  - If instant media revocation is ever required, serve media through an
    authenticated proxy instead of signed URLs.
- **Logs** are one JSON line per event. They hold IDs, actions and results;
  they never hold tokens, invitation secrets, signed URLs or filenames.
