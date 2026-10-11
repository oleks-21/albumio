import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import { eventApi, EVENT_ACCEPT } from './eventApi';
import { useEvent, useEventPhotos } from './useEventAlbum';
import { loadGuestSession, clearGuestSession, saveGuestName } from './guestSession';
import { eventStatus, formatEventDate, formatDateTime, listText, plural, toCardPhoto, toViewerPhoto } from './format';
import EventSettingsDialog from './EventSettingsDialog';
import InviteGuestsDialog from './InviteGuestsDialog';
import PhotoCard from '../Album/PhotoCard';
import Preview from '../Preview/Preview';
import Slideshow from '../Slideshow/Slideshow';
import FileSelect from '../FileSelect/FileSelect';
import ConfirmDialog from '../common/ConfirmDialog';
import useImageStatus from '../common/useImageStatus';
import { tokens } from '../../theme';
import '../Album/Album.css';
import './Events.css';

// Guest errors after which the stored session is useless.
const DEAD_SESSION = ['guest_session_expired', 'guest_session_blocked', 'invitation_revoked', 'invitation_expired', 'album_not_found'];

function EventMessage({ title, children, action }) {
  return (
    <div className="event-page">
      <div className="library-state event-message">
        <Typography variant="h2" component="h1" sx={{ fontSize: '1.75rem' }}>{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 460 }}>{children}</Typography>
        {action}
      </div>
    </div>
  );
}

function HeroCover({ cover }) {
  const img = useImageStatus(cover?.url, { identity: cover?.photoId, bust: false });
  if (!cover || img.status === 'error') {
    return <span className="event-hero__placeholder" aria-hidden="true"><PhotoLibraryOutlinedIcon /></span>;
  }
  return <img key={img.key} ref={img.ref} src={img.src} alt="" onLoad={img.onLoad} onError={img.onError} className={img.status === 'loaded' ? 'is-loaded' : ''} />;
}

/** Display name field shown to guests before they upload. */
function GuestNameField({ value, onChange }) {
  return (
    <TextField
      label="Your name"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      inputProps={{ maxLength: 40, autoComplete: 'name' }}
      helperText="Shown to the host with the photos you add. It isn’t verified."
    />
  );
}

/**
 * One event album, for its host or a guest. What appears is driven by the
 * capabilities the server returns; the server re-checks every action.
 */
