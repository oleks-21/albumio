/**
 * Central API access layer.
 *
 * All backend calls go through here so the base URL lives in exactly one place
 * (configurable per environment) and every request shares timeout + error
 * handling. Previously the Render URL was hardcoded in 8 components.
 */
export const API_BASE =
  process.env.REACT_APP_API_URL || 'https://albumio-backend.onrender.com';

const DEFAULT_TIMEOUT = 20000;

/**
 * fetch wrapper with a timeout and JSON convenience.
 * Throws an Error with a useful message on network/HTTP failure so callers can
 * surface it to the user instead of swallowing it in console.error.
 */
export async function request(path, { timeout = DEFAULT_TIMEOUT, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error('Network error. Please check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

/** Build a full URL for the rare caller that needs it directly. */
export const apiUrl = (path) => `${API_BASE}${path}`;
