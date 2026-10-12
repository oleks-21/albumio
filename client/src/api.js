import store from './store/store';

/**
 * Central API access layer.
 *
 * All backend calls go through here so the base URL lives in exactly one place
 * (configurable per environment) and every request shares timeout and error
 * handling. Personal-library calls identify the account by email, as they
 * always have; only event-album calls send a bearer token.
 */
export const API_BASE =
  process.env.REACT_APP_API_URL || 'https://albumio-backend.onrender.com';

const DEFAULT_TIMEOUT = 20000;

/** An API failure with the server's status and machine-readable code. */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function send(path, { timeout, headers, ...options }, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error('Network error. Please check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * fetch wrapper with a timeout and optional bearer authentication.
 *
 * `auth`:
 *   'none' (default) — no Authorization header (personal-library calls).
 *   'host'           — the signed-in host's event-album token from /api/login.
 *   { guest: token } — an event guest session token.
 *
 * Throws an Error with a useful message on network failure.
 */
export async function request(path, { timeout = DEFAULT_TIMEOUT, auth = 'none', headers = {}, ...options } = {}) {
  let token = null;
  if (auth && auth.guest) token = auth.guest;
  else if (auth === 'host') token = store.getState().user.hostToken || null;
  return send(path, { timeout, headers, ...options }, token);
}

export async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/** The server's user-facing message, from either error shape it uses. */
export const errorMessage = (body, fallback) => body?.error?.message || body?.message || fallback;

/**
 * JSON request that resolves to the parsed body or throws an ApiError with
 * the server's message. `fallback` is used when the server sends none.
 */
export async function apiJson(path, { json, fallback = 'Something went wrong. Please try again.', ...options } = {}) {
  const init = { ...options };
  if (json !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...options.headers };
    init.body = JSON.stringify(json);
  }
  const res = await request(path, init);
  if (res.status === 204) return null;
  const body = await readJson(res);
  if (!res.ok) throw new ApiError(errorMessage(body, fallback), res.status, body?.error?.code);
  return body;
}

/** Build a full URL for the rare caller that needs it directly. */
export const apiUrl = (path) => `${API_BASE}${path}`;
