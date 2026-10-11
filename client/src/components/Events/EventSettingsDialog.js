import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { eventApi } from './eventApi';
import { formatBytes } from './format';
import { tokens } from '../../theme';

function Setting({ checked, onChange, label, help, disabled }) {
  return (
    <div>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />}
        label={<Typography sx={{ fontWeight: 600 }}>{label}</Typography>}
      />
      <Typography variant="body2" color="text.secondary" sx={{ pl: 6.5, mt: -0.5 }}>{help}</Typography>
    </div>
  );
}

function Meter({ label, value, max, format = String }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <span>{label}</span>
        <span>{format(value)} of {format(max)}</span>
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`${label}: ${format(value)} of ${format(max)}`}
        sx={{ height: 8, borderRadius: 4, bgcolor: tokens.surfaceSubtle, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: tokens.accent } }}
      />
    </div>
  );
}

/**
 * Host settings: title/date, the event-wide guest switches and usage. Saves
 * with the event's version so edits from another tab are never overwritten.
 */
export default function EventSettingsDialog({ open, event, onClose, onSaved }) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open && event) {
      setForm({
        title: event.title,
        eventDate: event.eventDate || '',
        uploadsOpen: event.uploadsOpen,
        guestAccessEnabled: event.guestAccessEnabled,
        archived: event.status === 'archived',
      });
      setError(null);
    }
  }, [open, event]);

  if (!form) return null;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      setError({ message: 'Give the event a title.' });
      return;
    }
    setPending(true);
    setError(null);
    try {
      const saved = await eventApi.update(event.id, {
        version: event.version,
        title: form.title.trim(),
        eventDate: form.eventDate || null,
        uploadsOpen: form.uploadsOpen,
        guestAccessEnabled: form.guestAccessEnabled,
        status: form.archived ? 'archived' : 'active',
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  const minutes = Math.ceil(((event.signedUrlSeconds || 120) + 60) / 60);

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="event-settings-title">
      <DialogTitle id="event-settings-title">Event settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && (
            <Alert
              severity="error"
              action={error.code === 'version_conflict' ? <Button color="inherit" size="small" onClick={() => { onClose(); onSaved(null); }}>Reload</Button> : null}
            >
              {error.message}
            </Alert>
          )}
          <TextField label="Event title" value={form.title} onChange={(e) => set('title')(e.target.value)} required inputProps={{ maxLength: 120 }} disabled={pending} />
          <TextField label="Date (optional)" type="date" value={form.eventDate} onChange={(e) => set('eventDate')(e.target.value)} disabled={pending} slotProps={{ inputLabel: { shrink: true } }} />

          <Divider />
          <Setting
            checked={form.uploadsOpen}
            onChange={set('uploadsOpen')}
            disabled={pending}
            label="Accept guest uploads"
            help={form.uploadsOpen
              ? 'Guests whose link allows adding can upload photos.'
              : 'Uploads are closed. Guests can still view this album if their invitation permits it.'}
          />
          <Setting
            checked={form.guestAccessEnabled}
            onChange={set('guestAccessEnabled')}
            disabled={pending}
            label="Allow guest access"
            help={form.guestAccessEnabled
              ? 'Every active invitation link works with the permissions you gave it.'
              : 'All guest links and open guest sessions are paused. Turn this back on to restore them.'}
          />
          <Setting
            checked={form.archived}
            onChange={set('archived')}
            disabled={pending}
            label="Archive event"
            help="No one, including you, can add photos to an archived event. Viewing follows the settings above."
          />
          <Typography variant="body2" sx={{ color: tokens.textSecondary, bgcolor: tokens.surfaceSubtle, borderRadius: 1, p: 1.5 }}>
            Changes take effect on guests’ next request. Photo links a guest has already opened keep working for up to {minutes} minutes, and photos already viewed or downloaded can’t be recalled.
          </Typography>

          <Divider />
          <Typography sx={{ fontWeight: 600 }}>Usage</Typography>
          <Meter label="Photos" value={event.usage.photos} max={event.usage.maxPhotos} format={(n) => n.toLocaleString()} />
          <Meter label="Storage" value={event.usage.bytes} max={event.usage.maxBytes} format={formatBytes} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}>
          Save settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
