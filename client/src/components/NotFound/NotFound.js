import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { tokens } from '../../theme';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        px: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
        Page not found
      </Typography>
      <Typography sx={{ color: tokens.textSecondary, maxWidth: 420 }}>
        This page doesn’t exist. It may have been moved, or the link is incorrect.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Back to home
      </Button>
    </Box>
  );
}
