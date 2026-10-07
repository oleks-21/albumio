import { createTheme } from '@mui/material/styles';

/*
 * "The Memory Gallery" semantic tokens. Warm paper surfaces for browsing and
 * organizing, charcoal for full-image viewing, deep teal for actions.
 * The same values are mirrored as CSS custom properties in index.css so page
 * CSS and MUI `sx` share one palette.
 */
export const tokens = {
  page: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceSubtle: '#ECE9E2',
  text: '#202723',
  textSecondary: '#5D665F',
  accent: '#246653',
  accentHover: '#194B3D',
  selected: '#E5EFE9',
  border: '#D8DDD5',
  viewerBg: '#151918',
  viewerSurface: '#1F2523',
  viewerText: '#F6F4EF',
  viewerTextSecondary: '#B9C0BA',
  destructive: '#B42318',
};

export const radius = { control: 8, card: 12, dialog: 16 };

export const fonts = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

// Fixed header height per breakpoint; the spacer in App.js uses the same values.
export const HEADER_HEIGHT = { xs: 64, md: 72 };

const focusRing = (color) => ({ outline: `2px solid ${color}`, outlineOffset: 2 });

const shared = {
  shape: { borderRadius: radius.control },
  typography: {
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
  },
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
});

const sharedComponents = componentsFor(focusRing(tokens.accent));

const theme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: tokens.accent, dark: tokens.accentHover, contrastText: '#FFFFFF' },
    secondary: { main: tokens.text },
    error: { main: tokens.destructive },
    background: { default: tokens.page, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.textSecondary },
    divider: tokens.border,
    action: { selected: tokens.selected },
  },
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.page, color: tokens.text },
      },
    },
    MuiButton: {
      ...sharedComponents.MuiButton,
      styleOverrides: {
        ...sharedComponents.MuiButton.styleOverrides,
        outlined: {
          borderColor: tokens.border,
          color: tokens.text,
          backgroundColor: tokens.surface,
          '&:hover': { borderColor: tokens.textSecondary, backgroundColor: tokens.surface },
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
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});

/** Dark theme for full-image surfaces: preview, slideshow. */
export const viewerTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#7CC4AC', dark: '#5EA98F', contrastText: tokens.viewerBg },
    error: { main: '#F97066' },
    background: { default: tokens.viewerBg, paper: tokens.viewerSurface },
    text: { primary: tokens.viewerText, secondary: tokens.viewerTextSecondary },
    divider: 'rgba(246, 244, 239, 0.14)',
  },
  components: {
    ...componentsFor(focusRing(tokens.viewerText)),
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});

export default theme;
