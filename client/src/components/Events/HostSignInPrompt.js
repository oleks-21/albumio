import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { logout } from '../../store/store';

/**
 * Shown to a signed-in host whose browser has no event-album token yet (it
 * signed in before event albums existed) or whose token has expired. Logging
 * in again issues a new one; the personal library doesn't need it.
 */
export default function HostSignInPrompt({ onOpenAuth }) {
  const dispatch = useDispatch();
  return (
    <div className="library-state event-message">
      <Typography variant="h2" component="h1" sx={{ fontSize: '1.75rem' }}>Log in again to use event albums</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
        For your security, event albums need a fresh sign-in. Your photo library isn’t affected.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          dispatch(logout());
          onOpenAuth?.('login');
        }}
      >
        Log in again
      </Button>
    </div>
  );
}
