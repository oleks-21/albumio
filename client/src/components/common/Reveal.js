import Box from '@mui/material/Box';
import useScrollReveal from './useScrollReveal';

/*
 * Wraps children in a fade-up-on-scroll reveal (translateY + opacity),
 * matching the reference template's AOS "fade-up" with staggered delay.
 */
export default function Reveal({ children, delay = 0, sx = {}, ...rest }) {
  const [ref, visible] = useScrollReveal();

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        transitionDelay: `${delay}ms`,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
