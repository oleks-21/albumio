import { useCallback, useEffect, useState } from 'react';

const LOAD_TIMEOUT_MS = 20000;

const initial = (src, identity) => ({ src, identity, attempt: 0, status: src ? 'loading' : 'error' });

/**
 * Tracks one <img>'s lifecycle so the UI never shows an indefinitely blank
 * tile: 'loading' → 'loaded' | 'error'. A load that hasn't finished within the
 * timeout counts as an error. `retry()` re-requests with a cache-busting param.
 *
 * Spread `ref`, `onLoad` and `onError` onto the <img>. The ref matters: a
 * cached image can finish loading before React has run effects for it, so
 * the element's own `complete` flag is checked when it mounts.
 *
 * `identity` (e.g. a photo ID) marks URLs that name the same image, such as
 * refreshed signed URLs. An image that already loaded keeps its current URL
 * instead of flashing to reload; one that failed switches to the new URL.
 * Signed URLs pass `bust: false`: a cache-busting parameter would break the
 * signature, so their retries rely on the caller fetching a fresh URL.
 */
export default function useImageStatus(propSrc, { timeout = LOAD_TIMEOUT_MS, identity, bust = true } = {}) {
  const [state, setState] = useState(() => initial(propSrc, identity));

  // Reset during render when the source changes. Doing this in an effect let a
  // late-running effect overwrite a 'loaded' status that had already arrived.
  let current = state;
  if (state.src !== propSrc) {
    const keepLoaded = identity !== undefined && state.identity === identity && state.status === 'loaded';
    if (!keepLoaded) {
      current = initial(propSrc, identity);
      setState(current);
    }
  }
  const { status, attempt, src } = current;

  useEffect(() => {
    if (status !== 'loading') return undefined;
    const timer = setTimeout(
      () => setState((s) => (s.src === src && s.attempt === attempt && s.status === 'loading' ? { ...s, status: 'error' } : s)),
      timeout
    );
    return () => clearTimeout(timer);
  }, [src, status, attempt, timeout]);

  const onLoad = useCallback(
    () => setState((s) => (s.src === src && s.status !== 'loaded' ? { ...s, status: 'loaded' } : s)),
    [src]
  );
  const onError = useCallback(
    () => setState((s) => (s.src === src && s.status === 'loading' ? { ...s, status: 'error' } : s)),
    [src]
  );
  const retry = useCallback(
    () => setState((s) => ({ ...s, attempt: s.attempt + 1, status: 'loading' })),
    []
  );
  const ref = useCallback(
    (el) => {
      if (el && el.complete && el.naturalWidth > 0) onLoad();
    },
    [onLoad]
  );

  let requestSrc = src;
  if (bust && src && attempt > 0) {
    requestSrc = `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;
  }

  // `key` remounts the <img> per attempt so the browser actually re-requests.
  return { status, onLoad, onError, retry, ref, src: requestSrc, key: `${src}#${attempt}` };
}
