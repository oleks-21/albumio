import { useCallback, useEffect, useRef, useState } from 'react';
import { eventApi } from './eventApi';

export const REFRESH_MS = 60 * 1000;

/**
 * Runs `callback` every `ms` while the page is visible, and once whenever it
 * becomes visible again (phones resuming the browser). Polling keeps guest
 * galleries and signed URLs fresh without real-time infrastructure.
 */
export function useVisibleRefresh(callback, ms, enabled) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (!enabled) return undefined;
    const visible = () => document.visibilityState !== 'hidden';
    const timer = setInterval(() => { if (visible()) saved.current(); }, ms);
    const onVisibility = () => { if (visible()) saved.current(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ms, enabled]);
}

/** The event record and the viewer's effective capabilities. */
export function useEvent(albumId, guestToken, enabled = true) {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (!enabled) return;
    if (!quiet) setLoading(true);
    try {
      setEvent(await eventApi.get(albumId, guestToken));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [albumId, guestToken, enabled]);

  useEffect(() => { reload(); }, [reload]);
  useVisibleRefresh(() => reload({ quiet: true }), REFRESH_MS, enabled);

  return { event, setEvent, error, loading, reload };
}

const mergeById = (pages) => {
  const seen = new Set();
  return pages.flat().filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
};

/**
 * Paginated event photos (newest first). Refreshing re-reads from the start
 * until it covers what is already loaded, so new uploads appear, hidden or
 * removed photos disappear, and nothing is skipped or duplicated. Each
 * refresh also renews the short-lived signed URLs.
 */
export function useEventPhotos(albumId, guestToken, enabled) {
  const [photos, setPhotos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedCount = useRef(0);
  const generation = useRef(0);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!enabled) return;
    const gen = ++generation.current;
    if (!quiet) setLoading(true);
    try {
      const pages = [];
      let next = null;
      let total = 0;
      do {
        // eslint-disable-next-line no-await-in-loop
        const page = await eventApi.listPhotos(albumId, next, guestToken);
        pages.push(page.photos);
        total += page.photos.length;
        next = page.nextCursor;
      } while (next && total < loadedCount.current);
      if (gen !== generation.current) return;
      const merged = mergeById(pages);
      loadedCount.current = merged.length;
      setPhotos(merged);
      setCursor(next);
      setError(null);
    } catch (err) {
      if (gen === generation.current) setError(err);
    } finally {
      if (gen === generation.current && !quiet) setLoading(false);
    }
  }, [albumId, guestToken, enabled]);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const page = await eventApi.listPhotos(albumId, cursor, guestToken);
      setPhotos((prev) => {
        const merged = mergeById([prev, page.photos]);
        loadedCount.current = merged.length;
        return merged;
      });
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [albumId, cursor, guestToken]);

  useEffect(() => {
    loadedCount.current = 0;
    setPhotos([]);
    refresh();
  }, [refresh]);
  useVisibleRefresh(() => refresh({ quiet: true }), REFRESH_MS, enabled);

  /** Re-authorize one photo's media URLs (e.g. after an image failed to load). */
  const refreshMedia = useCallback(async (photoId) => {
    try {
      const fresh = await eventApi.media(albumId, photoId, guestToken);
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...fresh } : p)));
    } catch (err) {
      if (err.status === 404) setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      else if (err.status === 401 || err.status === 403) setError(err);
    }
  }, [albumId, guestToken]);

  const replacePhoto = useCallback((photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? photo : p)));
  }, []);
  const dropPhoto = useCallback((photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    loadedCount.current = Math.max(0, loadedCount.current - 1);
  }, []);

  return { photos, hasMore: Boolean(cursor), loading, error, refresh, loadMore, refreshMedia, replacePhoto, dropPhoto };
}
