import { createTheme } from '@mui/material/styles';

/*
 * "Lagoon" palette: turquoise actions, light-blue accents and aqua-tinted
 * surfaces with deep-ink text in light mode; deep-water slate in dark mode.
 *
 * The raw values live in `palettes` (MUI needs real colors to derive hover and
 * contrast shades) and are mirrored as CSS custom properties in index.css,
 * switched by the `data-theme` attribute on <html>. Components use `tokens`,
 * which are references to those variables, so every `sx` and stylesheet color
 * follows the active scheme without re-rendering.
 */
export const palettes = {
  light: {
    page: '#F2FAFB',
    surface: '#FFFFFF',
    surfaceSubtle: '#E2F2F5',
    text: '#0E2A35',
    textSecondary: '#46646F',
    accent: '#0A7782',
    accentHover: '#075C65',
    accentBright: '#22BFC4',
    onAccent: '#FFFFFF',
    sky: '#CFEAFB',
    skySoft: '#EAF6FD',
    selected: '#DCF2F3',
    border: '#CBE1E7',
    destructive: '#B42318',
    warn: '#8A5A00',
  },
  dark: {
    page: '#0A161C',
    surface: '#10222A',
    surfaceSubtle: '#183139',
    text: '#E4F4F6',
    textSecondary: '#9DBBC3',
    accent: '#3ECFD3',
    accentHover: '#76E0E3',
    accentBright: '#3ECFD3',
    onAccent: '#032429',
    sky: '#123A52',
    skySoft: '#0E2532',
    selected: '#103B42',
    border: '#24424C',
    destructive: '#FF8A80',
    warn: '#F2C46B',
  },
  // Full-image surfaces (viewer, slideshow) are dark in both schemes.
  viewer: {
    bg: '#081419',
    surface: '#0F232B',
    text: '#EAF7F8',
    textSecondary: '#A6C2C9',
    accent: '#5FD8DA',
  },
};

const v = (name) => `var(--color-${name})`;

/** Scheme-aware color references for `sx` props and inline styles. */
export const tokens = {
  page: v('page'),
  surface: v('surface'),
  surfaceSubtle: v('surface-subtle'),
  text: v('text'),
  textSecondary: v('text-secondary'),
  accent: v('accent'),
  accentHover: v('accent-hover'),
  accentBright: v('accent-bright'),
  onAccent: v('on-accent'),
  sky: v('sky'),
  skySoft: v('sky-soft'),
  selected: v('selected'),
  border: v('border'),
  destructive: v('destructive'),
  warn: v('warn'),
  headerBg: v('header-bg'),
  bandStart: v('band-start'),
  bandEnd: v('band-end'),
  viewerBg: v('viewer-bg'),
  viewerSurface: v('viewer-surface'),
  viewerText: v('viewer-text'),
  viewerTextSecondary: v('viewer-text-secondary'),
};

export const radius = { control: 8, card: 12, dialog: 16 };

export const fonts = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

// Fixed header height per breakpoint; the spacer in App.js uses the same values.
export const HEADER_HEIGHT = { xs: 64, md: 72 };

const focusRing = (color) => ({ outline: `2px solid ${color}`, outlineOffset: 2 });

const typography = {
  fontFamily: fonts.sans,
  body1: { fontSize: '1rem', lineHeight: 1.55 },
  body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  h1: { fontFamily: fonts.serif, fontWeight: 400, fontSize: '3.5rem', lineHeight: 1.08, letterSpacing: '-0.01em' },
  h2: { fontFamily: fonts.serif, fontWeight: 400, fontSize: '2.25rem', lineHeight: 1.15 },
  h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
  h4: { fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
  h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
  h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
  button: { fontWeight: 600, fontSize: '0.9375rem', letterSpacing: 0, textTransform: 'none' },
  caption: { fontSize: '0.875rem' },
};

const componentsFor = (ring) => ({
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        padding: '8px 16px',
        minHeight: 40,
        '&.Mui-focusVisible': ring,
      },
      sizeLarge: { padding: '11px 22px', minHeight: 48, fontSize: '1rem' },
      sizeSmall: { minHeight: 32 },
    },
  },
  MuiIconButton: {
    styleOverrides: { root: { '&.Mui-focusVisible': ring } },
  },
  MuiDialog: {
    styleOverrides: { paper: { borderRadius: radius.dialog, '&.MuiDialog-paperFullScreen': { borderRadius: 0 } } },
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 500 } },
  },
  MuiTooltip: {
    styleOverrides: { tooltip: { fontSize: '0.8125rem' } },
  },
  MuiPaper: {
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
});

const muiPalette = (p) => ({
  primary: { main: p.accent, dark: p.accentHover, contrastText: p.onAccent },
  secondary: { main: p.text },
  error: { main: p.destructive },
  background: { default: p.page, paper: p.surface },
  text: { primary: p.text, secondary: p.textSecondary },
  divider: p.border,
});

const appComponents = componentsFor(focusRing(tokens.accent));

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: { palette: muiPalette(palettes.light) },
    dark: { palette: muiPalette(palettes.dark) },
  },
  shape: { borderRadius: radius.control },
  typography,
  components: {
    ...appComponents,
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.page, color: tokens.text },
      },
    },
    MuiButton: {
      ...appComponents.MuiButton,
      styleOverrides: {
        ...appComponents.MuiButton.styleOverrides,
        outlined: {
          borderColor: tokens.border,
          color: tokens.text,
          backgroundColor: tokens.surface,
          '&:hover': { borderColor: tokens.accent, backgroundColor: tokens.skySoft },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: tokens.accentHover },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          borderRadius: radius.control,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.textSecondary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: tokens.accent, borderWidth: 2 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: tokens.textSecondary } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});

/** Dark theme for full-image surfaces: preview, slideshow (same in both schemes). */
export const viewerTheme = createTheme({
  shape: { borderRadius: radius.control },
  typography,
  palette: {
    mode: 'dark',
    primary: { main: palettes.viewer.accent, dark: '#3FC0C3', contrastText: palettes.viewer.bg },
    error: { main: '#F97066' },
    background: { default: palettes.viewer.bg, paper: palettes.viewer.surface },
    text: { primary: palettes.viewer.text, secondary: palettes.viewer.textSecondary },
    divider: 'rgba(234, 247, 248, 0.14)',
  },
  components: componentsFor(focusRing(palettes.viewer.text)),
});

export default theme;
