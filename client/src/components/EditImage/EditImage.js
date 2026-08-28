import { API_BASE } from '../../api';
import { useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CreateIcon from "@mui/icons-material/Create";      // ✏️ Draw
import CropIcon from "@mui/icons-material/Crop";          // ✂️ Crop
import ColorLensIcon from "@mui/icons-material/ColorLens"; // 🎨 Adjust
import { useState, useRef, useEffect } from "react";
import { Button, IconButton, Tooltip, Slider, ToggleButton, ToggleButtonGroup, Snackbar, Alert, CircularProgress } from "@mui/material";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff"; // 🩹 Eraser
import { useSelector } from "react-redux";
import Input from '@mui/material/Input';
import { useNavigate } from 'react-router-dom';

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
  const { imageUrl, imageName } = location.state || {};
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
  const [newCollection, setNewCollection] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const email = useSelector(state => state.user.email);

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


  return (
    <Card
      sx={{
        p: 2,
        minHeight: "100vh",       // 👈 ensures card fills viewport height
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          centered
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<CreateIcon />} label="Draw" />
          <Tab icon={<CropIcon />} label="Crop" />
          <Tab icon={<ColorLensIcon />} label="Adjust Color" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center", alignItems: "flex-start", width: "100%", gap: 3 }}>
        {/* Left Side Tools */}
        {tabValue !== 1 && (   // 👈 hide tools when cropping
          <Box sx={{ width: "50%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Drawing Tools */}
            {tabValue === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                <label htmlFor="brushColor" style={{ fontSize: "0.9rem" }}>Brush Color:</label>
                <div style={{ width: "100%" }}>
                  <input
                    type="color"
                    id="brushColor"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    style={{ width: "40px", height: "40px", border: "none", cursor: "pointer" }}
                    disabled={isEraser}
                  />
                </div>
                <Tooltip title="Toggle Eraser" sx={{ width: '40px', alignSelf: "center" }}>
                  <IconButton onClick={() => setIsEraser((prev) => !prev)} color={isEraser ? "primary" : "default"}>
                    <AutoFixOffIcon />
                  </IconButton>
                </Tooltip>

                <Box>
                  <span style={{ fontSize: "0.8rem" }}>Brush Size</span>
                  <Slider min={1} max={50} value={thickness} onChange={(_, v) => setThickness(v)} />
                </Box>

                <Box>
                  <span style={{ fontSize: "0.8rem" }}>
                    Opacity: {brushOpacity}%
                  </span>
                  <Slider
                    min={1}
                    max={100}
                    value={brushOpacity}
                    onChange={(_, v) => setBrushOpacity(v)}
                    disabled={isEraser}
                  />
                </Box>

                <Box>
                  <span style={{ fontSize: "0.8rem" }}>Stroke Type</span>
                  <ToggleButtonGroup
                    value={strokeType}
                    exclusive
                    onChange={(_, v) => { if (v) setStrokeType(v); }}
                    size="small"
                    fullWidth
                    disabled={isEraser}
                    sx={{ mt: 1, flexWrap: "wrap" }}
                  >
                    {Object.entries(STROKE_TYPES).map(([key, cfg]) => (
                      <ToggleButton key={key} value={key} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                        {cfg.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </Box>
            )}

            {/* Adjust Color Tools */}
            {tabValue === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <span style={{ fontSize: "0.8rem" }}>Hue: {hue}°</span>
                  <Slider min={-180} max={180} value={hue} onChange={(_, v) => setHue(v)} />
                </Box>
                <Box>
                  <span style={{ fontSize: "0.8rem" }}>Saturation: {saturation}%</span>
                  <Slider min={0} max={300} value={saturation} onChange={(_, v) => setSaturation(v)} />
                </Box>
                <Box>
                  <span style={{ fontSize: "0.8rem" }}>Temperature: {temperature}</span>
                  <Slider min={-100} max={100} value={temperature} onChange={(_, v) => setTemperature(v)} />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Right Side: Image + Canvas */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: tabValue === 1 ? "100%" : "50%",   // 👈 full width in crop mode
            height: "100%",
          }}
        >
          {imageUrl ? (
            <div style={{ position: "relative" }}>
              <img
                src={imageUrl}
                alt={imageName || "Editing"}
                crossOrigin="anonymous"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: "8px",
                  display: "block",
                  filter: filterString,
                  margin: "0 auto",              // 👈 center
                }}
                id="editImage"
                onLoad={(e) => {
                  const img = e.target;
                  [canvasRef.current, strokeCanvasRef.current].forEach((canvas) => {
                    if (!canvas) return;
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.style.width = `${img.clientWidth}px`;
                    canvas.style.height = `${img.clientHeight}px`;
                    canvas.dataset.scaleX = (img.naturalWidth / img.clientWidth).toString();
                    canvas.dataset.scaleY = (img.naturalHeight / img.clientHeight).toString();
                  });
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
                }}
              />
              {/* Overlay layer showing the in-progress brush stroke (preview only) */}
              <canvas
                ref={strokeCanvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: tabValue === 0 || tabValue === 1 ? "auto" : "none",
                  cursor: tabValue === 0 || tabValue === 1 ? "crosshair" : "default",
                }}
                onMouseDown={(e) => {
                  if (tabValue === 0) startDrawing(e);
                  if (tabValue === 1) startSelection(e);
                }}
                onMouseMove={(e) => {
                  if (tabValue === 0) draw(e);
                  if (tabValue === 1) updateSelection(e);
                }}
                onMouseUp={(e) => {
                  if (tabValue === 0) stopDrawing(e);
                  if (tabValue === 1) stopSelection(e);
                }}
                onMouseLeave={(e) => {
                  if (tabValue === 0) stopDrawing(e);
                  if (tabValue === 1) stopSelection(e);
                }}
              />
              {cropRect && (
                <div
                  style={{
                    position: "absolute",
                    top: `${cropRect.y / canvasRef.current.dataset.scaleY}px`,
                    left: `${cropRect.x / canvasRef.current.dataset.scaleX}px`,
                    width: `${cropRect.w / canvasRef.current.dataset.scaleX}px`,
                    height: `${cropRect.h / canvasRef.current.dataset.scaleY}px`,
                    border: "2px dashed #6366f1",
                    backgroundColor: "rgba(99,102,241,0.12)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          ) : (
            <p>No image selected for editing.</p>
          )}
        </Box>
      </Box>


      <Box direction="row" sx={{ mt: 3, display: 'flex', width: "100%", flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <Input
          placeholder="Image Name"
          value={newImageName}
          onChange={(e) => setNewImageName(e.target.value)}
          sx={{ width: '90%', maxWidth: "1200px" }}
        />
        <Input
          placeholder="Image Collection"
          value={newCollection}
          onChange={(e) => setNewCollection(e.target.value)}
          sx={{ width: '90%', maxWidth: "1200px" }}
        />
        <Button
          style={{ fontSize: "10px", width: "90%", marginTop: "1em", maxWidth: "1200px" }}
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Box>

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
    </Card>
  );
}
