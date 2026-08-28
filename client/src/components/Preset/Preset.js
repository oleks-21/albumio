import { API_BASE } from '../../api';
import React, { useState, useEffect } from 'react';
import { FormControlLabel, Checkbox, MenuItem, Select, FormControl, Box, Grid } from '@mui/material';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Close';

import './Preset.css';
export default function Preset({
  allImages,
  selectedImages,
  selectedCollections,
  setSelectedCollections,
  setManuallySelectedImageNames,
  setActiveFilterSource,
  email
}) {
  const [selectedImageNames, setSelectedImageNames] = useState([]);


  const [openDialog, setOpenDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState([]);
  const [presetError, setPresetError] = useState('');

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    const fetchPresets = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user-presets?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (cancelled) return;
        setPresets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setPresetError('Could not load your presets.');
      }
    };
    fetchPresets();
    return () => { cancelled = true; };
  }, [email]);

  const handlePresetClick = async (presetName) => {
    try {
      const res = await fetch(`${API_BASE}/api/preset-images?preset=${encodeURIComponent(presetName)}`);
      const { imageIds } = await res.json();

      // Set the checked images in the selector
      setSelectedImageNames(imageIds);
      setManuallySelectedImageNames(imageIds);

      // Force album to use preset filter
      setActiveFilterSource('preset');

      // Optionally clear collections so they don't interfere
      setSelectedCollections([]);
    } catch (err) {
      setPresetError('Could not load that preset. Please try again.');
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await fetch(`${API_BASE}/api/save-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          presetName,
          imageIds: selectedImageNames,
        }),
      });
      setPresetName('');
      setOpenDialog(false);
    } catch (err) {
      setPresetError('Could not save the preset. Please try again.');
    }
  };
  useEffect(() => {
    setSelectedImageNames(prev =>
      prev.length > 0 ? prev : selectedImages.map(img => img.file.name)
    );
  }, [selectedImages]);

  const handleToggleImage = (name) => {
    const updated = selectedImageNames.includes(name)
      ? selectedImageNames.filter(n => n !== name)
      : [...selectedImageNames, name];

    setSelectedImageNames(updated);
    setManuallySelectedImageNames(updated);
    setActiveFilterSource('preset');
  };
  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sx={{width:"100%"}}>
          <FormControl fullWidth>
            <Select
              multiple
              value={selectedImageNames}
              renderValue={() => 'Select Images'}
              sx={{
                height: 36,
                px: 2,
                fontSize: '0.85rem',
                width: '100%',
                minHeight: 'unset',
              }}
            >
              {allImages.map(img => (
                <MenuItem key={img.file.name} value={img.file.name}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedImageNames.includes(img.file.name)}
                        onChange={() => handleToggleImage(img.file.name)}
                      />
                    }
                    label={img.file.name}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6} sx={{width:"100%"}}>
          <Box display="flex" justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => setOpenDialog(true)}
              sx={{
                height: 36,
                px: 2,
                fontSize: '0.85rem',
                width: '100%',
                minHeight: 'unset',
              }}
            >
              Save Preset
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6} sx={{width:"100%"}}>
          <FormControl fullWidth>
            <Select
              displayEmpty
              value=""
              renderValue={() => 'Select a Preset'}
              sx={{
                height: 36,
                px: 2,
                fontSize: '0.85rem',
                width: '100%',
                minHeight: 'unset',
              }}
            >
              {presets.map(name => (
                <MenuItem
                  key={name}
                  value={name}
                  onClick={() => handlePresetClick(name)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{name}</span>
                  <IconButton
                    size="small"
                    aria-label={`Delete preset ${name}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await fetch(`${API_BASE}/api/delete-preset`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, presetName: name }),
                        });
                        setPresets(prev => prev.filter(p => p !== name));
                      } catch (err) {
                        setPresetError('Could not delete the preset. Please try again.');
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>


      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Save New Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePreset}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(presetError)}
        autoHideDuration={6000}
        onClose={() => setPresetError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setPresetError('')}>
          {presetError}
        </Alert>
      </Snackbar>
    </Box >

  );
}