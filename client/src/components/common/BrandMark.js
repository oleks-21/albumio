import Box from '@mui/material/Box';
import { tokens, fonts } from '../../theme';

/** Two overlapping photo frames — the Albumio mark. Decorative. */
export function FrameMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {/* style (not fill/stroke attributes) so the CSS-variable colors resolve */}
      <rect x="3" y="7" width="18" height="18" rx="3" strokeWidth="2" transform="rotate(-8 12 16)" style={{ fill: tokens.sky, stroke: tokens.text }} />
      <rect x="11" y="6" width="18" height="18" rx="3" style={{ fill: tokens.accent }} />
      <path d="M13.5 20.5l4.5-5 3 3.2 2-2.2 3.5 4z" style={{ fill: tokens.onAccent }} />
      <circle cx="23.5" cy="10.5" r="1.8" style={{ fill: tokens.onAccent }} />
    </svg>
  );
}

/** Mark + wordmark. Renders inline; wrap it in a link where it navigates. */
export default function BrandMark({ size = 28, color = tokens.text }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <FrameMark size={size} />
      <Box
        component="span"
        sx={{ fontFamily: fonts.serif, fontSize: size * 0.8, lineHeight: 1, color, letterSpacing: '-0.01em' }}
      >
        Albumio
      </Box>
    </Box>
  );
}
