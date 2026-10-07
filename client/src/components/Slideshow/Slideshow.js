import { useCallback, useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { viewerTheme, tokens } from '../../theme';
import useImageStatus from '../common/useImageStatus';
import './Slideshow.css';

const HIDE_AFTER_MS = 3000;
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
const canFullscreen = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);

function Slide({ photo, onSkip }) {
  const img = useImageStatus(photo.url);
  if (img.status === 'error') {
    return (
      <div className="slideshow__failed">
        <Typography>“{photo.name}” didn’t load.</Typography>
        <div>
          <Button variant="outlined" onClick={img.retry} sx={{ mr: 1 }}>Retry</Button>
          {onSkip && <Button onClick={onSkip}>Skip</Button>}
        </div>
      </div>
    );
  }
  return (
    <img
      key={img.key}
      ref={img.ref}
      src={img.src}
      alt={photo.name}
      onLoad={img.onLoad}
      onError={img.onError}
      className={`slideshow__image${img.status === 'loaded' ? ' is-loaded' : ''}`}
    />
  );
}

/**
 * Full-screen slideshow over the library's current visible photos. Starts
 * paused; Space plays/pauses, arrows navigate, Escape closes.
 */
export default function Slideshow({ images, scopeLabel = 'all photos', onClose }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [interval, setIntervalMs] = useState(5000);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef(null);
  const dockRef = useRef(null);
  const hideTimer = useRef(null);

  const count = images.length;
  const photo = images[Math.min(index, count - 1)];

  const go = useCallback((delta) => {
    if (count < 2) return;
    setIndex((i) => (i + delta + count) % count);
  }, [count]);

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing || count < 2) return undefined;
    const t = setTimeout(() => go(1), interval);
    return () => clearTimeout(t);
  }, [playing, index, interval, count, go]);

  // Preload the next photo.
  useEffect(() => {
    if (count < 2) return;
    const next = images[(index + 1) % count];
    if (next) new Image().src = next.url;
  }, [index, images, count]);

  // Show controls on activity; hide after inactivity while playing, but never
  // while a control has keyboard focus.
  const poke = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const active = document.activeElement;
      const keyboardFocusInDock = dockRef.current?.contains(active) && active.matches(':focus-visible');
      if (!keyboardFocusInDock) setControlsVisible(false);
    }, HIDE_AFTER_MS);
  }, []);

  useEffect(() => {
    if (playing) poke();
    else {
      clearTimeout(hideTimer.current);
      setControlsVisible(true);
    }
  }, [playing, poke]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Track the Fullscreen API separately from the viewport overlay.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handleKeyDown = (e) => {
    poke();
    if (isTyping(e.target)) return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (e.target.closest?.('button')) return; // let the focused button handle it
      e.preventDefault();
      if (count > 1) setPlaying((p) => !p);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  if (!photo) return null;

  const hidden = !controlsVisible;

  return (
    <ThemeProvider theme={viewerTheme}>
      <Dialog
        open
        fullScreen
        onClose={onClose}
        onKeyDown={handleKeyDown}
        aria-label={`Slideshow: ${scopeLabel}`}
        slotProps={{ paper: { sx: { bgcolor: tokens.viewerBg, color: tokens.viewerText } } }}
      >
        <div
          ref={rootRef}
          className={`slideshow${hidden ? ' is-idle' : ''}`}
          onPointerMove={poke}
          onPointerDown={poke}
          onTouchStart={poke}
        >
          <div className="slideshow__top">
            <Typography variant="body2" sx={{ color: tokens.viewerTextSecondary }} noWrap>
              Slideshow · {scopeLabel}
            </Typography>
          </div>

          <div className="slideshow__stage" key={index} aria-live={playing ? 'off' : 'polite'}>
            <Slide photo={photo} onSkip={count > 1 ? () => go(1) : null} />
          </div>

          <div className="slideshow__dock" ref={dockRef} role="toolbar" aria-label="Slideshow controls">
            <Tooltip title="Previous (←)">
              <span>
                <IconButton aria-label="Previous photo" onClick={() => go(-1)} disabled={count < 2}>
                  <SkipPreviousRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={playing ? 'Pause (Space)' : 'Play (Space)'}>
              <span>
                <IconButton
                  aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                  onClick={() => setPlaying((p) => !p)}
                  disabled={count < 2}
                  className="slideshow__play"
                >
                  {playing ? <PauseRoundedIcon fontSize="large" /> : <PlayArrowRoundedIcon fontSize="large" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next (→)">
              <span>
                <IconButton aria-label="Next photo" onClick={() => go(1)} disabled={count < 2}>
                  <SkipNextRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="body2" sx={{ minWidth: 56, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
              {index + 1} / {count}
            </Typography>
            <div className="slideshow__interval">
              <Typography id="slideshow-interval-label" variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                Every {interval / 1000}s
              </Typography>
              <Slider
                min={2000}
                max={15000}
                step={1000}
                value={interval}
                onChange={(_, val) => setIntervalMs(val)}
                aria-labelledby="slideshow-interval-label"
                getAriaValueText={(v) => `${v / 1000} seconds per photo`}
                size="small"
                sx={{ width: 120 }}
              />
            </div>
            {canFullscreen && (
              <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
                <IconButton aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} onClick={toggleFullscreen}>
                  {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Button onClick={onClose} startIcon={<CloseIcon />} sx={{ color: tokens.viewerText }}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </ThemeProvider>
  );
}
