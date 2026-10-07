import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Confirmation for destructive actions. `onConfirm` may be async; the dialog
 * stays open while it runs and shows its error message if it throws.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onClose }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (pending) return;
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    setPending(true);
    setError('');
    try {
      await onConfirm();
      setPending(false);
      onClose();
    } catch (err) {
      setPending(false);
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth aria-labelledby="confirm-title">
      <DialogTitle id="confirm-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{children}</DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={pending}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={pending}
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
