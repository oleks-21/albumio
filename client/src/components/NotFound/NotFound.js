import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme';

export default function NotFound() {
  const navigate = useNavigate();
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
      <Typography variant="h2" sx={{ color: tokens.gray100 }}>
        404
      </Typography>
      <Typography sx={{ color: tokens.mutedText, maxWidth: 420 }}>
        This page doesn’t exist. It may have been moved, or the link is incorrect.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Back to home
      </Button>
    </Box>
  );
}
