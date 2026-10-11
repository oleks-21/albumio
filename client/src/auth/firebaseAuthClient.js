import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
};

const friendly = (err) => new Error(MESSAGES[err?.code] || 'Something went wrong. Please try again.');

const toUser = (u) => ({ uid: u.uid, email: u.email || '', name: u.displayName || '', emailVerified: u.emailVerified });

/** Auth client used when no Firebase web config is present (e.g. a misconfigured build). */
function unconfiguredClient() {
  const unavailable = async () => {
    throw new Error('Sign-in isn’t available right now. Please try again later.');
  };
  return {
    onChange(cb) {
      cb(null);
      return () => {};
    },
    signIn: unavailable,
    register: unavailable,
    resetPassword: unavailable,
    sendVerification: unavailable,
    reloadUser: unavailable,
    signOut: async () => {},
    getIdToken: async () => null,
  };
}

/**
 * Firebase Authentication for hosts. The browser holds the Firebase session;
 * the API verifies each ID token itself and never trusts client claims.
 */
export function createFirebaseAuthClient() {
  if (!config.apiKey || !config.projectId) return unconfiguredClient();
  const auth = getAuth(initializeApp(config));
  if (process.env.REACT_APP_FIREBASE_AUTH_EMULATOR) {
    connectAuthEmulator(auth, process.env.REACT_APP_FIREBASE_AUTH_EMULATOR, { disableWarnings: true });
  }

  return {
    onChange(cb) {
      return onAuthStateChanged(auth, (user) => cb(user ? toUser(user) : null));
    },
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        throw friendly(err);
      }
    },
    async register(name, email, password) {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        throw friendly(err);
      }
      await updateProfile(credential.user, { displayName: name }).catch(() => {});
      await sendEmailVerification(credential.user).catch(() => {});
      // Refresh so the ID token carries the display name.
      await credential.user.getIdToken(true).catch(() => {});
      return toUser(credential.user);
    },
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        if (err?.code === 'auth/user-not-found') return; // don't reveal which emails exist
        throw friendly(err);
      }
    },
    async sendVerification() {
      if (!auth.currentUser) return;
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (err) {
        throw friendly(err);
      }
    },
    async reloadUser() {
      if (!auth.currentUser) return null;
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      return toUser(auth.currentUser);
    },
    signOut: () => signOut(auth),
    async getIdToken(forceRefresh = false) {
      return auth.currentUser ? auth.currentUser.getIdToken(forceRefresh) : null;
    },
  };
}
