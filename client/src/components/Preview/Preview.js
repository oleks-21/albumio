import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { viewerTheme, tokens } from '../../theme';
import useImageStatus from '../common/useImageStatus';
import './Preview.css';

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

/** Inline status line under a field: pending / success / error. */
function FieldStatus({ state }) {
  if (!state || state.status === 'idle') return null;
  const color = state.status === 'error' ? '#F97066' : state.status === 'success' ? '#7CC4AC' : tokens.viewerTextSecondary;
  return (
    <Typography variant="body2" role={state.status === 'error' ? 'alert' : 'status'} sx={{ color, mt: 0.75 }}>
      {state.status === 'pending' ? 'Saving…' : state.message}
    </Typography>
  );
}

/**
 * Photo viewer. Large uncropped image with previous/next over the current
 * visible list, plus a details panel for rename / collection / edit.
 */
export default function Preview({
  photos, index, onIndexChange, onClose, onRename, onCollectionSave, onEdit,
  collections = [], existingNames = [], hasSavedSlideshows,
}) {
  const photo = photos[index];
  const isWide = useMediaQuery(viewerTheme.breakpoints.up('md'));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(photo?.name || '');
  const [collection, setCollection] = useState(photo?.collection || '');
  const [nameState, setNameState] = useState({ status: 'idle' });
  const [collectionState, setCollectionState] = useState({ status: 'idle' });
  const img = useImageStatus(photo?.url);

  // Reset the form when moving to another photo. Keyed on position only, so a
  // rename (which also refreshes the URL) keeps its success message.
  useEffect(() => {
    setName(photo?.name || '');
    setCollection(photo?.collection || '');
    setNameState({ status: 'idle' });
    setCollectionState({ status: 'idle' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!photo) return null;

  const count = photos.length;
  const go = (delta) => onIndexChange((index + delta + count) % count);

  const handleKeyDown = (e) => {
    if (count < 2 || isTyping(e.target)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };

  const trimmedName = name.trim();
  const nameTaken = trimmedName !== photo.name && existingNames.includes(trimmedName);
  const saveName = async (e) => {
    e.preventDefault();
    if (!trimmedName || trimmedName === photo.name || nameTaken) return;
    setNameState({ status: 'pending' });
    try {
      // Always send the current canonical name, never a stale one.
      await onRename(photo.name, trimmedName);
      setNameState({
        status: 'success',
        message: hasSavedSlideshows
          ? 'Name saved. Saved slideshows that included the old name need to be saved again to include this photo.'
          : 'Name saved.',
      });
    } catch (err) {
      setNameState({ status: 'error', message: err.message });
    }
  };

  const trimmedCollection = collection.trim();
  const saveCollection = async (e) => {
    e.preventDefault();
    if (!trimmedCollection || trimmedCollection === photo.collection) return;
    setCollectionState({ status: 'pending' });
    try {
      await onCollectionSave(photo.name, trimmedCollection);
      setCollectionState({ status: 'success', message: `Moved to “${trimmedCollection}”.` });
    } catch (err) {
      setCollectionState({ status: 'error', message: err.message });
    }
  };

  const details = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button
        variant="contained"
        size="large"
        startIcon={<EditOutlinedIcon />}
        onClick={() => onEdit(photo)}
      >
        Edit photo
      </Button>

      <Box component="form" onSubmit={saveName} noValidate>
        <TextField
          label="File name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameState({ status: 'idle' }); }}
          fullWidth
          error={nameTaken}
          helperText={nameTaken ? 'Another photo already uses this name.' : 'Keep the file extension, e.g. .jpg'}
          disabled={nameState.status === 'pending'}
        />
        <Button
          type="submit"
          variant="outlined"
          sx={{ mt: 1 }}
          disabled={!trimmedName || trimmedName === photo.name || nameTaken || nameState.status === 'pending'}
          startIcon={nameState.status === 'pending' ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Save name
        </Button>
        <FieldStatus state={nameState} />
      </Box>

      <Box component="form" onSubmit={saveCollection} noValidate>
        <Autocomplete
          freeSolo
          options={collections}
          inputValue={collection}
          onInputChange={(_, value) => { setCollection(value); setCollectionState({ status: 'idle' }); }}
          disabled={collectionState.status === 'pending'}
          renderInput={(params) => <TextField {...params} label="Collection" />}
        />
        <Button
          type="submit"
          variant="outlined"
          sx={{ mt: 1 }}
          disabled={!trimmedCollection || trimmedCollection === photo.collection || collectionState.status === 'pending'}
          startIcon={collectionState.status === 'pending' ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Save collection
        </Button>
        <FieldStatus state={collectionState} />
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={viewerTheme}>
      <Dialog
        open
        fullScreen
        onClose={onClose}
        onKeyDown={handleKeyDown}
        disableRestoreFocus
        aria-labelledby="preview-title"
        slotProps={{ paper: { sx: { bgcolor: tokens.viewerBg, color: tokens.viewerText } } }}
      >
        <div className="preview">
          <header className="preview__bar">
            <Typography variant="body2" sx={{ color: tokens.viewerTextSecondary, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {index + 1} of {count}
            </Typography>
            <Typography id="preview-title" component="h2" variant="h6" noWrap title={photo.name} sx={{ flex: 1, minWidth: 0 }}>
              {photo.name}
            </Typography>
            <IconButton aria-label="Close viewer" onClick={onClose} sx={{ width: 44, height: 44 }}>
              <CloseIcon />
            </IconButton>
          </header>

          <div className="preview__body">
            <div className="preview__stage">
              {img.status !== 'error' && (
                <img
                  key={img.key}
                  ref={img.ref}
                  src={img.src}
                  alt={photo.name}
                  onLoad={img.onLoad}
                  onError={img.onError}
                  className={img.status === 'loaded' ? 'is-loaded' : ''}
                />
              )}
              {img.status === 'loading' && (
                <CircularProgress className="preview__spinner" aria-label="Loading photo" />
              )}
              {img.status === 'error' && (
                <div className="preview__failed">
                  <BrokenImageOutlinedIcon sx={{ fontSize: 40 }} aria-hidden />
                  <Typography>This photo didn’t load.</Typography>
                  <Button variant="outlined" onClick={img.retry}>Retry</Button>
                </div>
              )}
              {count > 1 && (
                <>
                  <IconButton className="preview__nav preview__nav--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                    <ChevronLeftIcon fontSize="large" />
                  </IconButton>
                  <IconButton className="preview__nav preview__nav--next" aria-label="Next photo" onClick={() => go(1)}>
                    <ChevronRightIcon fontSize="large" />
                  </IconButton>
                </>
              )}
            </div>

            <aside className="preview__details" aria-label="Photo details">
              {isWide ? (
                details
              ) : (
                <>
                  <Button
                    fullWidth
                    onClick={() => setDetailsOpen((v) => !v)}
                    aria-expanded={detailsOpen}
                    aria-controls="preview-details"
                    endIcon={<ExpandMoreIcon sx={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                    sx={{ justifyContent: 'space-between', color: tokens.viewerText, minHeight: 48 }}
                  >
                    Details and editing
                  </Button>
                  <Collapse in={detailsOpen} id="preview-details">
                    <Box sx={{ pt: 2 }}>{details}</Box>
                  </Collapse>
                </>
              )}
            </aside>
          </div>
        </div>
      </Dialog>
    </ThemeProvider>
  );
}
