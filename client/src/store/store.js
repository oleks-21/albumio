import { configureStore, createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'albumio.auth';

/**
 * Rehydrate auth from localStorage so a page refresh doesn't drop the session
 * (which would bounce the user out of protected routes).
 *
 * NOTE: this is a UX convenience, not security. There is no server-issued
 * token — `isLoggedIn` is a client flag. Real auth requires backend sessions.
 */
const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return { email: parsed.email, isLoggedIn: Boolean(parsed.isLoggedIn) };
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return undefined;
};

const userSlice = createSlice({
  name: 'user',
  initialState: loadAuth() || {
    email: '',
    isLoggedIn: false,
  },
  reducers: {
    login: (state, action) => {
      state.email = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.email = '';
      state.isLoggedIn = false;
    },
  },
});

export const { login, logout } = userSlice.actions;

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable (private mode / disabled) — non-fatal */
  }
});

export default store;
