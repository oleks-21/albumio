import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckIcon from '@mui/icons-material/Check';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import { tokens } from '../../theme';

/** Shared look for sidebar rows (collections and saved slideshows). */
export const rowSx = (active) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  minHeight: 40,
  px: 1.5,
  py: 0.75,
  border: '1px solid',
  borderColor: active ? tokens.accent : 'transparent',
  borderRadius: 1,
  backgroundColor: active ? tokens.selected : 'transparent',
  color: tokens.text,
  font: 'inherit',
  fontSize: '0.9375rem',
  fontWeight: active ? 600 : 500,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { backgroundColor: active ? tokens.selected : tokens.surfaceSubtle },
  '&:focus-visible': { outline: `2px solid ${tokens.accent}`, outlineOffset: 1 },
});

const countSx = { color: tokens.textSecondary, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' };

const UNFILED = '';

/**
 * Builds [{ name, count }] from loaded photos, sorted by name. Photos without a
 * collection are grouped under an "Unfiled" row.
 */
export function collectionCounts(images) {
  const counts = new Map();
  images.forEach((img) => counts.set(img.collection || UNFILED, (counts.get(img.collection || UNFILED) || 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (a.name === UNFILED) return 1;
      if (b.name === UNFILED) return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
    });
}

export const collectionLabel = (name) => (name === UNFILED ? 'Unfiled' : name);

/**
 * Library collection filter. Multi-select with OR semantics; "All photos"
 * clears every filter (collections and an applied saved slideshow).
 */
export default function CollectionDisplay({ collections, totalCount, selectedCollections, allActive, onToggle, onShowAll, onClear }) {
  return (
    <Box component="section" aria-labelledby="collections-heading">
      <Box
        component="button"
        type="button"
        onClick={onShowAll}
        aria-pressed={allActive}
        sx={{ ...rowSx(allActive), width: '100%', mb: 1.5 }}
      >
        <PhotoLibraryOutlinedIcon fontSize="small" sx={{ color: allActive ? tokens.accent : tokens.textSecondary }} />
        <Box component="span" sx={{ flex: 1 }}>All photos</Box>
        <Box component="span" sx={countSx}>{totalCount}</Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, mb: 0.5, minHeight: 32 }}>
        <Typography
          id="collections-heading"
          component="h2"
          sx={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.textSecondary }}
        >
          Collections
        </Typography>
        {selectedCollections.length > 0 && (
          <Button size="small" onClick={onClear} sx={{ minHeight: 32, py: 0, px: 1, mr: -1 }}>
            Clear filters
          </Button>
        )}
      </Box>

      {collections.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>
          Collections appear here once you add photos.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {collections.map(({ name, count }) => {
            const checked = selectedCollections.includes(name);
            return (
              <li key={name || '__unfiled'}>
                <Box
                  component="button"
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggle(name)}
                  sx={{ ...rowSx(checked), width: '100%' }}
                >
                  <Box
                    component="span"
                    aria-hidden
                    sx={{
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '4px',
                      border: `1.5px solid ${checked ? tokens.accent : tokens.textSecondary}`,
                      backgroundColor: checked ? tokens.accent : 'transparent',
                      color: '#fff',
                    }}
                  >
                    {checked && <CheckIcon sx={{ fontSize: 14 }} />}
                  </Box>
                  <Box
                    component="span"
                    sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: name ? 'normal' : 'italic' }}
                  >
                    {collectionLabel(name)}
                  </Box>
                  <Box component="span" sx={countSx}>{count}</Box>
                </Box>
              </li>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
