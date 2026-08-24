import { createTheme } from '@mui/material/styles';

/*
 * Design tokens translated from the Cruip "Open" React template
 * (Tailwind gray + indigo scales) into a single MUI dark theme.
 * Styling only — consumed across the app so component-level color
 * hardcoding can be replaced by theme references.
 */
export const tokens = {
  // Grays (Tailwind gray-*)
  gray950: '#030712',
  gray900: '#111827',
  gray800: '#1f2937',
  gray700: '#374151',
  gray600: '#4b5563',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray300: '#d1d5db',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',
  // Indigo accent (Tailwind indigo-*)
  indigo600: '#4f46e5',
  indigo500: '#6366f1',
  indigo400: '#818cf8',
  indigo300: '#a5b4fc',
  indigo200: '#c7d2fe',
  slate400: '#94a3b8',
  // Signature muted body text: indigo-200 @ 65%
  mutedText: 'rgba(199, 210, 254, 0.65)',
  mutedTextStrong: 'rgba(199, 210, 254, 0.75)',
};

// Reusable gradients / effects
export const gradients = {
  // Animated multi-stop heading gradient (gray <-> indigo)
  heading:
    'linear-gradient(to right, #e5e7eb, #c7d2fe, #f9fafb, #a5b4fc, #e5e7eb)',
  // Primary button (indigo, bottom-anchored so hover can "grow" it)
  primaryButton: 'linear-gradient(to top, #4f46e5, #6366f1)',
  // Secondary / dark button surface
  darkButton: `linear-gradient(to bottom, ${tokens.gray800}, rgba(31, 41, 55, 0.6))`,
  // Hairline gradient border (used via border-image or ::before mask)
  hairline: `linear-gradient(to right, ${tokens.gray800}, ${tokens.gray700}, ${tokens.gray800})`,
  // Faint section divider
  divider:
    'linear-gradient(to right, transparent, rgba(148, 163, 184, 0.25), transparent)',
};

// Gradient hairline border, applied as an `&::before` sx object (mask trick).
export const hairlineBorder = {
  content: '""',
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
  padding: '1px',
  background: gradients.hairline,
  WebkitMask:
    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'xor',
  maskComposite: 'exclude',
  pointerEvents: 'none',
};

// Reusable card surface (rounded panel + translucent fill + hairline border).
export const cardSurface = {
  position: 'relative',
  backgroundColor: 'rgba(17, 24, 39, 0.5)',
  borderRadius: '16px',
  '&::before': hairlineBorder,
};

// Inset highlight that gives the primary button its "lit from top" look
const primaryInsetHighlight = 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.16)';

const fontFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokens.indigo500,
      dark: tokens.indigo600,
      light: tokens.indigo400,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tokens.indigo200,
    },
    background: {
      default: tokens.gray950,
      paper: tokens.gray900,
    },
    text: {
      primary: tokens.gray200,
      secondary: tokens.mutedText,
    },
    divider: 'rgba(148, 163, 184, 0.25)',
  },

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily,
    // Body — Tailwind --text-base (15px) with tight tracking
    fontSize: 15,
    body1: { fontSize: '0.9375rem', lineHeight: 1.5333, letterSpacing: '-0.0125em' },
    body2: { fontSize: '0.875rem', lineHeight: 1.5715 },
    // Headings: Inter semibold, progressively tighter tracking
    h1: { fontWeight: 600, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-0.0268em' },
    h2: { fontWeight: 600, fontSize: '2.5rem', lineHeight: 1.1, letterSpacing: '-0.0268em' },
    h3: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.3571, letterSpacing: '-0.0268em' },
    h4: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.415, letterSpacing: '-0.0268em' },
    h5: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.5, letterSpacing: '-0.0125em' },
    h6: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.5, letterSpacing: '-0.0125em' },
    button: { fontWeight: 500, letterSpacing: 0 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.gray950,
          color: tokens.mutedText,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '9px 16px',
          transition: 'all 0.2s ease',
        },
        // Primary gradient button with inset top highlight + hover "grow"
        containedPrimary: {
          backgroundImage: gradients.primaryButton,
          backgroundSize: '100% 100%',
          backgroundPosition: 'bottom',
          boxShadow: primaryInsetHighlight,
          '&:hover': {
            backgroundImage: gradients.primaryButton,
            backgroundSize: '100% 150%',
            boxShadow: primaryInsetHighlight,
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '-0.0125em',
          color: tokens.mutedText,
          '&.Mui-selected': {
            color: tokens.gray100,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: tokens.indigo500,
        },
      },
    },

    // Dark form fields (Tailwind .form-input: gray-900/50 + gray-700 border)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.gray700,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.gray600,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.gray600,
            borderWidth: 1,
          },
        },
        input: {
          color: tokens.gray200,
          '&::placeholder': { color: tokens.gray600, opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: tokens.gray400,
          '&.Mui-focused': { color: tokens.indigo300 },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default darkTheme;
