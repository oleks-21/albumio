import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import store, { login, logout } from './store/store';

const PHOTOS = [
  { name: 'beach.jpg', url: 'https://img.test/beach.jpg', collection: 'Summer' },
  { name: 'cabin.jpg', url: 'https://img.test/cabin.jpg', collection: 'Winter' },
  { name: 'dunes.jpg', url: 'https://img.test/dunes.jpg', collection: 'Summer' },
];

const json = (body, status = 200) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

/**
 * Minimal fake backend. `overrides` maps "METHOD /path" to a handler that
 * receives the parsed JSON body (or FormData) and returns a response promise.
 */
function mockApi(overrides = {}) {
  const calls = [];
  // Server-side state, so refetches after a mutation see the change.
  let photos = PHOTOS.map((p) => ({ ...p }));
  global.fetch = jest.fn((url, options = {}) => {
    const { pathname } = new URL(url);
    const method = options.method || 'GET';
    let body = options.body;
    if (typeof body === 'string') body = JSON.parse(body);
    calls.push({ method, pathname, body });
    const key = `${method} ${pathname}`;
    if (overrides[key]) return overrides[key](body);
    switch (key) {
      case 'GET /api/my-images': return json(photos);
      case 'POST /api/rename-image':
        photos = photos.map((p) => (p.name === body.oldName ? { ...p, name: body.newName } : p));
        return json({ success: true });
      case 'GET /api/user-presets': return json(['Favourites']);
      case 'GET /api/user-name': return json({ name: 'Test User' });
      case 'GET /api/preset-images': return json({ imageIds: ['cabin.jpg'] });
      default: return json({ success: true });
    }
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

// jsdom has no matchMedia, so the viewer renders its phone layout with
// details collapsed behind a toggle.
const openDetails = (viewer) =>
  fireEvent.click(within(viewer).getByRole('button', { name: 'Details and editing' }));

// Read the grid straight from the DOM so it still works while a dialog makes
// the page aria-hidden.
const visibleNames = () =>
  [...document.querySelectorAll('.library-grid .photo-card__open')].map((b) => b.getAttribute('data-photo-name'));

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  store.dispatch(logout());
  jest.restoreAllMocks();
});

describe('homepage', () => {
  test('shows the product promise and opens registration from the hero', async () => {
    mockApi();
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /Your photos\. Beautifully together\./ })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Create your gallery' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Name/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });
});

describe('library', () => {
  beforeEach(() => store.dispatch(login('tester@example.com')));

  test('defaults to all photos and filters collections without touching the grid selection', async () => {
    mockApi();
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    expect(visibleNames()).toEqual(['beach.jpg', 'cabin.jpg', 'dunes.jpg']);

    // Start a selection, then filter: selection count must not change.
    fireEvent.click(screen.getByRole('button', { name: 'Select cabin.jpg' }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Summer/ }));
    expect(visibleNames()).toEqual(['beach.jpg', 'dunes.jpg']);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 3 photos in Summer/)).toBeInTheDocument();

    // Selecting more photos never filters the library.
    fireEvent.click(screen.getByRole('button', { name: 'Select beach.jpg' }));
    expect(visibleNames()).toEqual(['beach.jpg', 'dunes.jpg']);
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel selection' }));
    expect(screen.getByRole('checkbox', { name: /Summer/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('a failed slideshow save keeps the dialog and the typed name', async () => {
    mockApi({ 'POST /api/save-preset': () => json({ success: false, message: 'Error saving preset' }, 500) });
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select beach.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save slideshow' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Slideshow name/), { target: { value: 'Beach days' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save slideshow' }));
    expect(await within(dialog).findByText('Error saving preset')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Slideshow name/)).toHaveValue('Beach days');
  });

  test('applying a saved slideshow shows its context and a collection filter clears it', async () => {
    mockApi();
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    fireEvent.click(await screen.findByRole('button', { name: 'Favourites' }));
    expect(await screen.findByText('Saved slideshow: Favourites')).toBeInTheDocument();
    expect(visibleNames()).toEqual(['cabin.jpg']);
    fireEvent.click(screen.getByRole('checkbox', { name: /Summer/ }));
    expect(screen.queryByText('Saved slideshow: Favourites')).not.toBeInTheDocument();
  });

  test('rename updates the library and later requests use the new name', async () => {
    const calls = mockApi();
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    fireEvent.click(screen.getByRole('button', { name: 'Open beach.jpg' }));
    const viewer = await screen.findByRole('dialog');
    openDetails(viewer);

    fireEvent.change(within(viewer).getByLabelText('File name'), { target: { value: 'sunset.jpg' } });
    fireEvent.click(within(viewer).getByRole('button', { name: 'Save name' }));
    expect(await within(viewer).findByText(/^Name saved/)).toBeInTheDocument();
    expect(within(viewer).getByRole('heading', { name: 'sunset.jpg' })).toBeInTheDocument();

    fireEvent.change(within(viewer).getByRole('combobox', { name: 'Collection' }), { target: { value: 'Coast' } });
    fireEvent.click(within(viewer).getByRole('button', { name: 'Save collection' }));
    await within(viewer).findByText('Moved to “Coast”.');

    const rename = calls.find((c) => c.pathname === '/api/rename-image');
    const move = calls.find((c) => c.pathname === '/api/update-collection');
    expect(rename.body).toMatchObject({ oldName: 'beach.jpg', newName: 'sunset.jpg' });
    expect(move.body).toMatchObject({ imageName: 'sunset.jpg', newCollection: 'Coast' });
  });

  test('viewer supports arrow navigation and Escape, returning focus to the thumbnail', async () => {
    mockApi();
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    const thumb = screen.getByRole('button', { name: 'Open beach.jpg' });
    fireEvent.click(thumb);
    const viewer = await screen.findByRole('dialog');
    expect(within(viewer).getByText('1 of 3')).toBeInTheDocument();
    fireEvent.keyDown(viewer, { key: 'ArrowRight' });
    expect(within(viewer).getByRole('heading', { name: 'cabin.jpg' })).toBeInTheDocument();
    fireEvent.keyDown(viewer, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open beach.jpg' })).toHaveFocus());
  });

  test('a failed delete keeps the photo visible', async () => {
    mockApi({ 'DELETE /api/delete-image': () => json({ success: false, message: 'Failed to delete image.' }, 500) });
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    fireEvent.click(screen.getByRole('button', { name: 'More actions for dunes.jpg' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete photo' }));
    const confirm = await screen.findByRole('dialog');
    expect(within(confirm).getByText('dunes.jpg')).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete photo' }));
    expect(await within(confirm).findByText('Failed to delete image.')).toBeInTheDocument();
    expect(visibleNames()).toContain('dunes.jpg');
  });

  test('uploads report partial failure and keep the failed file for retry', async () => {
    mockApi({
      'POST /api/upload-image': (form) => {
        const name = form.get('fileName');
        return name === 'bad.jpg'
          ? json({ success: false, message: 'Failed to upload image.' }, 500)
          : json({ success: true, name, url: `https://img.test/${name}` });
      },
    });
    renderAt('/album_display');
    await screen.findByRole('list', { name: 'Photos' });
    fireEvent.click(screen.getByRole('button', { name: 'Add photos' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add photos' });
    const input = dialog.querySelector('input[type=file][accept="image/*"]');
    const file = (name) => new File(['x'], name, { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file('good.jpg'), file('bad.jpg')] } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: /Collection/ }), { target: { value: 'Trip' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload 2 photos' }));

    expect(await within(dialog).findByText(/1 uploaded, 1 failed/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Failed to upload image\./)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    // The successful upload is in the library immediately, with its collection counted.
    expect(screen.getByRole('checkbox', { name: /Trip/, hidden: true })).toBeInTheDocument();
  });
});
