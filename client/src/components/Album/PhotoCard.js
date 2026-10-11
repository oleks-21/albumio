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
 * One photo tile. The thumbnail is a real <button>; the selection toggle and
 * the overflow menu are sibling controls (never nested inside it).
 *
 * Library photos are keyed by filename. Event photos pass `photo.id`,
 * `photo.title` and `photo.subtitle`, their own `actions` menu, and
 * `signed` URLs that `onRetryImage` refreshes instead of cache-busting.
 */
function PhotoCard({
  photo, selectionMode = false, selected = false, selectable = true, signed = false,
  onOpen, onToggleSelect, onEdit, onRequestDelete, actions, onRetryImage,
}) {
  const img = useImageStatus(photo.url, { identity: photo.id, bust: !signed });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const key = photo.id ?? photo.name;
  const name = photo.title ?? photo.name;
  const collection = photo.subtitle ?? collectionLabel(photo.collection);
  const retryImage = () => {
    img.retry();
    onRetryImage?.(photo);
  };
  const menu = actions || [
    { label: 'Open', icon: OpenInFullIcon, onClick: () => onOpen(key, menuAnchor) },
    { label: 'Edit photo', icon: EditOutlinedIcon, onClick: () => onEdit(photo) },
    { label: 'Delete photo', icon: DeleteOutlineIcon, onClick: () => onRequestDelete(name), destructive: true },
  ];

  const handleMain = (e) => {
    if (selectionMode) onToggleSelect(key);
    else onOpen(key, e.currentTarget);
  };

  return (
    <li className={`photo-card${selected ? ' is-selected' : ''}${selectionMode ? ' is-selecting' : ''}${photo.dimmed ? ' is-dimmed' : ''}`}>
      <div className="photo-card__frame">
        <button
          type="button"
          className="photo-card__open"
          data-photo-name={key}
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
          {photo.badges?.length > 0 && (
            <span className="photo-card__badges">
              {photo.badges.map((badge) => <span key={badge} className="photo-card__badge">{badge}</span>)}
            </span>
          )}
        </button>

        {img.status === 'error' && (
          <Button
            size="small"
            variant="outlined"
            className="photo-card__retry"
            onClick={retryImage}
            aria-label={`Retry loading ${name}`}
          >
            Retry
          </Button>
        )}

        {!selectionMode && (
          <>
            {selectable && (
              <IconButton
                className="photo-card__select"
                aria-label={`Select ${name}`}
                onClick={() => onToggleSelect(key)}
                size="small"
              >
                <span className="photo-card__check" aria-hidden="true" />
              </IconButton>
            )}
            {menu.length > 0 && (
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
            )}
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
        {menu.map(({ label, icon: Icon, onClick, destructive }) => (
          <MenuItem
            key={label}
            onClick={() => { setMenuAnchor(null); onClick(photo); }}
            sx={{ minHeight: 44, ...(destructive ? { color: tokens.destructive } : {}) }}
          >
            {Icon && (
              <ListItemIcon>
                <Icon fontSize="small" sx={destructive ? { color: tokens.destructive } : undefined} />
              </ListItemIcon>
            )}
            {label}
          </MenuItem>
        ))}
      </Menu>
    </li>
  );
}

export default memo(PhotoCard);
