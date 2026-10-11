/**
 * The host sign-in client. Production uses Firebase Authentication; tests
 * install a fake with `setAuthClient` before rendering.
 *
 * Interface: onChange(cb) → unsubscribe, signIn, register, resetPassword,
 * sendVerification, reloadUser, signOut, getIdToken(forceRefresh).
 */
let client = null;

export function setAuthClient(next) {
  client = next;
}

export function getAuthClient() {
  if (!client) {
    // Loaded lazily so tests that install a fake never initialize Firebase.
    // eslint-disable-next-line global-require
    client = require('./firebaseAuthClient').createFirebaseAuthClient();
  }
  return client;
}
