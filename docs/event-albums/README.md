# Collaborative event albums

A host creates a private event album and shares a link or QR code. Guests open
it on their phones and add photos without creating an account. Each link sets
what its guests can do: **add**, **view** and **download**. This is the
implementation of the collaborative event albums plan. Deploying and migrating
are separate steps; see [`../EVENT_ALBUMS_RUNBOOK.md`](../EVENT_ALBUMS_RUNBOOK.md).

The screenshots below come from a real run against the Firebase Auth and
Firestore emulators. The API used its signed local media store, and the photos
are the Unsplash samples in `client/public/images/samples`.

## What was built

### Foundation (Phase 1)

- **Host sign-in.** Hosts sign in with Firebase Authentication (email and
  password).
  - The client keeps no login flag of its own. Redux mirrors the Firebase
    session, with an initial `loading` state that route guards wait for.
  - `api.js` sends the ID token as `Authorization: Bearer`. A 401 is retried
    once with a refreshed token.
  - Every library, preset and upload call goes through `request()`. Calls no
    longer send an email.
- **API access control.** The API verifies every host token with the Admin
  SDK.
  - Personal-library routes use the library mapped to that sign-in. An email
    in the request is rejected when it doesn't match.
  - Guest tokens (`albg_…`) are refused on every host and library route.
- **Legacy accounts.** A legacy account maps to a sign-in only with a
  verified email and an unambiguous record.
  - Case-variant duplicates and folder-name collisions are held for manual
    review.
  - `legacyLinks` makes sure one library links to one sign-in.
  - Saved slideshows are scoped to their owner.
  - `/register` and `/api/login` answer `410`, and the password column is no
    longer read.
- **Server structure.**
  - `server/app.js` is an importable app with injected services.
  - Firestore rules deny all direct access, and the composite indexes are
    checked in.
  - `EVENT_ALBUMS_ENABLED` gates every event route.

### Hosts (Phase 2)

- **Event albums page** (`/events`): cover cards with photo count and status
  (Collecting, Uploads closed, Guest access off, Archived). Counts refresh
  while the page is visible.
- **Event page** (`/events/:albumId`): Add photos, Invite guests, Play
  slideshow and Settings.
  - The grid shows who added each photo and when.
  - Each photo's menu has Download, Set as cover, Hide from guests or Show to
    guests, Turn off this guest's session, and Remove.
- **Settings:**
  - Title and date.
  - **Accept guest uploads**, **Allow guest access** and **Archive event**.
  - Usage meters for photos and storage.
  - An honest note about how long signed URLs stay valid.
  - Saves are version-checked, so an edit from another tab is never
    overwritten.

### Invitations and guests (Phase 3)

- **Invitation links.** Each link has a name, its own Add / View / Download
  switches (Download requires View) and an expiry, 30 days by default.
  - A new link is shown once with a QR code, Copy, Share and a printable QR
    card (PNG).
  - The QR code is drawn in the browser.
  - The server keeps only a SHA-256 hash of the link.
  - The list of links offers Revoke and Replace.
- **Joining.** `/join#invite=…` reads the secret from the URL fragment, strips
  it from the address bar and history, and exchanges it for a scoped guest
  session.
  - The session lasts 24 hours, or until the invitation expires if that is
    sooner.
  - The token is kept in `sessionStorage` only.
  - The guest then continues at `/events/:albumId`.
- **Guest pages.** Guests get a minimal header with no account or library
  navigation.
  - Viewing guests browse, preview and play the slideshow. They can download
    originals only if their link allows it.
  - Upload-only guests see just the uploader and their own receipts: no
    gallery, cover, count or other guests' names.
- **Reused components.**
  - `FileSelect` takes an injected upload handler with per-file idempotency
    keys, so a retry never duplicates a photo. It has no collection field in
    event mode, accepts only JPEG, PNG and WebP, and explains HEIC.
  - `PhotoCard`, `Preview` and `Slideshow` accept IDs, titles, action menus
    and signed URLs.

### Phone experience (Phase 4)

- **Phone layout.**
  - Viewing guests and hosts get a sticky **Add photos** bar.
  - The grid uses two columns, and tap targets are large.
  - The layout follows the Lagoon light and dark schemes.
- **Refresh.** Galleries refresh every 60 seconds while visible and when the
  phone brings the tab back. Each refresh renews the signed URLs.
  - An image that already loaded keeps its URL, so it doesn't flash.
  - A failed image asks the server for a fresh URL. If access has changed,
    the page explains why.
- **Access states.** Each has its own message: an invalid, expired or revoked
  link, closed uploads, guest access off, a turned-off session, a missing
  album, and network errors.
- **Homepage.** The homepage gains an event-albums section once the build
  sets `REACT_APP_EVENT_ALBUMS=true`.

## Server design

