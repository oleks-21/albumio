import Box from '@mui/material/Box';
import useScrollReveal from './useScrollReveal';

/*
 * Subtle fade-up when content first scrolls into view. Users who prefer
 * reduced motion get the content immediately with no transition (handled in
 * useScrollReveal and the media query below).
 */
export default function Reveal({ children, delay = 0, sx = {}, ...rest }) {
  const [ref, visible] = useScrollReveal();

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        transitionDelay: `${delay}ms`,
        '@media (prefers-reduced-motion: reduce)': {
          opacity: 1,
          transform: 'none',
          transition: 'none',
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
