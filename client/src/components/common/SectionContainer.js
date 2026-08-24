import Box from '@mui/material/Box';

/*
 * Centered max-width container matching the reference template's
 * `max-w-6xl` (1152px) with responsive horizontal padding.
 */
export default function SectionContainer({ children, sx = {}, ...rest }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1152,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