| Concern | Implementation |
| --- | --- |
| Records | Firestore: `eventAlbums` (+ `photos` subcollection), `eventInvitations`, `guestSessions` (doc ID = token hash), `eventUploads` (reservations), `storageCleanup`, `hosts`, `legacyLinks` |
| Access | `services/access.js` evaluates effective capabilities from the album, invitation and session on **every** request; event-wide switches override every invitation |
| Uploads | Reserve (transaction: access + quota incl. in-flight) → store bytes at `/events/<album>/<photo>.<ext>` (private) → finalize (transaction: re-check access, publish or reject). Idempotency key per file; provider calls never run inside transaction callbacks |
| Image safety | Signature sniffing (JPEG/PNG/WebP; HEIC detected and explained), 20 MB / 50 MP limits, bounded `sharp` decode, orientation applied, all metadata (incl. GPS) dropped |
| Reliability | Abandoned reservations are reconciled (published if bytes landed and access still allows, else released); deletions go through a persistent, retried cleanup queue; counters are released exactly once |
| Media | Fixed variants only (`thumb` 480, `preview` 1920, `original`), signed URLs aligned to the minute and expiring in 2–3 minutes |
| Errors | `{ error: { code, message } }`; 401 expired/missing session, 403 not allowed, 404 not found (also for other hosts' albums), 409 conflicts/quota, 413/415 size/type, 429 rate limits |

## Verification

| Check | Result |
| --- | --- |
| `server`: `npm test` (in-memory) | 56 tests pass |
| `server`: `npm run test:emulators` (Firestore + Auth emulators, real ID tokens) | 55 pass, 1 skipped: two accounts can't share an email in the Auth emulator |
| `client`: `CI=true npm test` | 24 tests pass |
| `client`: `CI=true npm run build` | Compiles with no warnings |
| Browser run (Chrome, emulators) | Host registers, creates an event, and creates an add+view link and an upload-only link. A guest on a phone joins (the secret is gone from the URL; the token is in sessionStorage only) and uploads 2 photos. The upload-only guest uploads with no gallery. The host revokes the link, and the open guest tab loses access on its next request. |

The server suites cover acceptance tests 2–7 and 9–10 from the plan, at the
API level:

- the five valid permission combinations, plus a rejected download-only link;
- host overrides;
- denied requests on every route;
- cross-album and cross-host IDs;
- forged emails;
- upload-only isolation;
- same-name uploads;
- concurrent quota;
- retries and provider failures;
- revocation during an upload;
- hidden photos;
- pagination under concurrent uploads;
- signed-URL expiry and renewal.

## Not done yet

- **Real phones and real QR scans** (acceptance test 8). The browser run used
  phone viewports, not iOS Safari or Android Chrome hardware, and no phone
  camera scanned a printed code over HTTPS.
- **HEIC conversion.** HEIC files are refused with an explanation, as the plan
  allows. Converting them is the high-value follow-up.
- **ImageKit behaviour against the real account.** The private-file upload,
  signed variants and `ik-attachment` downloads follow ImageKit's documented
  API, but they have only been tested through the local signed store. Before
  rollout, check that unsigned, expired and edited-transformation URLs fail.
- **Production provisioning and migration.** Firebase Auth, Firestore, the
  service account, the client Firebase config and the legacy-account
  migration are runbook steps that haven't been carried out.
- **Shared rate limiting.** Rate limits are kept in memory per instance, which
  is enough for the current single Render instance.

## Screenshots

| | |
| --- | --- |
| ![Host event page, light](screenshots/host-event-desktop-light.jpg) | ![Host event page, dark](screenshots/host-event-desktop-dark.jpg) |
| Host event page | Same, dark |
| ![Invitation form](screenshots/host-invite-form-desktop-light.jpg) | ![New link with QR](screenshots/host-invite-created-desktop-light.jpg) |
| New invitation link | A link shown once, with its QR code |
| ![Links list](screenshots/host-invitations-desktop-dark.jpg) | ![Settings](screenshots/host-settings-desktop-dark.jpg) |
| Links for the event, one revoked | Event settings and usage |
| ![Event albums](screenshots/host-event-albums-desktop-dark.jpg) | ![Host on a phone](screenshots/host-event-phone-dark.jpg) |
| Event albums | Host on a phone |

| | | |
| --- | --- | --- |
| ![Guest gallery](screenshots/guest-gallery-phone-light.jpg) | ![Guest gallery, dark](screenshots/guest-gallery-phone-dark.jpg) | ![Guest upload](screenshots/guest-upload-phone-light.jpg) |
| Viewing guest | Same, dark | Adding photos |
| ![Upload-only guest](screenshots/guest-upload-only-phone-light.jpg) | ![Viewer without download](screenshots/guest-viewer-phone-dark.jpg) | ![Revoked](screenshots/guest-revoked-phone-dark.jpg) |
| Upload-only guest | Viewer, downloads off | After the host revokes the link |
