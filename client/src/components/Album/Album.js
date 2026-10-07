import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import './Album.css';
import useLibraryImages from './useLibraryImages';
import LibraryToolbar from './LibraryToolbar';
import PhotoCard from './PhotoCard';
import FileSelect from '../FileSelect/FileSelect';
import Preview from '../Preview/Preview';
import Slideshow from '../Slideshow/Slideshow';
import CollectionDisplay, { collectionCounts, collectionLabel } from '../CollectionDisplay/CollectionDisplay';
import SavedSlideshowList, { SaveSlideshowDialog } from '../Preset/Preset';
import usePresets from '../Preset/usePresets';
import ConfirmDialog from '../common/ConfirmDialog';
import { tokens } from '../../theme';

const compareNames = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });

const focusThumbnail = (name) => {
  if (!name) return;
  const selector = `.photo-card__open[data-photo-name="${window.CSS?.escape ? CSS.escape(name) : name}"]`;
  // Wait a frame so the dialog has finished unmounting its focus trap.
  requestAnimationFrame(() => document.querySelector(selector)?.focus());
};

export default function Album() {
  const email = useSelector(state => state.user.email);
  const navigate = useNavigate();
  const {
    images, loading, error, fetchImages, addImages, deleteImage, renameImage, updateCollection,
  } = useLibraryImages(email);
  const presetsApi = usePresets(email);

  // Browsing state
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('asc');
  const [fit, setFit] = useState('cover');
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [activePreset, setActivePreset] = useState(null); // { name, names[] }

  // Grid selection (for saving slideshows) — independent of filtering.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNames, setSelectedNames] = useState([]);

  // Overlays
  const [preview, setPreview] = useState(null); // { names[], index, origin }
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [presetDeleteTarget, setPresetDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null); // { severity, message }

  const notify = useCallback((message, severity = 'success') => setToast({ message, severity }), []);

  const collections = useMemo(() => collectionCounts(images), [images]);
  const byName = useMemo(() => new Map(images.map((img) => [img.name, img])), [images]);

  const { visible, missingInPreset } = useMemo(() => {
    let base;
    let missing = 0;
    if (activePreset) {
      const unique = [...new Set(activePreset.names)];
      base = unique.map((n) => byName.get(n)).filter(Boolean);
      missing = unique.length - base.length;
    } else if (selectedCollections.length > 0) {
      base = images.filter((img) => selectedCollections.includes(img.collection));
    } else {
      base = images;
    }
    const q = search.trim().toLocaleLowerCase();
    if (q) {
      base = base.filter((img) =>
        img.name.toLocaleLowerCase().includes(q) || img.collection.toLocaleLowerCase().includes(q)
      );
    }
    // Saved slideshows keep their saved (server) order.
    if (!activePreset) {
      base = [...base].sort(compareNames);
      if (sort === 'desc') base.reverse();
    }
    return { visible: base, missingInPreset: missing };
  }, [images, byName, activePreset, selectedCollections, search, sort]);

  let scopeLabel = 'all photos';
  if (activePreset) scopeLabel = `saved slideshow “${activePreset.name}”`;
  else if (selectedCollections.length) scopeLabel = selectedCollections.map(collectionLabel).join(', ');
  if (search.trim()) scopeLabel += ` matching “${search.trim()}”`;

  /* ---------- Filters ---------- */
  const toggleCollection = (name) => {
    setActivePreset(null);
    setSelectedCollections((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };
  const showAll = () => {
    setActivePreset(null);
    setSelectedCollections([]);
    setCollectionsOpen(false);
  };

  const applyPreset = async (name) => {
    try {
      const names = await presetsApi.loadPreset(name);
      setSelectedCollections([]);
      setActivePreset({ name, names });
      setCollectionsOpen(false);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  /* ---------- Selection ---------- */
  const toggleSelect = useCallback((name) => {
    setSelectionMode(true);
    setSelectedNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }, []);
  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedNames([]);
  };
  const selectAllShown = () => {
    setSelectedNames((prev) => [...new Set([...prev, ...visible.map((img) => img.name)])]);
  };

  const handleSavePreset = async (name) => {
    await presetsApi.savePreset(name, selectedNames);
    cancelSelection();
    notify(`Saved slideshow “${name}”.`);
  };

  /* ---------- Preview ---------- */
  const openPreview = useCallback((name) => {
    const names = visible.map((img) => img.name);
    const index = Math.max(0, names.indexOf(name));
    setPreview({ names, index, origin: name });
  }, [visible]);

  const closePreview = () => {
    const origin = preview?.origin;
    setPreview(null);
    focusThumbnail(origin);
  };

  const previewPhotos = useMemo(
    () => (preview ? preview.names.map((n) => byName.get(n)).filter(Boolean) : []),
    [preview, byName]
  );

  const handleRename = async (oldName, newName) => {
    await renameImage(oldName, newName);
    const swap = (n) => (n === oldName ? newName : n);
    setPreview((p) => (p ? { ...p, names: p.names.map(swap), origin: swap(p.origin) } : p));
    setSelectedNames((prev) => prev.map(swap));
    // Saved slideshows store filenames and the API doesn't update them on
    // rename; keep the photo in the applied one for this session.
    setActivePreset((p) => (p ? { ...p, names: p.names.map(swap) } : p));
  };

  const editPhoto = useCallback((photo) => {
    navigate('/edit', { state: { imageUrl: photo.url, imageName: photo.name, collection: photo.collection } });
  }, [navigate]);

  /* ---------- Deletion ---------- */
  const confirmDelete = async () => {
    const name = deleteTarget;
    await deleteImage(name);
    setSelectedNames((prev) => prev.filter((n) => n !== name));
    setActivePreset((p) => (p ? { ...p, names: p.names.filter((n) => n !== name) } : p));
    notify(`Deleted “${name}”.`);
  };

  const confirmPresetDelete = async () => {
    const name = presetDeleteTarget;
    await presetsApi.deletePreset(name);
    if (activePreset?.name === name) setActivePreset(null);
    notify(`Deleted saved slideshow “${name}”.`);
  };

  const requestDelete = useCallback((name) => setDeleteTarget(name), []);

  /* ---------- Render ---------- */
  const sidebar = (
    <>
      <CollectionDisplay
        collections={collections}
        totalCount={images.length}
        selectedCollections={selectedCollections}
        allActive={!activePreset && selectedCollections.length === 0}
        onToggle={toggleCollection}
        onShowAll={showAll}
        onClear={() => setSelectedCollections([])}
      />
      <Divider sx={{ my: 2 }} />
      <SavedSlideshowList
        presets={presetsApi.presets}
        loading={presetsApi.loading}
        error={presetsApi.error}
        activeName={activePreset?.name}
        onApply={applyPreset}
        onRequestDelete={setPresetDeleteTarget}
        onRetry={presetsApi.refresh}
      />
    </>
  );

  const firstLoad = loading && images.length === 0;

  let body;
  if (firstLoad) {
    body = (
      <ul className="library-grid" aria-busy="true" aria-label="Loading photos">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="photo-card is-placeholder" aria-hidden="true">
            <div className="photo-card__frame"><span className="photo-card__skeleton" /></div>
            <div className="photo-card__meta"><span className="photo-card__line" /><span className="photo-card__line short" /></div>
          </li>
        ))}
      </ul>
    );
  } else if (error && images.length === 0) {
    body = (
      <div className="library-state">
        <Alert severity="error" variant="outlined" sx={{ maxWidth: 480 }}>{error}</Alert>
        <Button variant="contained" onClick={() => fetchImages()}>Retry</Button>
      </div>
    );
  } else if (images.length === 0) {
    body = (
      <div className="library-state">
        <Typography variant="h2" component="h2" sx={{ fontSize: '1.75rem' }}>Your library is empty</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          Add a few photos and give them a collection name to get started.
        </Typography>
        <Button variant="contained" size="large" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => setUploadOpen(true)}>
          Add photos
        </Button>
      </div>
    );
  } else if (visible.length === 0) {
    body = (
      <div className="library-state">
        <Typography variant="h2" component="h2" sx={{ fontSize: '1.5rem' }}>
          {activePreset && !search.trim()
            ? 'None of these photos are in your library anymore'
            : 'No photos match'}
        </Typography>
        <Typography color="text.secondary">
          {search.trim() ? `Nothing in ${scopeLabel}.` : 'Try a different collection or saved slideshow.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {search.trim() && <Button variant="outlined" onClick={() => setSearch('')}>Clear search</Button>}
          <Button variant="contained" onClick={showAll}>Show all photos</Button>
        </Box>
      </div>
    );
  } else {
    body = (
      <ul className={`library-grid${fit === 'contain' ? ' is-fit' : ''}`} aria-label="Photos">
        {visible.map((img) => (
          <PhotoCard
            key={img.name}
            photo={img}
            selectionMode={selectionMode}
            selected={selectedNames.includes(img.name)}
            onOpen={openPreview}
            onToggleSelect={toggleSelect}
            onEdit={editPhoto}
            onRequestDelete={requestDelete}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="library">
      <aside className="library-sidebar" aria-label="Collections and saved slideshows">
        {sidebar}
      </aside>

      <div className="library-main">
        <LibraryToolbar
          title="My library"
          scopeLabel={scopeLabel}
          visibleCount={visible.length}
          totalCount={images.length}
          search={search}
          onSearch={setSearch}
          sort={sort}
          onSort={setSort}
          sortLocked={Boolean(activePreset)}
          fit={fit}
          onFit={setFit}
          selectedCollections={selectedCollections}
          onRemoveCollection={toggleCollection}
          onClearFilters={() => setSelectedCollections([])}
          activePreset={activePreset}
          onExitPreset={() => setActivePreset(null)}
          missingInPreset={missingInPreset}
          onPlay={() => setSlideshowOpen(true)}
          onAdd={() => setUploadOpen(true)}
          onSelect={() => setSelectionMode(true)}
          onOpenCollections={() => setCollectionsOpen(true)}
          selectionMode={selectionMode}
          disabled={firstLoad}
        />

        {error && images.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => fetchImages()}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {body}

        {selectionMode && (
          <div className="selection-bar" role="region" aria-label="Selection">
            <Typography sx={{ fontWeight: 600 }} role="status" aria-live="polite">
              {selectedNames.length} selected
            </Typography>
            <Button onClick={selectAllShown} disabled={visible.length === 0} sx={{ color: tokens.viewerText }}>
              Select all shown
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={cancelSelection} sx={{ color: tokens.viewerText }}>Cancel selection</Button>
            <Button
              variant="contained"
              onClick={() => setSaveOpen(true)}
              disabled={selectedNames.length === 0}
              sx={{ bgcolor: tokens.page, color: tokens.text, '&:hover': { bgcolor: '#fff' }, '&.Mui-disabled': { bgcolor: 'rgba(246,244,239,0.3)', color: 'rgba(32,39,35,0.6)' } }}
            >
              Save slideshow
            </Button>
          </div>
        )}
      </div>

      {/* Collections drawer below 1024px */}
      <Drawer
        open={collectionsOpen}
        onClose={() => setCollectionsOpen(false)}
        slotProps={{ paper: { sx: { width: 'min(320px, 88vw)', backgroundColor: tokens.page, p: 2 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2">Browse</Typography>
          <IconButton aria-label="Close collections" onClick={() => setCollectionsOpen(false)} sx={{ width: 44, height: 44 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {sidebar}
      </Drawer>

      <FileSelect
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        existingNames={images.map((img) => img.name)}
        collections={collections.map((c) => c.name).filter(Boolean)}
        defaultCollection={!activePreset && selectedCollections.length === 1 ? selectedCollections[0] : ''}
        onUploaded={addImages}
      />

      {preview && previewPhotos.length > 0 && (
        <Preview
          photos={previewPhotos}
          index={Math.min(preview.index, previewPhotos.length - 1)}
          onIndexChange={(index) => setPreview((p) => ({ ...p, index }))}
          onClose={closePreview}
          onRename={handleRename}
          onCollectionSave={updateCollection}
          onEdit={editPhoto}
          collections={collections.map((c) => c.name).filter(Boolean)}
          existingNames={images.map((img) => img.name)}
          hasSavedSlideshows={presetsApi.presets.length > 0}
        />
      )}

      {slideshowOpen && (
        <Slideshow images={visible} scopeLabel={scopeLabel} onClose={() => setSlideshowOpen(false)} />
      )}

      <SaveSlideshowDialog
        open={saveOpen}
        count={selectedNames.length}
        existingNames={presetsApi.presets}
        onSave={handleSavePreset}
        onClose={() => setSaveOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete photo?"
        confirmLabel="Delete photo"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      >
        “<strong>{deleteTarget}</strong>” will be permanently removed from your library and from any saved slideshows. This can’t be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(presetDeleteTarget)}
        title="Delete saved slideshow?"
        confirmLabel="Delete slideshow"
        onConfirm={confirmPresetDelete}
        onClose={() => setPresetDeleteTarget(null)}
      >
        The saved slideshow “<strong>{presetDeleteTarget}</strong>” will be deleted. Your photos stay in your library.
      </ConfirmDialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : <span />}
      </Snackbar>
    </div>
  );
}
