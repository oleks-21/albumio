import Box from '@mui/material/Box';

/*
 * Centered content column: max 1200px with 16px (phone) to 48px (desktop)
 * gutters.
 */
export default function SectionContainer({ children, sx = {}, ...rest }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200 + 2 * 48,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 6 },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
