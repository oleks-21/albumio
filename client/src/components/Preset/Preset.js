import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { tokens } from '../../theme';
import { rowSx } from '../CollectionDisplay/CollectionDisplay';

/** "Saved slideshows" section of the library sidebar. */
export default function SavedSlideshowList({ presets, loading, error, activeName, onApply, onRequestDelete, onRetry }) {
  return (
    <Box component="section" aria-labelledby="saved-slideshows-heading">
      <Typography
        id="saved-slideshows-heading"
        component="h2"
        sx={{ px: 1.5, mb: 0.5, fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.textSecondary }}
      >
        Saved slideshows
      </Typography>
      {loading && presets.length === 0 ? (
        <Box sx={{ px: 1.5, py: 1 }}><CircularProgress size={18} aria-label="Loading saved slideshows" /></Box>
      ) : error && presets.length === 0 ? (
        <Box sx={{ px: 1.5 }}>
          <Typography variant="body2" color="text.secondary">{error}</Typography>
          <Button size="small" onClick={onRetry} sx={{ mt: 0.5, px: 0 }}>Retry</Button>
        </Box>
      ) : presets.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>
          Choose <strong>Select</strong> above the photos to save a slideshow.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {presets.map((name) => {
            const active = name === activeName;
            return (
              <Box component="li" key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onApply(name)}
                  aria-pressed={active}
                  sx={rowSx(active)}
                >
                  <SlideshowOutlinedIcon fontSize="small" sx={{ color: active ? tokens.accent : tokens.textSecondary }} />
                  <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </Box>
                </Box>
                <Tooltip title="Delete saved slideshow">
                  <IconButton
                    aria-label={`Delete saved slideshow ${name}`}
                    onClick={() => onRequestDelete(name)}
                    size="small"
                    sx={{ width: 36, height: 36, color: tokens.textSecondary }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/** Name dialog shown from the selection bar. Closes only after the API confirms the save. */
export function SaveSlideshowDialog({ open, count, existingNames, onSave, onClose }) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setPending(false);
    }
  }, [open]);

  const trimmed = name.trim();
  const duplicate = existingNames.some((n) => n.toLocaleLowerCase() === trimmed.toLocaleLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed || duplicate || pending) return;
    setPending(true);
    setError('');
    try {
      await onSave(trimmed);
      setName('');
      setPending(false);
      onClose();
    } catch (err) {
      // Keep the dialog and the typed name so nothing is lost.
      setPending(false);
      setError(err.message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="save-slideshow-title"
      slotProps={{ paper: { component: 'form', onSubmit: handleSubmit, noValidate: true } }}
    >
      <DialogTitle id="save-slideshow-title">Save slideshow</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Saves the {count} selected {count === 1 ? 'photo' : 'photos'} so you can play them together later.
        </Typography>
        <TextField
          autoFocus
          label="Slideshow name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          error={duplicate}
          helperText={duplicate ? 'You already have a saved slideshow with this name.' : ' '}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={pending}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!trimmed || duplicate || pending}
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {pending ? 'Saving…' : 'Save slideshow'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
