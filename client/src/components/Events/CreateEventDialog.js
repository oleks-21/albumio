import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { eventApi } from './eventApi';

/** Title and optional date; the album starts empty and private. */
export default function CreateEventDialog({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setEventDate('');
      setError('');
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give the event a title.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const event = await eventApi.create({ title: title.trim(), eventDate: eventDate || null });
      onCreated(event);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="create-event-title"
      slotProps={{ paper: { component: 'form', onSubmit: submit, noValidate: true } }}
    >
      <DialogTitle id="create-event-title">Create event album</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The album starts empty and private. Next, you’ll create a link or QR code for guests.
        </Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Maya & Theo’s wedding"
            required
            autoFocus
            inputProps={{ maxLength: 120 }}
            disabled={pending}
          />
          <TextField
            label="Date (optional)"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={pending}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={pending}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Create album
        </Button>
      </DialogActions>
    </Dialog>
  );
}
