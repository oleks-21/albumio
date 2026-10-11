/**
 * Test doubles shared by the app tests.
 *
 * fakeAuth(user) stands in for the Firebase auth client: it reports `user`
 * (or signed out) to listeners and hands out a fixed ID token.
 */
export function fakeAuth(initialUser = null) {
  let current = initialUser;
  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb(current));
  return {
    onChange(cb) {
      listeners.add(cb);
      cb(current);
      return () => listeners.delete(cb);
    },
    async signIn(email) {
      current = { uid: 'u-signed-in', email, name: '', emailVerified: true };
      emit();
    },
    async register(name, email) {
      current = { uid: 'u-registered', email, name, emailVerified: false };
      emit();
      return current;
    },
    async signOut() {
      current = null;
      emit();
    },
    async getIdToken() {
      return current ? 'test-id-token' : null;
    },
    async resetPassword() {},
    async sendVerification() {},
    async reloadUser() {
      return current;
    },
  };
}
