import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import { eventApi } from './eventApi';
import CreateEventDialog from './CreateEventDialog';
import { useVisibleRefresh, REFRESH_MS } from './useEventAlbum';
import { eventStatus, formatEventDate, plural } from './format';
import useImageStatus from '../common/useImageStatus';
import HostSignInPrompt from './HostSignInPrompt';
import { selectHostReady } from '../../store/store';
import './Events.css';

function EventCover({ event }) {
  const img = useImageStatus(event.cover?.url, { identity: event.cover?.photoId, bust: false });
  if (!event.cover || img.status === 'error') {
    return <span className="event-card__placeholder" aria-hidden="true"><PhotoLibraryOutlinedIcon /></span>;
  }
  return (
    <img
      key={img.key}
      ref={img.ref}
      src={img.src}
      alt=""
      onLoad={img.onLoad}
      onError={img.onError}
      className={img.status === 'loaded' ? 'is-loaded' : ''}
    />
  );
}

/** Host destination listing their event albums, next to "My library". */
export default function EventAlbums({ onOpenAuth }) {
  const navigate = useNavigate();
  const hostReady = useSelector(selectHostReady);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!hostReady) return;
    try {
      setEvents(await eventApi.list());
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [hostReady]);

  useEffect(() => { load(); }, [load]);
  // Photo counts and covers change as guests upload.
  useVisibleRefresh(load, REFRESH_MS, hostReady);

  if (!hostReady || error?.status === 401) {
    return <div className="event-page"><HostSignInPrompt onOpenAuth={onOpenAuth} /></div>;
  }

  let body;
  if (error?.code === 'feature_disabled') {
    body = <div className="library-state"><Typography>Event albums aren’t available yet.</Typography></div>;
  } else if (error && !events) {
    body = (
      <div className="library-state">
        <Alert severity="error" variant="outlined">{error.message}</Alert>
        <Button variant="contained" onClick={load}>Retry</Button>
      </div>
    );
  } else if (!events) {
    body = <ul className="event-grid" aria-busy="true" aria-label="Loading event albums">{[0, 1, 2].map((i) => <li key={i} className="event-card is-placeholder" />)}</ul>;
  } else if (events.length === 0) {
    body = (
      <div className="library-state">
        <Typography variant="h2" component="h2" sx={{ fontSize: '1.75rem' }}>Collect everyone’s photos in one place</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          Create an album for a wedding, trip, reunion or party. Share a private link or QR code, and guests add photos from their phones. No account needed.
        </Typography>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Create event album
        </Button>
      </div>
    );
  } else {
    body = (
      <ul className="event-grid" aria-label="Event albums">
        {events.map((event) => {
          const status = eventStatus(event);
          return (
            <li key={event.id} className="event-card">
              <RouterLink to={`/events/${event.id}`} className="event-card__link">
                <span className="event-card__cover"><EventCover event={event} /></span>
                <span className="event-card__body">
                  <span className="event-card__title">{event.title}</span>
                  <span className="event-card__meta">
                    {[formatEventDate(event.eventDate), plural(event.photoCount, 'photo')].filter(Boolean).join(' · ')}
                  </span>
                  <span className={`event-chip is-${status.tone}`}>{status.label}</span>
                </span>
              </RouterLink>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="event-page">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <div>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>Event albums</Typography>
          <Typography color="text.secondary">Shared albums guests can add to. They’re kept separate from your library.</Typography>
        </div>
        {events?.length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create event album</Button>
        )}
      </Box>
      {error && events && <Alert severity="warning" sx={{ mb: 2 }}>{error.message}</Alert>}
      {body}
      <CreateEventDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(event) => navigate(`/events/${event.id}`, { state: { justCreated: true } })}
      />
    </div>
  );
}