export default function EventAlbum() {
  const { albumId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hostStatus = useSelector((state) => state.user.status);
  const [guest, setGuest] = useState(() => loadGuestSession(albumId));
  const guestToken = guest?.token || null;
  const canLoad = Boolean(guestToken) || hostStatus === 'signedIn';

  const { event, setEvent, error, loading, reload } = useEvent(albumId, guestToken, canLoad);
  const caps = event?.capabilities;
  const role = caps?.role;
  const isHost = role === 'host';
  const photosApi = useEventPhotos(albumId, guestToken, Boolean(caps?.canView));
  const { photos, refresh: refreshPhotos, refreshMedia, replacePhoto, dropPhoto } = photosApi;

  const [displayName, setDisplayName] = useState(guest?.displayName || '');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preview, setPreview] = useState(null); // { ids[], index }
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind, photo }
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, severity = 'success') => setToast({ message, severity }), []);

  // A just-created album goes straight to inviting guests.
  useEffect(() => {
    if (location.state?.justCreated && isHost) {
      setInviteOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, isHost, navigate]);

  // Access can change while the page is open; re-read the event to explain why.
  useEffect(() => {
    if (photosApi.error && [401, 403].includes(photosApi.error.status)) reload({ quiet: true });
  }, [photosApi.error, reload]);

  useEffect(() => {
    if (guestToken && error && DEAD_SESSION.includes(error.code)) clearGuestSession(albumId);
  }, [guestToken, error, albumId]);

  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const slideshowPhotos = useMemo(() => photos.filter((p) => !p.hidden).map((p) => toViewerPhoto(p, role)), [photos, role]);

  /* ---------- Actions ---------- */
  const afterUpload = useCallback(() => {
    if (caps?.canView) refreshPhotos({ quiet: true });
    reload({ quiet: true });
  }, [caps, refreshPhotos, reload]);

  const uploadFile = useCallback(
    (file, { idempotencyKey }) => eventApi.upload(albumId, file, { idempotencyKey, displayName: displayName.trim() }, guestToken),
    [albumId, displayName, guestToken]
  );

  const changeName = (name) => {
    setDisplayName(name);
    saveGuestName(albumId, name);
  };

  const download = async (photo) => {
    try {
      const { url, fileName } = await eventApi.download(albumId, photo.id, guestToken);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const setHidden = async (photo, hidden) => {
    try {
      replacePhoto(await eventApi.updatePhoto(albumId, photo.id, { hidden }));
      notify(hidden ? 'Hidden from guests.' : 'Visible to guests again.');
      reload({ quiet: true });
      refreshPhotos({ quiet: true });
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const setCover = async (photo) => {
    try {
      setEvent(await eventApi.update(albumId, { version: event.version, coverPhotoId: photo.id }));
      refreshPhotos({ quiet: true });
      notify('Cover updated.');
    } catch (err) {
      notify(err.message, 'error');
      if (err.code === 'version_conflict') reload({ quiet: true });
    }
  };

  const confirmAction = async () => {
    const { kind, photo } = confirm;
    if (kind === 'remove') {
      await eventApi.removePhoto(albumId, photo.id);
      dropPhoto(photo.id);
      setPreview(null);
      reload({ quiet: true });
      notify('Photo removed.');
    } else if (kind === 'block') {
      await eventApi.blockSession(albumId, photo.contributor.sessionId);
      notify(`${photo.contributorName || 'That guest'}’s session is turned off.`);
    }
  };

  const actionsFor = (photo) => {
    const open = { label: 'Open', icon: OpenInFullIcon, onClick: () => openPreview(photo.id) };
    const dl = { label: 'Download original', icon: DownloadOutlinedIcon, onClick: () => download(photo) };
    if (!isHost) return caps?.canDownload ? [open, dl] : [open];
    const list = [open, dl];
    if (!photo.hidden && !photo.isCover) list.push({ label: 'Set as cover', icon: WallpaperOutlinedIcon, onClick: () => setCover(photo) });
    list.push(photo.hidden
      ? { label: 'Show to guests', icon: VisibilityOutlinedIcon, onClick: () => setHidden(photo, false) }
      : { label: 'Hide from guests', icon: VisibilityOffOutlinedIcon, onClick: () => setHidden(photo, true) });
    if (photo.contributor?.sessionId) {
      list.push({ label: 'Turn off this guest’s session', icon: BlockOutlinedIcon, onClick: () => setConfirm({ kind: 'block', photo }) });
    }
    list.push({ label: 'Remove photo', icon: DeleteOutlineIcon, onClick: () => setConfirm({ kind: 'remove', photo }), destructive: true });
    return list;
  };

  /* ---------- Viewer ---------- */
  const openPreview = (id) => {
    const ids = photos.map((p) => p.id);
    setPreview({ ids, index: Math.max(0, ids.indexOf(id)) });
  };
  const previewPhotos = preview ? preview.ids.map((id) => byId.get(id)).filter(Boolean).map((p) => toViewerPhoto(p, role)) : [];

  const renderDetails = (viewerPhoto) => {
    const photo = viewerPhoto.raw;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>
          <Typography sx={{ fontWeight: 600 }}>Added by {photo.contributorName || 'the host'}</Typography>
          <Typography variant="body2" sx={{ color: tokens.viewerTextSecondary }}>{formatDateTime(photo.uploadedAt)}</Typography>
          {photo.contributor?.type === 'guest' || (!isHost && photo.contributorName) ? (
            <Typography variant="body2" sx={{ color: tokens.viewerTextSecondary, mt: 0.5 }}>Names are entered by guests and aren’t verified.</Typography>
          ) : null}
        </div>
        {photo.hidden && <Alert severity="info" variant="outlined">Hidden from guests.</Alert>}
        {caps.canDownload ? (
          <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={() => download(photo)}>Download original</Button>
        ) : (
          <Typography variant="body2" sx={{ color: tokens.viewerTextSecondary }}>
            Original downloads aren’t available with this invitation. You can still view the photo here.
          </Typography>
        )}
        {isHost && (
          <>
            {!photo.hidden && !photo.isCover && <Button variant="outlined" onClick={() => setCover(photo)}>Set as cover</Button>}
            <Button variant="outlined" onClick={() => setHidden(photo, !photo.hidden)}>{photo.hidden ? 'Show to guests' : 'Hide from guests'}</Button>
            <Button color="error" onClick={() => setConfirm({ kind: 'remove', photo })}>Remove photo</Button>
          </>
        )}
      </Box>
    );
  };

  /* ---------- Access states ---------- */
  if (!guestToken && hostStatus === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress aria-label="Loading album" /></Box>;
  }
  if (!canLoad) {
    return (
      <EventMessage title="This album is private">
        Open the invitation link or QR code you were sent. If this is your event, log in to manage it.
      </EventMessage>
    );
  }
  if (error) {
    const network = !error.status;
    return (
      <EventMessage
        title={network ? 'We couldn’t load this album' : error.status === 404 ? 'This album isn’t available' : 'You can’t open this album right now'}
        action={network ? <Button variant="contained" onClick={() => reload()}>Retry</Button> : (isHost ? null : (
          guestToken && hostStatus === 'signedIn' ? <Button component={RouterLink} to="/events" variant="outlined">Go to your event albums</Button> : null
        ))}
      >
        {error.message}
      </EventMessage>
    );
  }
  if (loading || !event) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress aria-label="Loading album" /></Box>;
  }

  /* ---------- Page ---------- */
  const status = isHost ? eventStatus(event) : null;
  const meta = [formatEventDate(event.eventDate), caps.canView ? plural(event.photoCount, 'photo') : null].filter(Boolean).join(' · ');
  const nameMissing = !isHost && !displayName.trim();
  const allowed = [caps.canAdd && 'add photos', caps.canView && 'view the album', caps.canDownload && 'download originals'].filter(Boolean);
  const uploader = (inline) => (
    <FileSelect
      variant={inline ? 'inline' : 'dialog'}
      open={inline || uploadOpen}
      onClose={() => setUploadOpen(false)}
      title={inline ? 'Add your photos' : 'Add photos'}
      collectionMode="none"
      accept={EVENT_ACCEPT}
      uploadFile={uploadFile}
      onUploaded={afterUpload}
      blockedReason={nameMissing ? 'Add your name above so the host knows who shared these photos.' : ''}
      doneLabel={(n) => `${plural(n, 'photo')} added to “${event.title}”. Thank you!`}
    >
      {!isHost && <GuestNameField value={displayName} onChange={changeName} />}
    </FileSelect>
  );

  let body = null;
  if (caps.canView) {
    if (photosApi.loading && photos.length === 0) {
      body = <ul className="library-grid" aria-busy="true" aria-label="Loading photos">{Array.from({ length: 6 }, (_, i) => <li key={i} className="photo-card is-placeholder"><div className="photo-card__frame"><span className="photo-card__skeleton" /></div></li>)}</ul>;
    } else if (photosApi.error && photos.length === 0) {
      body = (
        <div className="library-state">
          <Alert severity="error" variant="outlined">{photosApi.error.message}</Alert>
          <Button variant="contained" onClick={() => refreshPhotos()}>Retry</Button>
        </div>
      );
    } else if (photos.length === 0) {
      body = (
        <div className="library-state">
          <Typography variant="h2" component="h2" sx={{ fontSize: '1.5rem' }}>No photos yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
            {isHost ? 'Invite guests with a link or QR code, or add the first photos yourself.' : caps.canAdd ? 'Be the first to add one.' : 'Check back soon.'}
          </Typography>
          {isHost && <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setInviteOpen(true)}>Invite guests</Button>}
        </div>
      );
    } else {
      body = (
        <>
          <ul className="library-grid event-photo-grid" aria-label="Photos">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={toCardPhoto(photo, role)}
                signed
                selectable={false}
                onOpen={openPreview}
                actions={actionsFor(photo)}
                onRetryImage={() => refreshMedia(photo.id)}
              />
            ))}
          </ul>
          {photosApi.hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button variant="outlined" onClick={photosApi.loadMore} disabled={photosApi.loading}>Show more photos</Button>
            </Box>
          )}
        </>
      );
    }
  } else if (caps.canAdd) {
    body = <div className="event-upload-only">{uploader(true)}</div>;
  }

  return (
    <div className="event-page">
      {guestToken && hostStatus === 'signedIn' && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { clearGuestSession(albumId); setGuest(null); }}>Leave guest view</Button>}>
          You’re viewing this album as a guest.
        </Alert>
      )}

      <header className="event-hero">
        {caps.canView && <span className="event-hero__cover"><HeroCover cover={event.cover} /></span>}
        <div className="event-hero__text">
          {isHost && <Typography component={RouterLink} to="/events" variant="body2" className="event-hero__back">Event albums</Typography>}
          <Typography variant="h1" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' } }}>{event.title}</Typography>
          {meta && <Typography color="text.secondary">{meta}</Typography>}
          {status && <span className={`event-chip is-${status.tone}`}>{status.label}</span>}
          {!isHost && allowed.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              With this invitation you can {listText(allowed)}.
            </Typography>
          )}
        </div>
        <div className="event-hero__actions">
          {caps.canAdd && (caps.canView || isHost) && (
            <Button variant="contained" size="large" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => setUploadOpen(true)}>Add photos</Button>
          )}
          {isHost && <Button variant="outlined" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setInviteOpen(true)}>Invite guests</Button>}
          {caps.canView && slideshowPhotos.length > 0 && (
            <Button variant="outlined" startIcon={<PlayArrowRoundedIcon />} onClick={() => setSlideshowOpen(true)}>Play slideshow</Button>
          )}
          {isHost && <Button startIcon={<SettingsOutlinedIcon />} onClick={() => setSettingsOpen(true)}>Settings</Button>}
        </div>
      </header>

      {caps.uploadsClosed && !isHost && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The host has closed uploads for this album.{caps.canView ? ' You can still look through the photos.' : ''}
        </Alert>
      )}
      {!caps.canView && !caps.canAdd && !caps.uploadsClosed && (
        <Alert severity="info" sx={{ mb: 2 }}>There’s nothing to do here right now.</Alert>
      )}

      {body}

      {/* Phones: keep "Add photos" in reach while scrolling the gallery. */}
      {caps.canAdd && caps.canView && (
        <div className="event-fab">
          <Button variant="contained" size="large" fullWidth startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => setUploadOpen(true)}>Add photos</Button>
        </div>
      )}

      {caps.canAdd && (caps.canView || isHost) && uploader(false)}

      {isHost && (
        <>
          <InviteGuestsDialog open={inviteOpen} event={event} onClose={() => setInviteOpen(false)} />
          <EventSettingsDialog
            open={settingsOpen}
            event={event}
            onClose={() => setSettingsOpen(false)}
            onSaved={(saved) => (saved ? setEvent(saved) : reload())}
          />
        </>
      )}

      {preview && previewPhotos.length > 0 && (
        <Preview
          photos={previewPhotos}
          index={Math.min(preview.index, previewPhotos.length - 1)}
          onIndexChange={(index) => setPreview((p) => ({ ...p, index }))}
          onClose={() => setPreview(null)}
          renderDetails={renderDetails}
          detailsLabel="Details"
          signed
          onImageRetry={(p) => refreshMedia(p.id)}
        />
      )}

      {slideshowOpen && (
        <Slideshow
          images={slideshowPhotos}
          scopeLabel={event.title}
          onClose={() => setSlideshowOpen(false)}
          signed
          onImageRetry={(p) => refreshMedia(p.id)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.kind === 'block' ? 'Turn off this guest’s session?' : 'Remove photo?'}
        confirmLabel={confirm?.kind === 'block' ? 'Turn off session' : 'Remove photo'}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      >
        {confirm?.kind === 'block'
          ? `${confirm.photo.contributorName || 'This guest'} won’t be able to add or view photos from this session. They can rejoin while their invitation link is active — to stop everyone using a link, revoke it under Invite guests.`
          : 'The photo is removed from the album for everyone. This can’t be undone.'}
      </ConfirmDialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.message}</Alert> : <span />}
      </Snackbar>
    </div>
  );
}
