import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import store, { login, logout } from '../../store/store';

// QR codes are drawn locally with this library; jsdom has no canvas.
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(async () => 'data:image/png;base64,QR'),
  toCanvas: jest.fn(async () => {}),
}));

const SECRET = 'S'.repeat(43);
const HOST_TOKEN = 'albh_payload.signature';
const GUEST_TOKEN = `albg_${'g'.repeat(43)}`;

const json = (body, status = 200) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, headers: new Headers(), json: () => Promise.resolve(body) });
const apiError = (status, code, message) => json({ error: { code, message } }, status);

const photo = (id, extra = {}) => ({
  id,
  width: 800,
  height: 600,
  uploadedAt: Date.UTC(2026, 5, 20, 18, 0),
  contributorName: 'Rowan',
  caption: '',
  thumbUrl: `https://media.test/${id}/thumb?sig=1`,
  previewUrl: `https://media.test/${id}/preview?sig=1`,
  urlsExpireAt: Date.now() + 120000,
  ...extra,
});

const hostCaps = { role: 'host', canManage: true, canAdd: true, canView: true, canDownload: true, uploadsClosed: false };
const guestCaps = (perms) => ({ role: 'guest', canManage: false, uploadsClosed: false, ...perms });

const hostEvent = (extra = {}) => ({
  id: 'evt12345',
  title: 'Maya & Theo',
  eventDate: '2026-06-20',
  capabilities: hostCaps,
  photoCount: 0,
  cover: null,
  status: 'active',
  uploadsOpen: true,
  guestAccessEnabled: true,
  visibleCount: 0,
  hiddenCount: 0,
  usage: { photos: 0, bytes: 0, reservedPhotos: 0, maxPhotos: 2000, maxBytes: 5 * 1024 ** 3 },
  signedUrlSeconds: 120,
  version: 1,
  ...extra,
});

/** Fake API: `routes` maps "METHOD /path" (regex source allowed) to handlers. */
function mockApi(routes) {
  const calls = [];
  global.fetch = jest.fn((url, options = {}) => {
    const { pathname, search } = new URL(url);
    const method = options.method || 'GET';
    let body = options.body;
    if (typeof body === 'string') body = JSON.parse(body);
    calls.push({ method, pathname, search, body, authorization: options.headers?.Authorization });
    const key = `${method} ${pathname}`;
    const match = Object.keys(routes).find((k) => k === key || new RegExp(`^${k}$`).test(key));
    if (match) return routes[match](body, { pathname, search });
    if (key === 'GET /api/features') return json({ eventAlbums: true });
    if (key === 'GET /api/user-name') return json({ name: 'Hana' });
    return apiError(404, 'not_found', 'Not found.');
  });
  return calls;
}

function renderAt(path) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    </Provider>
  );
}

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
  // eslint-disable-next-line no-undef
  if (!global.Headers) global.Headers = class { get() { return null; } };
});

afterEach(() => {
  store.dispatch(logout());
  sessionStorage.clear();
  jest.restoreAllMocks();
});

