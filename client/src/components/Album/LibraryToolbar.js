import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FilterListIcon from '@mui/icons-material/FilterList';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import { tokens } from '../../theme';
import { collectionLabel } from '../CollectionDisplay/CollectionDisplay';

const compactControl = { '& .MuiOutlinedInput-root': { height: 40 } };

export default function LibraryToolbar({
  title,
  scopeLabel,
  visibleCount,
  totalCount,
  search,
  onSearch,
  sort,
  onSort,
  sortLocked,
  fit,
  onFit,
  selectedCollections,
  onRemoveCollection,
  onClearFilters,
  activePreset,
  onExitPreset,
  missingInPreset,
  onPlay,
  onAdd,
  onSelect,
  onOpenCollections,
  selectionMode,
  disabled,
}) {
  const filtered = selectedCollections.length > 0 || Boolean(activePreset) || Boolean(search.trim());

  let summary;
  if (totalCount === 0) summary = 'No photos yet';
  else if (!filtered) summary = `${totalCount} ${totalCount === 1 ? 'photo' : 'photos'}`;
  else {
    summary = `Showing ${visibleCount} of ${totalCount} photos`;
    if (activePreset) summary += ` in saved slideshow “${activePreset.name}”`;
    else if (selectedCollections.length) {
      summary += ` in ${selectedCollections.map((c) => collectionLabel(c)).join(' or ')}`;
    }
    if (search.trim()) summary += ` matching “${search.trim()}”`;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Heading row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontFamily: 'inherit', fontWeight: 600, fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.2 }} noWrap>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={visibleCount === 0 ? 'No photos to play' : `Play ${scopeLabel}`}>
            {/* span keeps the tooltip working while the button is disabled */}
            <span>
              <Button
                variant="outlined"
                startIcon={<PlayArrowRoundedIcon />}
                onClick={onPlay}
                disabled={visibleCount === 0 || disabled}
                aria-label={`Play slideshow: ${scopeLabel}`}
              >
                Play slideshow
              </Button>
            </span>
          </Tooltip>
          <Button variant="contained" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={onAdd}>
            Add photos
          </Button>
        </Box>
      </Box>

      {/* Search / sort / view row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={onOpenCollections}
          sx={{ '@media (min-width: 1024px)': { display: 'none' } }}
        >
          Collections{selectedCollections.length ? ` (${selectedCollections.length})` : ''}
        </Button>
        <TextField
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search photos…"
          size="small"
          sx={{ ...compactControl, flex: '1 1 200px', maxWidth: { sm: 360 } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search photos by name or collection', type: 'search' },
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => onSearch('')} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
        <Select
          size="small"
          value={sortLocked ? 'saved' : sort}
          onChange={(e) => onSort(e.target.value)}
          disabled={sortLocked}
          inputProps={{ 'aria-label': 'Sort photos' }}
          sx={{ height: 40, minWidth: 132 }}
        >
          {sortLocked && <MenuItem value="saved">Saved order</MenuItem>}
          <MenuItem value="asc">Name A–Z</MenuItem>
          <MenuItem value="desc">Name Z–A</MenuItem>
        </Select>
        <ToggleButtonGroup
          value={fit}
          exclusive
          size="small"
          onChange={(_, v) => v && onFit(v)}
          aria-label="Thumbnail view"
          sx={{ height: 40 }}
        >
          <ToggleButton value="cover" aria-label="Fill frames">
            <Tooltip title="Fill frames"><CropSquareIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="contain" aria-label="Fit photos">
            <Tooltip title="Fit photos (uncropped)"><FitScreenOutlinedIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        {!selectionMode && (
          <Button variant="outlined" startIcon={<CheckBoxOutlinedIcon />} onClick={onSelect} disabled={visibleCount === 0}>
            Select
          </Button>
        )}
      </Box>

      {/* Context row */}
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1.5, minHeight: 32 }}
      >
        <Typography variant="body2" color="text.secondary" role="status" aria-live="polite" sx={{ mr: 0.5 }}>
          {summary}
        </Typography>
        {activePreset ? (
          <Chip
            label={`Saved slideshow: ${activePreset.name}`}
            onDelete={onExitPreset}
            deleteIcon={<ClearIcon aria-label={`Exit saved slideshow ${activePreset.name}`} />}
            sx={{ bgcolor: tokens.selected, border: `1px solid ${tokens.accent}` }}
          />
        ) : (
          selectedCollections.map((c) => (
            <Chip
              key={c || '__unfiled'}
              label={collectionLabel(c)}
              onDelete={() => onRemoveCollection(c)}
              deleteIcon={<ClearIcon aria-label={`Remove filter ${collectionLabel(c)}`} />}
              sx={{ bgcolor: tokens.selected, border: `1px solid ${tokens.accent}`, maxWidth: 220 }}
            />
          ))
        )}
        {activePreset && (
          <Button size="small" onClick={onExitPreset} sx={{ minHeight: 32 }}>Exit saved slideshow</Button>
        )}
        {!activePreset && selectedCollections.length > 0 && (
          <Button size="small" onClick={onClearFilters} sx={{ minHeight: 32 }}>Clear filters</Button>
        )}
        {missingInPreset > 0 && (
          <Typography variant="body2" sx={{ color: tokens.textSecondary, width: '100%' }}>
            {missingInPreset} {missingInPreset === 1 ? 'photo in this slideshow is' : 'photos in this slideshow are'} no longer in your library.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
