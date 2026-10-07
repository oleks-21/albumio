import { memo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Button from '@mui/material/Button';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CheckIcon from '@mui/icons-material/Check';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import useImageStatus from '../common/useImageStatus';
import { collectionLabel } from '../CollectionDisplay/CollectionDisplay';
import { tokens } from '../../theme';

/**
 * One library tile. The thumbnail is a real <button>; the selection toggle and
 * the overflow menu are sibling controls (never nested inside it).
 */
function PhotoCard({ photo, selectionMode, selected, onOpen, onToggleSelect, onEdit, onRequestDelete }) {
  const img = useImageStatus(photo.url);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const name = photo.name;
  const collection = collectionLabel(photo.collection);

  const handleMain = (e) => {
    if (selectionMode) onToggleSelect(name);
    else onOpen(name, e.currentTarget);
  };

  return (
    <li className={`photo-card${selected ? ' is-selected' : ''}${selectionMode ? ' is-selecting' : ''}`}>
      <div className="photo-card__frame">
        <button
          type="button"
          className="photo-card__open"
          data-photo-name={name}
          onClick={handleMain}
          aria-label={selectionMode ? `Select ${name}` : `Open ${name}`}
          aria-pressed={selectionMode ? selected : undefined}
        >
          {img.status !== 'error' && (
            <img
              key={img.key}
              ref={img.ref}
              src={img.src}
              alt=""
              loading="lazy"
              decoding="async"
              width={400}
              height={300}
              onLoad={img.onLoad}
              onError={img.onError}
              className={img.status === 'loaded' ? 'is-loaded' : ''}
            />
          )}
          {img.status === 'loading' && <span className="photo-card__skeleton" aria-hidden="true" />}
          {img.status === 'error' && (
            <span className="photo-card__failed">
              <BrokenImageOutlinedIcon aria-hidden="true" />
              <span>Photo didn’t load</span>
            </span>
          )}
          {selectionMode && (
            <span className="photo-card__check" aria-hidden="true">
              {selected && <CheckIcon sx={{ fontSize: 18 }} />}
            </span>
          )}
        </button>

        {img.status === 'error' && (
          <Button
            size="small"
            variant="outlined"
            className="photo-card__retry"
            onClick={img.retry}
            aria-label={`Retry loading ${name}`}
          >
            Retry
          </Button>
        )}

        {!selectionMode && (
          <>
            <IconButton
              className="photo-card__select"
              aria-label={`Select ${name}`}
              onClick={() => onToggleSelect(name)}
              size="small"
            >
              <span className="photo-card__check" aria-hidden="true" />
            </IconButton>
            <IconButton
              className="photo-card__more"
              aria-label={`More actions for ${name}`}
              aria-haspopup="menu"
              aria-expanded={Boolean(menuAnchor)}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              size="small"
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </div>

      <div className="photo-card__meta">
        <span className="photo-card__name" title={name}>{name}</span>
        <span className="photo-card__collection" title={collection}>{collection}</span>
      </div>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={(e) => { setMenuAnchor(null); onOpen(name, menuAnchor); }} sx={{ minHeight: 44 }}>
          <ListItemIcon><OpenInFullIcon fontSize="small" /></ListItemIcon>
          Open
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onEdit(photo); }} sx={{ minHeight: 44 }}>
          <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
          Edit photo
        </MenuItem>
        <MenuItem
          onClick={() => { setMenuAnchor(null); onRequestDelete(name); }}
          sx={{ minHeight: 44, color: tokens.destructive }}
        >
          <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: tokens.destructive }} /></ListItemIcon>
          Delete photo
        </MenuItem>
      </Menu>
    </li>
  );
}

export default memo(PhotoCard);