describe('host', () => {
  beforeEach(() => {
    store.dispatch(login({ email: 'hana@example.com', token: HOST_TOKEN, expiresAt: Date.now() + 3600000 }));
  });

  test('creates an event and gets a one-time link with a QR code', async () => {
    let created = null;
    const invitations = [];
    const calls = mockApi({
      'GET /api/events': () => json({ events: created ? [created] : [] }),
      'POST /api/events': (body) => { created = hostEvent({ title: body.title }); return json({ event: created }, 201); },
      'GET /api/events/evt12345': () => json({ event: created }),
      'GET /api/events/evt12345/photos': () => json({ photos: [], nextCursor: null }),
      'GET /api/events/evt12345/invitations': () => json({ invitations }),
      'POST /api/events/evt12345/invitations': (body) => {
        const invitation = { id: 'inv12345', label: body.label, canAdd: body.canAdd, canView: body.canView, canDownload: body.canDownload, createdAt: Date.now(), expiresAt: body.expiresAt, revokedAt: null, state: 'active' };
        invitations.unshift(invitation);
        return json({ invitation, token: SECRET, joinPath: `/join#invite=${SECRET}` }, 201);
      },
    });
    renderAt('/events');
    fireEvent.click(await screen.findByRole('button', { name: 'Create event album' }));
    const createDialog = await screen.findByRole('dialog', { name: 'Create event album' });
    fireEvent.change(within(createDialog).getByLabelText(/Event title/), { target: { value: 'Maya & Theo' } });
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Create album' }));

    // A new album opens straight into inviting guests.
    const invite = await screen.findByRole('dialog', { name: 'Invite guests' });
    expect(within(invite).getByText('Anyone with this link has these permissions.')).toBeInTheDocument();
    const download = within(invite).getByRole('checkbox', { name: 'Can download originals' });
    expect(download).not.toBeChecked();
    fireEvent.click(within(invite).getByRole('checkbox', { name: 'Can view the album' }));
    expect(within(invite).getByRole('checkbox', { name: 'Can download originals' })).toBeDisabled();
    fireEvent.click(within(invite).getByRole('checkbox', { name: 'Can view the album' }));
    fireEvent.change(within(invite).getByLabelText('Link name'), { target: { value: 'Reception QR' } });
    fireEvent.click(within(invite).getByRole('button', { name: 'Create link' }));

    expect(await within(invite).findByText(`http://localhost/join#invite=${SECRET}`)).toBeInTheDocument();
    expect(within(invite).getByRole('img', { name: /QR code/ })).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(within(invite).getByText(/shown only once/)).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST' && c.pathname.endsWith('/invitations'));
    expect(post.body).toMatchObject({ label: 'Reception QR', canAdd: true, canView: true, canDownload: false });
    expect(post.body.expiresAt - Date.now()).toBeGreaterThan(29 * 24 * 3600 * 1000);
    expect(await within(invite).findByText(/Add · View · Expires/)).toBeInTheDocument();
    // Every host call is authenticated.
    calls.filter((c) => c.pathname.startsWith('/api/events')).forEach((c) => expect(c.authorization).toBe(`Bearer ${HOST_TOKEN}`));
  });

  test('hides a photo from guests and shows guest attribution', async () => {
    let photos = [photo('p1', { originalName: 'IMG_1.jpg', hidden: false, isCover: true, contributor: { type: 'guest', sessionId: 's1' } })];
    const calls = mockApi({
      'GET /api/events/evt12345': () => json({ event: hostEvent({ photoCount: 1 }) }),
      'GET /api/events/evt12345/photos': () => json({ photos, nextCursor: null }),
      'PATCH /api/events/evt12345/photos/p1': (body) => {
        photos = [{ ...photos[0], hidden: body.hidden, isCover: false }];
        return json({ photo: photos[0] });
      },
    });
    renderAt('/events/evt12345');
    expect(await screen.findByText(/Rowan · /)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'More actions for IMG_1.jpg' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide from guests' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH' && c.body?.hidden === true)).toBe(true));
    expect(await screen.findByText('Hidden')).toBeInTheDocument();
  });
});

