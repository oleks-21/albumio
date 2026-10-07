# Albumio redesign

What changed in the client redesign, how it was checked, and what still depends
on the backend. Screenshots are in [`screenshots/`](screenshots). They were
captured against a local mock API seeded with Unsplash fixture photos, so no
real account data appears in them.

## What changed

**Foundation.** `src/theme.js` holds the "Lagoon" palette: turquoise actions,
light-blue accents and aqua-tinted surfaces with deep-ink text, plus a
deep-water dark scheme. The raw values are in `palettes`; `tokens` are
references to matching CSS custom properties in `index.css`, so `sx` props and
stylesheets follow the active scheme. The photo viewer and slideshow use a
separate `viewerTheme` that is dark in both schemes. Inter is used for the UI and
Georgia for display headings. The routed content now sits in a `<main>`, and the
header height is set once per breakpoint (64 / 72px). The gradient heading
component, the indigo glow and the glass styling are gone. Reveal animations
respect `prefers-reduced-motion`.

**Light and dark mode.** The theme uses MUI's CSS-variable color schemes,
switched by a `data-theme` attribute on `<html>`.
- **Default.** It follows the OS setting until the person picks a mode.
- **Toggle.** A sun/moon button sits in the header on desktop, and a Light
  mode / Dark mode button is in the mobile menu. MUI remembers the choice in
  localStorage (`mui-mode`).
- **No flash.** An inline script in `public/index.html` applies the saved or
  system scheme before the first paint.
- **Screenshots.** The homepage walkthrough shows light or dark product
  screenshots to match the active mode.

The palette was guided by common turquoise UI pairings: pale aqua surfaces,
deep navy or slate ink, and near-black slate for dark backgrounds.

**Header and homepage** (`TopBar`, `MainPage`).
- The header now has a brand link, real page links (How it works, About, or
  Home / My library when signed in), Log in plus a primary Create account, and
  an account menu when signed in. Phones keep a visible primary action, with the
  other links in a labeled menu drawer.
- The header and the hero open the same auth dialog. Its state lives in
  `App.js`, and the dialog can switch between Log in and Create account.
- The hero is a two-column layout: headline, CTA and a three-photo frame
  composition.
- Below the hero:
  - a three-step walkthrough illustrated with real product screenshots
  - a sample gallery mosaic
  - a closing CTA and a footer
- The four autoplay carousels, the hot-linked stock images and the unsupported
  claims (sharing, casting, combining) are removed. Bundled photos and their
  licenses are listed in `public/images/README.md`.

**Library** (`Album/*`, `CollectionDisplay`, `Preset`). The library opens on
**All photos**, with the photos directly under a compact toolbar. At 1440×900
the first row starts at 256px from the top.
- **Layout.** A 248px sidebar holds All photos, collections with counts, and
  Saved slideshows. Below 1024px the sidebar becomes a drawer behind a
  Collections button.
- **Finding photos.** Search covers filenames and collection names and ignores
  case. Sort is Name A–Z / Z–A using `localeCompare`. Collection filters are
  multi-select with OR logic, and each one shows as a removable chip. A text
  summary such as "Showing 6 of 12 photos in …" explains the result.
- **Grid.** Columns follow the content width through a container query: 4, 3, 2
  or 1. Frames are 4:3 with `cover`, and an optional Fit view uses `contain`.
  Each card has a real thumbnail button, with selection and overflow controls
  as sibling elements.
- **Delete.** Delete moved into the overflow menu and asks for confirmation,
  naming the photo.
- **Image loading.** Images go loading → loaded or failed. A load that takes
  longer than 20s counts as failed and shows a labeled placeholder with Retry.
  There are also explicit empty, error and no-results states.
- **Saved slideshows** (presets in the API, payloads unchanged):
  - **Saving.** Grid selection mode is independent of filtering. A contextual
    bar shows "N selected · Save slideshow · Cancel selection". The name dialog
    closes only after the API confirms the save, and duplicate names are
    blocked.
  - **Applying.** Applying a slideshow shows its name with Exit and keeps its
    saved order. It also reports photos that are no longer in the library.
    Choosing a collection filter clears the applied slideshow.
  - **Deleting.** Deleting a slideshow asks for confirmation.

**Upload** (`FileSelect`). Upload is now a dialog, full screen on phones.
- **Choosing files.** Drag and drop, a file chooser, and a folder chooser where
  the browser supports it. Non-image files are skipped and listed.
- **The list.** Each chosen file shows a thumbnail, name and size, and can be
  removed before upload.
- **Collection.** A collection name is required, and existing names are offered
  as suggestions.
- **Uploading.** It still sends one file per request, up to three at a time.
  Each file shows Waiting, Uploading, Added or Failed. Partial success is
  reported, and failed files have a Retry button.
- **Safety.** The dialog can't be closed while uploads are running. Files that
  are waiting or failed are kept if the dialog is closed. A file with the same
  name as an existing photo gets a warning, because the server replaces the
  existing file.
