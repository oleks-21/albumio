import { API_BASE } from '../../api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { tokens } from '../../theme';
import './FileSelect.css';

const CONCURRENCY = 3;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|heic|heif|svg)$/i;

const isImage = (file) => (file.type ? file.type.startsWith('image/') : IMAGE_EXT.test(file.name));
const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const supportsFolders = typeof document !== 'undefined' && 'webkitdirectory' in document.createElement('input');

let nextId = 0;

/**
 * Upload dialog. Uses the existing one-file-per-request endpoint, reports
 * honest per-file status (waiting / uploading / done / failed) and keeps
 * failed files for Retry. It cannot be closed while uploads are running.
 */
export default function FileSelect({ open, onClose, existingNames = [], collections = [], defaultCollection = '', onUploaded }) {
  const email = useSelector(state => state.user.email);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [items, setItems] = useState([]);
  const [collection, setCollection] = useState('');
  const [skipped, setSkipped] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [touched, setTouched] = useState(false);
  const fileInput = useRef(null);
  const folderInput = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Prefill the collection from the library's single active filter.
  useEffect(() => {
    if (open && !collection && defaultCollection) setCollection(defaultCollection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Release every preview URL on unmount.
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.name !== '.DS_Store');
    const rejected = files.filter((f) => !isImage(f)).map((f) => f.name);
    const known = new Set(items.map((item) => fileKey(item.file)));
    const accepted = files
      .filter(isImage)
      .filter((f) => !known.has(fileKey(f)))
      .map((file) => ({ id: ++nextId, file, previewUrl: URL.createObjectURL(file), status: 'queued', error: '' }));
    setSkipped(rejected);
    if (accepted.length) setItems((prev) => [...prev, ...accepted]);
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const patch = (id, changes) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));

  const uploadOne = async (item, collectionName) => {
    patch(item.id, { status: 'uploading', error: '' });
    const formData = new FormData();
    formData.append('image', item.file);
    formData.append('email', email);
    formData.append('fileName', item.file.name);
    formData.append('collection', collectionName);
    try {
      const response = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: formData });
      let result = {};
      try { result = await response.json(); } catch { /* non-JSON error page */ }
      if (!response.ok || !result.url) {
        patch(item.id, { status: 'failed', error: result.message || `Upload failed (${response.status}).` });
        return;
      }
      patch(item.id, { status: 'done' });
      onUploaded?.([{ name: result.name || item.file.name, url: result.url, collection: collectionName }]);
    } catch {
      patch(item.id, { status: 'failed', error: 'Network error. Check your connection and retry.' });
    }
  };

  const trimmedCollection = collection.trim();
  const pending = items.filter((i) => i.status === 'queued' || i.status === 'failed');

  const startUpload = async (targets = pending) => {
    setTouched(true);
    if (uploading || targets.length === 0 || !trimmedCollection) return;
    setUploading(true);
    const queue = [...targets];
    const worker = async () => {
      while (queue.length) {
        const next = queue.shift();
        await uploadOne(next, trimmedCollection);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    // Finished files are in the library now; keep waiting/failed ones.
    setItems((prev) => {
      prev.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return prev.filter((i) => i.status !== 'done');
    });
    setSkipped([]);
    setTouched(false);
    onClose();
  };

  const counts = useMemo(() => ({
    done: items.filter((i) => i.status === 'done').length,
    failed: items.filter((i) => i.status === 'failed').length,
    active: items.filter((i) => i.status === 'uploading').length,
  }), [items]);

  const nameCounts = useMemo(() => {
    const m = new Map();
    items.forEach((i) => m.set(i.file.name, (m.get(i.file.name) || 0) + 1));
    return m;
  }, [items]);
  const existing = useMemo(() => new Set(existingNames), [existingNames]);

  const finished = !uploading && items.length > 0 && pending.length === 0;
  const collectionError = touched && !trimmedCollection;

  let summary = null;
  if (uploading) {
    summary = <Alert severity="info" icon={<CircularProgress size={18} />}>Uploading {counts.done + counts.active} of {counts.done + counts.active + pending.length}… Keep this window open until it finishes.</Alert>;
  } else if (counts.done > 0 && counts.failed > 0) {
    summary = <Alert severity="warning">{counts.done} uploaded, {counts.failed} failed. Retry the failed {counts.failed === 1 ? 'photo' : 'photos'} or remove {counts.failed === 1 ? 'it' : 'them'}.</Alert>;
  } else if (counts.failed > 0) {
    summary = <Alert severity="error">{counts.failed === 1 ? 'The upload failed.' : `${counts.failed} uploads failed.`} Your files are still here — try again.</Alert>;
  } else if (finished) {
    summary = <Alert severity="success">{counts.done} {counts.done === 1 ? 'photo' : 'photos'} added to “{trimmedCollection}”.</Alert>;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      keepMounted
      aria-labelledby="upload-title"
    >
      <DialogTitle id="upload-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Add photos
        <IconButton aria-label="Close" onClick={handleClose} disabled={uploading} sx={{ width: 44, height: 44 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          className={`upload-drop${dragOver ? ' is-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!uploading) addFiles(e.dataTransfer.files); }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: tokens.accent }} aria-hidden />
          <Typography sx={{ fontWeight: 600 }}>Drag photos here</Typography>
          <Typography variant="body2" color="text.secondary">or</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => fileInput.current?.click()} disabled={uploading}>
              Choose photos
            </Button>
            {supportsFolders && (
              <Button variant="text" onClick={() => folderInput.current?.click()} disabled={uploading}>
                Choose a folder
              </Button>
            )}
          </Box>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
          <input
            ref={folderInput}
            type="file"
            multiple
            hidden
            webkitdirectory="true"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
        </Box>

        {skipped.length > 0 && (
          <Alert severity="warning" onClose={() => setSkipped([])}>
            Skipped {skipped.length} {skipped.length === 1 ? 'file that isn’t an image' : 'files that aren’t images'}: {skipped.slice(0, 3).join(', ')}{skipped.length > 3 ? '…' : ''}
          </Alert>
        )}

        <Autocomplete
          freeSolo
          options={collections}
          inputValue={collection}
          onInputChange={(_, value) => setCollection(value)}
          disabled={uploading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Collection"
              required
              error={collectionError}
              helperText={collectionError ? 'Enter a collection name to upload.' : 'Photos are grouped under this name in your library.'}
            />
          )}
        />

        {items.length > 0 && (
          <Box component="ul" className="upload-list" aria-label="Chosen photos">
            {items.map((item) => {
              const replaces = item.status !== 'done' && (existing.has(item.file.name) || nameCounts.get(item.file.name) > 1);
              return (
                <li key={item.id} className={`upload-item is-${item.status}`}>
                  <img src={item.previewUrl} alt="" width={56} height={56} />
                  <div className="upload-item__text">
                    <span className="upload-item__name" title={item.file.name}>{item.file.name}</span>
                    <span className="upload-item__detail">
                      {formatSize(item.file.size)}
                      {' · '}
                      {item.status === 'queued' && 'Waiting'}
                      {item.status === 'uploading' && 'Uploading…'}
                      {item.status === 'done' && 'Added'}
                      {item.status === 'failed' && (item.error || 'Failed')}
                    </span>
                    {replaces && (
                      <span className="upload-item__warn">Same name as another photo — uploading replaces it.</span>
                    )}
                  </div>
                  <div className="upload-item__status" aria-live="polite">
                    {item.status === 'uploading' && <CircularProgress size={20} aria-label={`Uploading ${item.file.name}`} />}
                    {item.status === 'done' && <CheckCircleIcon sx={{ color: tokens.accent }} aria-label="Uploaded" />}
                    {item.status === 'failed' && (
                      <>
                        <ErrorOutlineIcon sx={{ color: tokens.destructive }} aria-hidden />
                        <Button size="small" onClick={() => startUpload([item])} disabled={uploading || !trimmedCollection}>
                          Retry
                        </Button>
                      </>
                    )}
                    {(item.status === 'queued' || item.status === 'failed') && (
                      <IconButton
                        size="small"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => removeItem(item.id)}
                        disabled={uploading}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                </li>
              );
            })}
          </Box>
        )}

        {summary}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          {items.length === 0 ? 'No photos chosen' : `${items.length} ${items.length === 1 ? 'photo' : 'photos'} chosen`}
        </Typography>
        {finished ? (
          <Button variant="contained" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={uploading}>Close</Button>
            <Button
              variant="contained"
              onClick={() => startUpload()}
              disabled={uploading || pending.length === 0}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {uploading
                ? 'Uploading…'
                : counts.failed > 0 && pending.length === counts.failed
                  ? `Retry ${counts.failed} failed`
                  : `Upload ${pending.length || ''} ${pending.length === 1 ? 'photo' : 'photos'}`.replace('  ', ' ')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
