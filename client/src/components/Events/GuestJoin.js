import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { eventApi } from './eventApi';
import { saveGuestSession } from './guestSession';
import { FrameMark } from '../common/BrandMark';

/**
 * /join#invite=<secret>. The secret travels in the URL fragment, so it is
 * never sent in the page request or a referrer. It is read once, removed from
 * the address bar and history, and exchanged for a guest session; the guest
 * then continues at the album's own URL, which carries no secret.
 */
export default function GuestJoin() {
  const navigate = useNavigate();
  const secret = useRef(null);
  const started = useRef(false);
  const [state, setState] = useState({ status: 'joining' });

  const exchange = async () => {
    setState({ status: 'joining' });
    try {
      const { token, expiresAt, albumId } = await eventApi.exchange(secret.current);
      saveGuestSession(albumId, { token, expiresAt });
      secret.current = null;
      navigate(`/events/${albumId}`, { replace: true });
    } catch (err) {
      setState({ status: 'error', message: err.message, retryable: !err.status || err.status === 429 || err.status >= 500 });
    }
  };

  useEffect(() => {
    if (started.current) return; // run once, even under StrictMode
    started.current = true;
    document.title = 'Join an album · Albumio';
    const params = new URLSearchParams(window.location.hash.slice(1));
    secret.current = params.get('invite');
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    if (!secret.current) {
      setState({ status: 'error', message: 'This link is incomplete. Open the full invitation link or scan the QR code again.' });
      return;
    }
    exchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, px: 2 }}>
      <FrameMark size={40} />
      {state.status === 'joining' ? (
        <>
          <CircularProgress aria-label="Opening the album" />
          <Typography role="status">Opening the album…</Typography>
        </>
      ) : (
        <>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>We couldn’t open this album</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>{state.message}</Typography>
          {state.retryable && secret.current && <Button variant="contained" onClick={exchange}>Try again</Button>}
        </>
      )}
    </Box>
  );
}
