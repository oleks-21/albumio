// Adds jest-dom matchers like toBeInTheDocument().
import '@testing-library/jest-dom';

// jsdom has no matchMedia; MUI's color-scheme manager and useMediaQuery read it.
// Everything reports "no match", i.e. light mode and the phone layout.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}
