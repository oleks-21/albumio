import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { getAuthClient } from '../../auth/authClient';
import { useRefreshProfile } from '../../auth/useAuthSync';

/**
 * Explains why the personal library is waiting (see /api/me libraryStatus)
 * and offers the next step. Returns null when the library is ready.
 */
export default function LibraryAccessNotice({ status, email, onReady }) {
  const refreshProfile = useRefreshProfile();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (action) => {
    setPending(true);
    setMessage('');
    try {
      await action();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPending(false);
    }
  };

  if (status === 'email_verification_required') {
    return (
      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        <strong>Confirm your email to reconnect your photos.</strong> Your existing library is linked to {email}. Open the confirmation email we sent, then come back here.
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            disabled={pending}
            onClick={() => run(async () => {
              await getAuthClient().reloadUser();
              await refreshProfile();
              onReady?.();
            })}
          >
            I’ve confirmed my email
          </Button>
          <Button
            size="small"
            disabled={pending}
            onClick={() => run(async () => {
              await getAuthClient().sendVerification();
              setMessage('Confirmation email sent.');
            })}
          >
            Send the email again
          </Button>
        </Box>
        {message && <Box sx={{ mt: 1 }} role="status">{message}</Box>}
      </Alert>
    );
  }
  if (status === 'legacy_review_required' || status === 'legacy_already_linked') {
    return (
      <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
        Your existing library needs a quick manual check before it can be connected to this sign-in. Please contact support. Your photos are safe.
      </Alert>
    );
  }
  return null;
}
