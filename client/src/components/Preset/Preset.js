import { API_BASE } from '../../api';
import React, { useState, useEffect } from 'react';
import { FormControlLabel, Checkbox, MenuItem, Select, FormControl, Box, Grid } from '@mui/material';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
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

  useEffect(() => {
    const fetchPresets = async () => {
      const res = await fetch(`${API_BASE}/api/user-presets?email=${email}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPresets(data);
      } else {
        console.warn('Unexpected preset format:', data);
        setPresets([]);
      }
    };
    fetchPresets();
  }, []);

  const handlePresetClick = async (presetName) => {
    const res = await fetch(`${API_BASE}/api/preset-images?preset=${presetName}`);
    const { imageIds } = await res.json();

    // Set the checked images in the selector
    setSelectedImageNames(imageIds);
    setManuallySelectedImageNames(imageIds);

    // Force album to use preset filter
    setActiveFilterSource('preset');

    // Optionally clear collections so they don't interfere
    setSelectedCollections([]);
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
      console.error('Error saving preset:', err);
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
  const generateColorFromName = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 75%)`;
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
                        console.error('Error deleting preset:', err);
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
    </Box >

  );
}