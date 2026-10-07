import { API_BASE } from '../../api';
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CreateIcon from "@mui/icons-material/Create";      // ✏️ Draw
import CropIcon from "@mui/icons-material/Crop";          // ✂️ Crop
import ColorLensIcon from "@mui/icons-material/ColorLens"; // 🎨 Adjust
import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Slider, ToggleButton, ToggleButtonGroup, Snackbar, Alert, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff"; // 🩹 Eraser
import { useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { tokens } from '../../theme';
import './EditImage.css';

/**
 * Brush stroke types. `dash` is a function of the current line width so the
 * pattern stays visible at any brush size. All are canvas-native settings.
 */
const STROKE_TYPES = {
  round:  { label: 'Round',  lineCap: 'round',  lineJoin: 'round', dash: () => [] },
  square: { label: 'Square', lineCap: 'butt',   lineJoin: 'miter', dash: () => [] },
  dashed: { label: 'Dashed', lineCap: 'butt',   lineJoin: 'round', dash: (w) => [w * 2, w * 1.5] },
  dotted: { label: 'Dotted', lineCap: 'round',  lineJoin: 'round', dash: (w) => [0, w * 1.8] },
};

export default function EditImage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, imageName, collection: imageCollection } = location.state || {};
  const [tabValue, setTabValue] = useState(0);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);

  // Dedicated overlay layer for the in-progress brush stroke. Drawing the whole
  // stroke here (redrawn each move) then compositing once on mouse-up gives
  // clean transparency and continuous dashed/dotted patterns.
  const strokeCanvasRef = useRef(null);
  const strokeCtxRef = useRef(null);
  const strokePointsRef = useRef([]);

  // Brush + Eraser state
  const [brushColor, setBrushColor] = useState("#ff0000");
  const [isEraser, setIsEraser] = useState(false);
  const [thickness, setThickness] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100); // %
  const [strokeType, setStrokeType] = useState("round");

  // Crop state
  const [cropRect, setCropRect] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const startPoint = useRef(null);

  // Adjust Color state
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100); // % (default 100%)
  const [temperature, setTemperature] = useState(0); // warm/cool shift

  const [newImageName, setNewImageName] = useState(imageName || '');
  const [newCollection, setNewCollection] = useState(imageCollection || '');
  const [imageStatus, setImageStatus] = useState('loading');
  // Bumped whenever the displayed image size changes so the crop overlay re-renders.
  const [, setLayoutVersion] = useState(0);
  const imgRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const email = useSelector(state => state.user.email);

  // Open at the top: the router keeps the library's scroll position, which on
  // phones left the photo scrolled out of view.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineWidth = thickness;
      ctxRef.current = ctx;
    }
    if (strokeCanvasRef.current) {
      strokeCtxRef.current = strokeCanvasRef.current.getContext("2d");
    }
    // Mount-only context acquisition; `thickness` is applied per-stroke, so it
    // is intentionally not a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Match the canvases' on-screen size to the displayed image and record the
   * natural/displayed scale used to map pointer positions. Only the CSS size
   * changes on resize, so existing artwork is preserved; the bitmap is sized
   * once, on load.
   */
  const syncCanvasSize = useCallback((img, { initBitmap = false } = {}) => {
    if (!img || !img.clientWidth || !img.clientHeight) return;
    [canvasRef.current, strokeCanvasRef.current].forEach((canvas) => {
      if (!canvas) return;
      if (initBitmap) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      canvas.style.width = `${img.clientWidth}px`;
      canvas.style.height = `${img.clientHeight}px`;
      canvas.dataset.scaleX = (img.naturalWidth / img.clientWidth).toString();
      canvas.dataset.scaleY = (img.naturalHeight / img.clientHeight).toString();
    });
    setLayoutVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (img.complete && img.naturalWidth) syncCanvasSize(img);
    });
    observer.observe(img);
    return () => observer.disconnect();
  }, [syncCanvasSize, imageUrl]);

  const getScaledCoords = (e) => {
    const canvas = canvasRef.current;
    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");
    return {
      x: e.nativeEvent.offsetX * scaleX,
      y: e.nativeEvent.offsetY * scaleY,
    };
  };

  /** Apply the current brush settings (width / cap / join / dash) to a context. */
  const applyBrushStyle = (ctx, { forceSolidRound = false } = {}) => {
    const type = STROKE_TYPES[strokeType] || STROKE_TYPES.round;
    ctx.lineWidth = thickness;
    if (forceSolidRound) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([]);
    } else {
      ctx.lineCap = type.lineCap;
      ctx.lineJoin = type.lineJoin;
      ctx.setLineDash(type.dash(thickness));
    }
  };

  /** Stroke the full collected path onto a context in one pass. */
  const renderStrokePath = (ctx) => {
    const pts = strokePointsRef.current;
    if (pts.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) {
      // A single click — nudge so a round cap renders a dot.
      ctx.lineTo(pts[0].x + 0.01, pts[0].y + 0.01);
    } else {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  };

  /** ✏️ Drawing */
  const startDrawing = (e) => {
    if (tabValue !== 0) return;
    if (!ctxRef.current) return;
    isDrawing.current = true;
    const { x, y } = getScaledCoords(e);
    strokePointsRef.current = [{ x, y }];

    if (isEraser) {
      const ctx = ctxRef.current;
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      applyBrushStyle(ctx, { forceSolidRound: true });
      renderStrokePath(ctx);
    } else {
      // Live-preview transparency via the overlay element's CSS opacity.
      const sc = strokeCanvasRef.current;
      if (sc) sc.style.opacity = String(brushOpacity / 100);
    }
  };

  const draw = (e) => {
    if (tabValue !== 0) return;
    if (!isDrawing.current) return;
    const { x, y } = getScaledCoords(e);
    strokePointsRef.current.push({ x, y });

    if (isEraser) {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      applyBrushStyle(ctx, { forceSolidRound: true });
      renderStrokePath(ctx);
    } else {
      const sctx = strokeCtxRef.current;
      const sc = strokeCanvasRef.current;
      if (!sctx || !sc) return;
      sctx.clearRect(0, 0, sc.width, sc.height);
      sctx.globalCompositeOperation = "source-over";
      sctx.strokeStyle = brushColor;
      applyBrushStyle(sctx);
      renderStrokePath(sctx);
    }
  };

  const stopDrawing = () => {
    if (tabValue !== 0) return;
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (isEraser) {
      if (ctxRef.current) ctxRef.current.globalCompositeOperation = "source-over";
    } else {
      // Composite the finished stroke onto the main canvas at the chosen alpha.
      const mainCtx = ctxRef.current;
      const sc = strokeCanvasRef.current;
      const sctx = strokeCtxRef.current;
      if (mainCtx && sc && sctx) {
        mainCtx.save();
        mainCtx.globalCompositeOperation = "source-over";
        mainCtx.globalAlpha = brushOpacity / 100;
        mainCtx.setLineDash([]);
        mainCtx.drawImage(sc, 0, 0);
        mainCtx.restore();
        sctx.clearRect(0, 0, sc.width, sc.height);
      }
    }
    strokePointsRef.current = [];
  };

  /** 📐 Crop Selection */
  const startSelection = (e) => {
    if (tabValue !== 1) return;
    setIsSelecting(true);
    const { x, y } = getScaledCoords(e);
    startPoint.current = { x, y };
    setCropRect(null);
  };

  const updateSelection = (e) => {
    if (tabValue !== 1 || !isSelecting) return;
    const { x, y } = getScaledCoords(e);
    const sx = startPoint.current.x;
    const sy = startPoint.current.y;
    setCropRect({
      x: Math.min(sx, x),
      y: Math.min(sy, y),
      w: Math.abs(x - sx),
      h: Math.abs(y - sy),
    });
  };

  const stopSelection = () => {
    if (tabValue !== 1) return;
    setIsSelecting(false);
  };

  /** 🎨 Adjust color filter string */
  const filterString = `
    hue-rotate(${hue}deg)
    saturate(${saturation}%)
    sepia(${temperature > 0 ? temperature : 0}%)
    invert(${temperature < 0 ? -temperature : 0}%)
  `;
  const uploadImage = async (blob) => {
    const formData = new FormData();
    formData.append('image', blob, `${newImageName || 'edited'}.png`);
    formData.append('email', email);
    formData.append('fileName', newImageName || 'edited.png');
    if (newCollection.trim()) {
      formData.append('collection', newCollection.trim());
    }

    try {
      const response = await fetch(`${API_BASE}/api/upload-image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      return response.ok ? result : null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };
  // Promisified toBlob that surfaces the SecurityError thrown when the source
  // image is cross-origin without CORS headers (a "tainted" canvas).
  const canvasToBlob = (canvasEl) =>
    new Promise((resolve, reject) => {
      try {
        canvasEl.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Could not export image.'))),
          'image/png'
        );
      } catch (err) {
        reject(err);
      }
    });

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const imgEl = document.getElementById("editImage");
    if (!canvas || !imgEl) return;

    setSaving(true);
    setSaveError('');
    try {
      // 1️⃣ Merge image + drawings
      const mergedCanvas = document.createElement("canvas");
      mergedCanvas.width = canvas.width;
      mergedCanvas.height = canvas.height;
      const mergedCtx = mergedCanvas.getContext("2d");
      mergedCtx.filter = filterString;
      mergedCtx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      mergedCtx.filter = "none";
      mergedCtx.drawImage(canvas, 0, 0);

      let exportCanvas = mergedCanvas;

      // 2️⃣ Crop if a selection exists
      if (cropRect) {
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropRect.w;
        cropCanvas.height = cropRect.h;
        const cropCtx = cropCanvas.getContext("2d");
        cropCtx.drawImage(
          mergedCanvas,
          cropRect.x, cropRect.y, cropRect.w, cropRect.h,
          0, 0, cropRect.w, cropRect.h
        );
        exportCanvas = cropCanvas;
      }

      // 3️⃣ Export (may throw on a CORS-tainted canvas) then upload
      let blob;
      try {
        blob = await canvasToBlob(exportCanvas);
      } catch {
        throw new Error(
          'This image can’t be saved because it is hosted without cross-origin permission.'
        );
      }

      const result = await uploadImage(blob);
      if (!result) throw new Error('Upload failed. Please try again.');

      // Only navigate once the save actually succeeded.
      navigate('/album_display');
    } catch (err) {
      setSaveError(err.message || 'Could not save the image.');
    } finally {
      setSaving(false);
    }
  };


  const toolLabelSx = { fontSize: '0.875rem', fontWeight: 600, color: tokens.text, mb: 0.5, display: 'block' };

  if (!imageUrl) {
    return (
      <div className="editor-empty">
        <Typography variant="h2" component="h1" sx={{ fontSize: '1.75rem' }}>No photo to edit</Typography>
        <Typography color="text.secondary">
          Open a photo from your library and choose <strong>Edit photo</strong> to start editing.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/album_display" startIcon={<ArrowBackIcon />}>
          Back to library
        </Button>
      </div>
    );
  }

  const scaleX = parseFloat(canvasRef.current?.dataset.scaleX || "1");
  const scaleY = parseFloat(canvasRef.current?.dataset.scaleY || "1");
  const pointerTool = tabValue === 0 || tabValue === 1;

  return (
    <div className="editor">
      <header className="editor__bar">
        <Button component={RouterLink} to="/album_display" startIcon={<ArrowBackIcon />} sx={{ color: tokens.text, flexShrink: 0 }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Back to library</Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Back</Box>
        </Button>
        <Typography component="h1" variant="h6" noWrap title={imageName} sx={{ flex: 1, minWidth: 0 }}>
          {imageName || 'Untitled photo'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || imageStatus !== 'loaded'}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ flexShrink: 0 }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </header>

      <div className="editor__body">
        <div className="editor__stage">
          {imageStatus === 'error' ? (
            <div className="editor__failed">
              <BrokenImageOutlinedIcon sx={{ fontSize: 40 }} aria-hidden />
              <Typography>This photo couldn’t be loaded for editing.</Typography>
              <Button variant="outlined" component={RouterLink} to="/album_display">Back to library</Button>
            </div>
          ) : (
            <div className="editor__canvas-wrap">
              <img
                ref={imgRef}
                src={imageUrl}
                alt={imageName || "Photo being edited"}
                crossOrigin="anonymous"
                className="editor__image"
                style={{ filter: filterString }}
                id="editImage"
                onError={() => setImageStatus('error')}
                onLoad={(e) => {
                  const img = e.target;
                  syncCanvasSize(img, { initBitmap: true });
                  // Acquire contexts here too, so drawing works regardless of
                  // whether the canvas existed at initial mount.
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    ctx.lineCap = "round";
                    ctxRef.current = ctx;
                  }
                  if (strokeCanvasRef.current) {
                    strokeCtxRef.current = strokeCanvasRef.current.getContext("2d");
                  }
                  setImageStatus('loaded');
                }}
              />
              {imageStatus === 'loading' && <CircularProgress className="editor__spinner" aria-label="Loading photo" />}
              {/* Overlay layer showing the in-progress brush stroke (preview only) */}
              <canvas
                ref={strokeCanvasRef}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 2 }}
              />
              <canvas
                ref={canvasRef}
                aria-label={tabValue === 1 ? "Crop area: drag to select" : "Drawing area"}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: pointerTool ? "auto" : "none",
                  cursor: pointerTool ? "crosshair" : "default",
                  touchAction: pointerTool ? "none" : "auto",
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  if (tabValue === 0) startDrawing(e);
                  if (tabValue === 1) startSelection(e);
                }}
                onPointerMove={(e) => {
                  if (tabValue === 0) draw(e);
                  if (tabValue === 1) updateSelection(e);
                }}
                onPointerUp={(e) => {
                  if (tabValue === 0) stopDrawing(e);
                  if (tabValue === 1) stopSelection(e);
                }}
                onPointerCancel={(e) => {
                  if (tabValue === 0) stopDrawing(e);
                  if (tabValue === 1) stopSelection(e);
                }}
              />
              {cropRect && (
                <div
                  className="editor__crop"
                  style={{
                    top: `${cropRect.y / scaleY}px`,
                    left: `${cropRect.x / scaleX}px`,
                    width: `${cropRect.w / scaleX}px`,
                    height: `${cropRect.h / scaleY}px`,
                  }}
                />
              )}
            </div>
          )}
        </div>

        <aside className="editor__panel" aria-label="Editing tools">
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            aria-label="Editing tool"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5, '& .MuiTab-root': { textTransform: 'none', minHeight: 56, fontSize: '0.875rem' } }}
          >
            <Tab icon={<CreateIcon fontSize="small" />} label="Draw" />
            <Tab icon={<CropIcon fontSize="small" />} label="Crop" />
            <Tab icon={<ColorLensIcon fontSize="small" />} label="Color" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography component="label" htmlFor="brushColor" sx={toolLabelSx}>Brush color</Typography>
                  <input
                    type="color"
                    id="brushColor"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="editor__color"
                    disabled={isEraser}
                  />
                </Box>
                <ToggleButton
                  value="eraser"
                  selected={isEraser}
                  onChange={() => setIsEraser((prev) => !prev)}
                  aria-label="Eraser"
                  sx={{ ml: 'auto', textTransform: 'none', gap: 1, height: 44 }}
                >
                  <AutoFixOffIcon fontSize="small" /> Eraser
                </ToggleButton>
              </Box>

              <Box>
                <Typography id="brush-size-label" component="span" sx={toolLabelSx}>Brush size: {thickness}px</Typography>
                <Slider min={1} max={50} value={thickness} onChange={(_, v) => setThickness(v)} aria-labelledby="brush-size-label" />
              </Box>

              <Box>
                <Typography id="brush-opacity-label" component="span" sx={toolLabelSx}>Opacity: {brushOpacity}%</Typography>
                <Slider
                  min={1}
                  max={100}
                  value={brushOpacity}
                  onChange={(_, v) => setBrushOpacity(v)}
                  disabled={isEraser}
                  aria-labelledby="brush-opacity-label"
                />
              </Box>

              <Box>
                <Typography id="stroke-type-label" component="span" sx={toolLabelSx}>Stroke type</Typography>
                <ToggleButtonGroup
                  value={strokeType}
                  exclusive
                  onChange={(_, v) => { if (v) setStrokeType(v); }}
                  size="small"
                  fullWidth
                  disabled={isEraser}
                  aria-labelledby="stroke-type-label"
                >
                  {Object.entries(STROKE_TYPES).map(([key, cfg]) => (
                    <ToggleButton key={key} value={key} sx={{ textTransform: "none", fontSize: "0.8125rem" }}>
                      {cfg.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Drag across the photo to choose the area to keep. The crop is applied when you save.
              </Typography>
              <Button variant="outlined" onClick={() => setCropRect(null)} disabled={!cropRect} sx={{ alignSelf: 'flex-start' }}>
                Clear selection
              </Button>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography id="hue-label" component="span" sx={toolLabelSx}>Hue: {hue}°</Typography>
                <Slider min={-180} max={180} value={hue} onChange={(_, v) => setHue(v)} aria-labelledby="hue-label" />
              </Box>
              <Box>
                <Typography id="saturation-label" component="span" sx={toolLabelSx}>Saturation: {saturation}%</Typography>
                <Slider min={0} max={300} value={saturation} onChange={(_, v) => setSaturation(v)} aria-labelledby="saturation-label" />
              </Box>
              <Box>
                <Typography id="temperature-label" component="span" sx={toolLabelSx}>Temperature: {temperature}</Typography>
                <Slider min={-100} max={100} value={temperature} onChange={(_, v) => setTemperature(v)} aria-labelledby="temperature-label" />
              </Box>
            </Box>
          )}

          <Box component="section" aria-labelledby="save-details-heading" sx={{ mt: 4, pt: 3, borderTop: `1px solid ${tokens.border}` }}>
            <Typography id="save-details-heading" component="h2" variant="h6" sx={{ mb: 0.5 }}>Save details</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Saving with the current name replaces the original photo. Enter a new name to keep both.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="File name"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Collection"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </aside>
      </div>

      <Snackbar
        open={Boolean(saveError)}
        autoHideDuration={6000}
        onClose={() => setSaveError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      </Snackbar>
    </div>
  );
}
