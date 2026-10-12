# Event albums: rollout and operations runbook

How to switch on event albums in production and how to run them. The
personal library is not touched by any of these steps.

- The API (`oleks-21/albumio_backend`) deploys to Render, which deploys `main`
  automatically.
- The web app deploys to Firebase Hosting by hand:
  `npm run build && firebase deploy --only hosting --project albumio-47641`
  from `client/`.

## How it fits next to the library

- The library routes are unchanged and still identify the account by email.
- `/api/login` and `/register` additionally return a signed host token. Only
  `/api/events…` accepts it. Older clients ignore it.
- Registering an email that already exists is now refused, so no one can add
  a second row for someone else's email and use it to sign in.
- With `EVENT_ALBUMS_ENABLED` unset, the API answers 404 `feature_disabled` on
  event routes, and `/api/features` returns `{ "eventAlbums": false }`. The web
  app then hides everything about event albums.
- If event albums are enabled but can't start (no Firestore access, for
  example), the API logs `event_albums_unavailable`, turns them off and keeps
  serving the library.

## Deploy order

1. **API first.** Merge the API branch into `main`. Render deploys it with
   event albums off. The live web app keeps working because nothing it uses
   has changed. Check that `/api/my-images?email=…` still returns 200, and
   that `/api/features` returns `{"eventAlbums":false}`.
2. **Web app second.** Build and deploy `client/`. People who are already
   signed in stay signed in. They're asked to log in once more only when they
   open Event albums.

Either deploy can be rolled back on its own. An old web app works with the new
API, and the new web app works with an API that has event albums off.

## Switch on event albums

1. **Firestore.** The simplest option reuses the service account the API
   already has for the Sheet.
   - In Google Cloud project `my-carousel-project`, create a Firestore
     database (Native mode).
   - In IAM, grant `image-display-service@my-carousel-project.iam.gserviceaccount.com`
     the **Cloud Datastore User** role.
   - `GOOGLE_CREDENTIALS_JSON` on Render then covers Firestore too.
   - Alternative: set `FIREBASE_SERVICE_ACCOUNT_JSON` (and optionally
     `FIREBASE_PROJECT_ID`) for a different project.
2. **Rules and indexes.** From `server/`:
   ```sh
   firebase deploy --only firestore --project my-carousel-project
   ```
   Wait for the indexes to finish building.
3. **ImageKit.** Keep **Restrict unsigned URLs** on for private files, and
   create no named transformations that could serve them.
4. **Signing key (optional).** Set `HOST_SESSION_SECRET` on Render. Without
   it, the key is derived from `IMAGEKIT_PRIVATE_KEY`. Changing either one
   signs every host out of event albums, but not out of the library.
5. **Turn it on.** Set `EVENT_ALBUMS_ENABLED=true` on Render. After the
   restart:
   - check that `/api/features` returns `{"eventAlbums":true}`;
   - check the logs for `event_albums_unavailable`. If it appears, Firestore
     access is the usual cause; the library keeps working meanwhile.
6. **Verify with a test event**, on a real iPhone and a real Android phone:
   - [ ] Unsigned, expired and edited-transformation photo URLs all fail.
   - [ ] Create a link, scan the printed QR code with a phone camera, and add
     photos. The address bar no longer shows `#invite=`.
   - [ ] Retry a failed upload: no duplicate appears.
   - [ ] An upload-only link shows no gallery.
   - [ ] A view-only link without download says originals are unavailable.
   - [ ] Revoke the link: the open guest tab loses access on its next
     refresh.
7. **Homepage section (optional).** Rebuild the web app with
   `REACT_APP_EVENT_ALBUMS=true` to show it.

## Roll back

- **Event albums only:** unset `EVENT_ALBUMS_ENABLED` and restart. Event data
  stays in Firestore for later.
- **The whole API:** redeploy the previous Render deploy. The new web app then
  sees `/api/features` fail and hides event albums.

## Operations

- **Maintenance:** each API instance reconciles abandoned uploads and retries
  photo cleanup every minute.
  - Cleanup jobs that keep failing end up as `storageCleanup` documents with
    `state: "failed"`. Check them now and then.
  - With more than one instance, run `npm run maintenance` from a scheduler
    instead.
- **Limits** (per event, configurable):
  - 20 MB and 50 megapixels per photo;
  - 2,000 photos and 5 GB;
  - 3 uploads at a time per browser;
  - 30 invitation exchanges per 10 minutes per IP;
  - 600 uploads per 10 minutes per guest or host.
- **Revocation:** revoking a link, turning off guest access or blocking a
  session stops new requests immediately.
  - Photo URLs already handed out stay valid for at most about three minutes.
  - Photos already viewed or downloaded can't be recalled.
- **Logs** are one JSON line per event. They hold IDs, actions and results;
  they never hold tokens, invitation secrets, signed URLs or filenames.

## Later: securing the library itself

Library requests still trust the email the browser sends, as they always have.
A Firebase-based foundation that fixes this is on the API's `event-albums`
branch. It needs a coordinated release: Firebase Auth set up, the API and web
app deployed together, and existing accounts migrated. Do that as its own
project.
