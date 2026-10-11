/**
 * Guest sessions live in sessionStorage, per album: they survive a refresh of
 * this tab but not the browser session. They are never put in Redux,
 * localStorage or URLs.
 */
const key = (albumId) => `albumio.guest.${albumId}`;

const read = (albumId) => {
  try {
    return JSON.parse(sessionStorage.getItem(key(albumId)) || 'null');
  } catch {
    return null;
  }
};

const write = (albumId, value) => {
  try {
    sessionStorage.setItem(key(albumId), JSON.stringify(value));
  } catch {
    /* storage unavailable: the session lasts until this page unloads */
  }
};

export function loadGuestSession(albumId) {
  const session = read(albumId);
  if (!session?.token) return null;
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    clearGuestSession(albumId);
    return null;
  }
  return session;
}

export function saveGuestSession(albumId, { token, expiresAt }) {
  const previous = read(albumId);
  write(albumId, { token, expiresAt, displayName: previous?.displayName || '' });
}

export function saveGuestName(albumId, displayName) {
  const session = read(albumId);
  if (session) write(albumId, { ...session, displayName });
}

export function clearGuestSession(albumId) {
  try {
    sessionStorage.removeItem(key(albumId));
  } catch {
    /* ignore */
  }
}