- **Result.** Uploaded photos and collection counts appear immediately, without
  a reload.

**Viewer** (`Preview`). This is now an MUI full-screen dialog in the dark
theme.
- **Layout.** A large uncropped image with Previous/Next and an "n of N"
  position. On desktop a 320px details panel sits beside it; on phones the
  details collapse below the image.
- **Keyboard.** The arrow keys move through the visible list (except while you
  are typing in a field). Escape closes the viewer, and focus returns to the
  thumbnail you opened.
- **Rename and collection.** These save separately, each with its own
  pending / success / error message. After a rename, later requests use the new
  name, and the library refetches the new URL.

**Slideshow.** The `react-multi-carousel` dependency was removed. The slideshow
is a full-screen dialog with a `contain` image, so it uses MUI's normal overlay
stacking instead of a very high z-index.
- **Controls.** A control dock has Previous, Play/Pause, Next, position, a 2–15s
  interval slider, Full screen (where supported) and Close.
- **Playback.** It starts paused. Controls hide after 3s without pointer
  activity while playing, but never while a control has keyboard focus.
- **Keyboard.** Space plays and pauses, the arrows navigate, and Escape closes.
- **Scope.** The scope is named: all photos, the current filters, or the saved
  slideshow. The launch button is disabled when no photos are shown.
- **Autoplay fix.** Autoplay used to turn the screen black after the first
  advance. `useImageStatus` reset each new photo to "loading" in an effect.
  Timer-driven updates run that effect after paint. By then the next photo,
  already cached by the preloader, had fired its `load` event, so the late
  reset hid it. The hook now resets during render and checks the element's
  `complete` flag.

**Editor** (`EditImage`).
- **Layout.** A header holds Back to library, the filename and Save changes. The
  image takes most of the space, and a 304px tools panel sits beside it; on
  phones the panel stacks below the image. The panel has Draw / Crop / Color
  tabs, labeled sliders, and a labeled "Save details" section.
- **Preserved behavior.** Drawing, cropping, color adjustment, export and save
  behave as before.
- **Fixes:**
  - Pointer events are used, so touch drawing and cropping work.
  - A `ResizeObserver` keeps the canvas aligned with the image when the window
    resizes, without erasing the drawing.
  - The editor now starts with the photo's current collection, so saving no
    longer drops it.
  - There are explicit screens for an image that fails to load and for opening
    `/edit` directly.

## Validation

- `npm run build` compiles with no warnings.
- `npm test`: 13 tests, all passing, with mocked requests. They cover:
  - the light/dark toggle and remembering the choice
  - image status: cached images, source changes and load timeouts
  - homepage → registration dialog
  - filtering kept separate from selection
  - saved-slideshow apply/clear
  - a failed slideshow save keeping the typed name
  - rename followed by a collection request using the new name
  - viewer arrow keys, Escape and focus return
  - a failed delete keeping the photo
  - an upload with partial failure
- Browser checks: scripted Playwright checks ran against a mock API in Chrome.
  The mock serves cacheable images, like the real image CDN. The checks ran in
  both color schemes, and all pass. They cover:
  - the scheme following the system, the toggle, persistence across reload, and
    the no-flash script
  - slideshow autoplay advancing with visible photos
  - search, sort, filters, no-results and saved slideshows (including missing
    photos)
  - selection and save failures
  - delete failure and success
  - broken and slow images
  - upload partial failure, retry and keeping files after closing
  - slideshow keyboard control
  - editor resize keeping the drawing, and `/edit` recovery
  - refresh on `/album_display`
  - the mobile collections drawer
  - closing the menu before showing the auth dialog
- No horizontal overflow at 360, 390, 768, 1024 and 1440px. The slideshow was
  checked in portrait and landscape on a phone viewport.
- Text contrast: every text color on every surface is at least 4.5:1 in both
  schemes (the lowest is turquoise links on the selected surface in light mode,
  4.54:1).

## Backend dependencies and open issues

- **Saved slideshows store filenames.** `/api/rename-image` does not update the
  preset sheet, so a renamed photo drops out of saved slideshows that included
  it. The viewer says so after a rename when slideshows exist, and the applied
  slideshow keeps the photo for the current session. A real fix needs a stable
  photo id, or a backend update on rename.
- **`/api/preset-images` ignores the user.** It filters by preset name only, so
  two users with the same preset name would see each other's images.
- **`/api/update-collection` rejects an empty collection,** so photos can't be
  moved back to "Unfiled".
- **Deletion can't be undone,** and the confirmation says so. There is no Trash
  or Undo endpoint.
- **Same-name uploads replace the existing photo.** The server uses
  `useUniqueFileName: false`. The upload dialog warns about this, and the editor
  explains that saving under the current name replaces the original.
- **Blank images on the live site** (seen during review) were not reproduced
  locally. The client now ends every load as loaded or as a failure with Retry,
  so tiles are never left blank indefinitely. The CDN or ImageKit behavior still
  needs checking against production.
- **Auth is still a client flag** in localStorage (unchanged by this pass).
