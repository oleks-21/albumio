import { configureStore, createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'albumio.auth';

/**
 * Rehydrate auth from localStorage so a page refresh doesn't drop the session
 * (which would bounce the user out of protected routes).
 *
 * NOTE: `isLoggedIn` is a client flag and the personal library is keyed by
 * email. The only server-verified credential is `hostToken`, which the API
 * issues at login and checks on event-album requests.
 */
const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      const tokenValid = typeof parsed.hostToken === 'string' && parsed.hostTokenExpiresAt > Date.now();
      return {
        email: parsed.email,
        isLoggedIn: Boolean(parsed.isLoggedIn),
        hostToken: tokenValid ? parsed.hostToken : '',
        hostTokenExpiresAt: tokenValid ? parsed.hostTokenExpiresAt : 0,
      };
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return undefined;
};

const signedOut = { email: '', isLoggedIn: false, hostToken: '', hostTokenExpiresAt: 0 };

const userSlice = createSlice({
  name: 'user',
  initialState: { ...signedOut, ...loadAuth(), features: { eventAlbums: false } },
  reducers: {
    /** payload: an email, or { email, token, expiresAt } from /api/login. */
    login: (state, action) => {
      const { email, token = '', expiresAt = 0 } =
        typeof action.payload === 'string' ? { email: action.payload } : action.payload;
      state.email = email;
      state.isLoggedIn = true;
      state.hostToken = token;
      state.hostTokenExpiresAt = expiresAt;
    },
    logout: (state) => ({ ...state, ...signedOut }),
    featuresLoaded: (state, action) => {
      state.features = { eventAlbums: Boolean(action.payload?.eventAlbums) };
    },
  },
});

export const { login, logout, featuresLoaded } = userSlice.actions;

/** True while the signed-in host holds an unexpired event-album token. */
export const selectHostReady = (state) =>
  state.user.isLoggedIn && Boolean(state.user.hostToken) && state.user.hostTokenExpiresAt > Date.now();

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

// Persist auth changes so they survive reloads.
store.subscribe(() => {
  try {
    const { user } = store.getState();
    if (user.isLoggedIn) {
      const { email, isLoggedIn, hostToken, hostTokenExpiresAt } = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, isLoggedIn, hostToken, hostTokenExpiresAt }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable (private mode / disabled) — non-fatal */
  }
});

export default store;
