import { configureStore, createSlice } from '@reduxjs/toolkit';

/**
 * Mirrors the host's Firebase sign-in state for the UI. It never decides
 * authorization: the API verifies an ID token on every request.
 *
 * status: 'loading' until Firebase reports the initial state, then
 * 'signedIn' | 'signedOut'. libraryStatus comes from /api/me ('ready', or a
 * reason the personal library is waiting, e.g. 'email_verification_required').
 */
const signedOut = {
  status: 'signedOut',
  isLoggedIn: false,
  uid: '',
  email: '',
  name: '',
  emailVerified: false,
  libraryStatus: 'unknown',
  features: { eventAlbums: false },
};

const userSlice = createSlice({
  name: 'user',
  initialState: { ...signedOut, status: 'loading' },
  reducers: {
    authChanged: (state, action) => {
      const user = action.payload;
      if (!user) return signedOut;
      const switched = state.uid !== user.uid;
      return {
        ...state,
        status: 'signedIn',
        isLoggedIn: true,
        uid: user.uid,
        email: user.email,
        name: user.name || (switched ? '' : state.name),
        emailVerified: user.emailVerified,
        ...(switched ? { libraryStatus: 'unknown', features: signedOut.features } : {}),
      };
    },
    profileLoaded: (state, action) => {
      const { name, libraryStatus, features, emailVerified } = action.payload;
      if (name) state.name = name;
      if (typeof emailVerified === 'boolean') state.emailVerified = emailVerified;
      state.libraryStatus = libraryStatus;
      state.features = { ...signedOut.features, ...features };
    },
  },
});

export const { authChanged, profileLoaded } = userSlice.actions;

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

export default store;
