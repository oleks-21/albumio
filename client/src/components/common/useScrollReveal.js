import { useEffect, useRef, useState } from 'react';

/*
 * Zero-dependency scroll-reveal.
 * Returns a ref to attach and a `visible` flag that flips true once the
 * element scrolls into view. Purely presentational.
 */
export default function useScrollReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Respect users who prefer reduced motion — show immediately.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    // If the element is already scrolled past (above the viewport) on mount,
    // reveal it immediately — the observer never fires for fully-above nodes,
    // which would otherwise leave it hidden forever (e.g. reload mid-page).
    if (node.getBoundingClientRect().bottom < 0) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, visible];
}