describe('guest', () => {
  beforeEach(() => store.dispatch(logout()));

  test('joining strips the secret, keeps the session out of localStorage, and an upload-only guest sees no gallery', async () => {
    window.history.replaceState(null, '', `/join#invite=${SECRET}`);
    let attempts = 0;
    const calls = mockApi({
      'POST /api/event-invitations/exchange': (body) => (body.token === SECRET
        ? json({ token: GUEST_TOKEN, expiresAt: Date.now() + 3600000, albumId: 'evt12345' })
        : apiError(404, 'invitation_invalid', 'Invalid.')),
      'GET /api/events/evt12345': () => json({ event: { id: 'evt12345', title: 'Maya & Theo', eventDate: '2026-06-20', capabilities: guestCaps({ canAdd: true, canView: false, canDownload: false }) } }),
      'POST /api/events/evt12345/photos': (form) => {
        attempts += 1;
        return attempts === 1
          ? apiError(502, 'storage_failed', 'The photo couldn’t be saved. Please try again.')
          : json({ receipt: { photoId: 'p9', originalName: form.get('image').name, uploadedAt: Date.now() }, replayed: false }, 201);
      },
    });
    renderAt('/join');

    expect(await screen.findByRole('heading', { name: 'Maya & Theo' })).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(JSON.stringify(localStorage)).not.toContain(GUEST_TOKEN);
    expect(sessionStorage.getItem('albumio.guest.evt12345')).toContain(GUEST_TOKEN);
    // Minimal chrome: no account or library navigation.
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Photos' })).not.toBeInTheDocument();
    expect(screen.queryByText(/· \d+ photos?/)).not.toBeInTheDocument(); // no photo count
    expect(screen.getByText('With this invitation you can add photos.')).toBeInTheDocument();

    const panel = screen.getByRole('region', { name: 'Add your photos' });
    const input = panel.querySelector('input[type=file]');
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    fireEvent.change(input, { target: { files: [new File(['x'], 'beach.jpg', { type: 'image/jpeg' }), new File(['x'], 'IMG_2.HEIC', { type: 'image/heic' })] } });
    expect(within(panel).getByText(/HEIC photos aren’t supported yet/)).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Upload 1 photo' })).toBeDisabled();
    fireEvent.change(within(panel).getByLabelText(/Your name/), { target: { value: 'Sam' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Upload 1 photo' }));
    expect(await within(panel).findByText(/couldn’t be saved/)).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Retry' }));
    expect(await within(panel).findByText(/1 photo added to “Maya & Theo”/)).toBeInTheDocument();

    const uploads = calls.filter((c) => c.method === 'POST' && c.pathname.endsWith('/photos'));
    expect(uploads).toHaveLength(2);
    expect(uploads[0].body.get('idempotencyKey')).toBe(uploads[1].body.get('idempotencyKey'));
    expect(uploads[1].body.get('displayName')).toBe('Sam');
    uploads.forEach((c) => expect(c.authorization).toBe(`Bearer ${GUEST_TOKEN}`));
  });

  test('an invalid link gets a generic message', async () => {
    window.history.replaceState(null, '', '/join#invite=not-valid');
    mockApi({ 'POST /api/event-invitations/exchange': () => apiError(404, 'invitation_invalid', 'This invitation link isn’t valid anymore. Ask the host for a new link.') });
    renderAt('/join');
    expect(await screen.findByText(/isn’t valid anymore/)).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  test('a viewing guest without download sees no download action and is told why', async () => {
    sessionStorage.setItem('albumio.guest.evt12345', JSON.stringify({ token: GUEST_TOKEN, expiresAt: Date.now() + 3600000 }));
    mockApi({
      'GET /api/events/evt12345': () => json({ event: { id: 'evt12345', title: 'Maya & Theo', eventDate: null, photoCount: 1, cover: null, capabilities: guestCaps({ canAdd: false, canView: true, canDownload: false }) } }),
      'GET /api/events/evt12345/photos': () => json({ photos: [photo('p1')], nextCursor: null }),
    });
    renderAt('/events/evt12345');
    fireEvent.click(await screen.findByRole('button', { name: 'More actions for Photo from Rowan' }));
    expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Download original' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open' }));
    const viewer = await screen.findByRole('dialog');
    fireEvent.click(within(viewer).getByRole('button', { name: 'Details' }));
    expect(within(viewer).getByText(/Original downloads aren’t available/)).toBeInTheDocument();
    expect(within(viewer).getByText(/aren’t verified/)).toBeInTheDocument();
  });

  test('revocation while the album is open ends access with an explanation', async () => {
    sessionStorage.setItem('albumio.guest.evt12345', JSON.stringify({ token: GUEST_TOKEN, expiresAt: Date.now() + 3600000 }));
    let revoked = false;
    mockApi({
      'GET /api/events/evt12345': () => (revoked
        ? apiError(403, 'invitation_revoked', 'This invitation link has been turned off by the host.')
        : json({ event: { id: 'evt12345', title: 'Maya & Theo', photoCount: 1, cover: null, capabilities: guestCaps({ canAdd: false, canView: true, canDownload: true }) } })),
      'GET /api/events/evt12345/photos': () => (revoked
        ? apiError(403, 'invitation_revoked', 'This invitation link has been turned off by the host.')
        : json({ photos: [photo('p1')], nextCursor: null })),
      'POST /api/events/evt12345/photos/p1/media': () => apiError(403, 'invitation_revoked', 'This invitation link has been turned off by the host.'),
    });
    renderAt('/events/evt12345');
    await screen.findByRole('list', { name: 'Photos' });
    revoked = true;
    // An image failing to load asks the server again, which reports the revocation.
    fireEvent.error(document.querySelector('.photo-card__open img'));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry loading Photo from Rowan' }));
    expect(await screen.findByText('This invitation link has been turned off by the host.')).toBeInTheDocument();
    await waitFor(() => expect(sessionStorage.getItem('albumio.guest.evt12345')).toBeNull());
  });

  test('without a session the album stays private', async () => {
    mockApi({});
    renderAt('/events/evt12345');
    expect(await screen.findByText('This album is private')).toBeInTheDocument();
  });
});

describe('host without an event-album token', () => {
  test('a host who signed in before event albums is asked to log in again', async () => {
    store.dispatch(login('hana@example.com')); // an older session: no token
    mockApi({});
    renderAt('/events');
    expect(await screen.findByText('Log in again to use event albums')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log in again' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  test('an expired host token is rejected by the server and the host is asked to log in again', async () => {
    store.dispatch(login({ email: 'hana@example.com', token: HOST_TOKEN, expiresAt: Date.now() + 3600000 }));
    mockApi({ 'GET /api/events': () => apiError(401, 'invalid_token', 'Your sign-in has expired. Please sign in again.') });
    renderAt('/events');
    expect(await screen.findByText('Log in again to use event albums')).toBeInTheDocument();
  });
});
