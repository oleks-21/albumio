import { useCallback, useEffect, useRef, useState } from 'react';

const LOAD_TIMEOUT_MS = 20000;

/**
 * Tracks one <img>'s lifecycle so the UI never shows an indefinitely blank
 * tile: 'loading' → 'loaded' | 'error'. A load that hasn't finished within the
 * timeout counts as an error. `retry()` re-requests with a cache-busting param.
 */
export default function useImageStatus(src, { timeout = LOAD_TIMEOUT_MS } = {}) {
  const [status, setStatus] = useState(src ? 'loading' : 'error');
  const [attempt, setAttempt] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
    setAttempt(0);
  }, [src]);

  useEffect(() => {
    if (status !== 'loading') return undefined;
    timer.current = setTimeout(() => setStatus('error'), timeout);
    return () => clearTimeout(timer.current);
  }, [status, attempt, timeout]);

  const onLoad = useCallback(() => setStatus('loaded'), []);
  const onError = useCallback(() => setStatus('error'), []);
  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
    setStatus('loading');
  }, []);

  let requestSrc = src;
  if (src && attempt > 0) {
    requestSrc = `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;
  }

  // `key` remounts the <img> per attempt so the browser actually re-requests.
  return { status, onLoad, onError, retry, src: requestSrc, key: `${src}#${attempt}` };
}
