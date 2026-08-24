import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useSelector } from 'react-redux';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';

export default function FileSelect({ onImagesRetrieved }) {
  const email = useSelector(state => state.user.email);
  const [collection, setCollection] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (event) => {
    const files = Array.from(event.target.files).filter(
      (file) => file.name !== '.DS_Store'
    );
    if (files.length > 0) {
      setSelectedFiles(files);
    }
    event.target.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const uploadedImages = [];

    for (const file of selectedFiles) {
      const result = await uploadImage(file);
      if (result) {
        uploadedImages.push({
          file: { name: result.name },
          url: result.url,
          name: result.name,
          collection: collection.trim()
        });
      }
    }

    if (uploadedImages.length > 0 && onImagesRetrieved) {
      onImagesRetrieved(uploadedImages);
    }

    setSelectedFiles([]);
    setCollection('');
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('email', email);
    formData.append('fileName', file.name);
    if (collection.trim()) {
      formData.append('collection', collection.trim());
    }

    try {
      const response = await fetch('https://albumio-backend.onrender.com/api/upload-image', {
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

  return (
    <Stack spacing={2} direction="column" alignItems="flex-start" sx={{ width: '100%' }}>
      <input
        accept="image/*"
        id="file-upload"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <input
        accept="image/*"
        id="folder-upload"
        type="file"
        multiple
        webkitdirectory="true"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
        <label htmlFor="file-upload" style={{ width: "50%" }}>
          <Button variant="contained" component="span" style={{ width: "100%" }}>
            Select Files
          </Button>
        </label>

        <label htmlFor="folder-upload" style={{ width: "50%" }}>
          <Button variant="contained" component="span" style={{ width: "100%" }}>
            Select Folder
          </Button>
        </label>
      </Stack>

      {selectedFiles.length > 0 && (
        <>
          <Typography variant="body2">{selectedFiles.length} file(s) selected</Typography>

          <Accordion sx={{ width: '100%' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">View Selected Files</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ul style={{ margin: 0, paddingLeft: '1em' }}>
                {selectedFiles.map((file, index) => (
                  <li key={index}>
                    <Typography variant="body2">{file.name}</Typography>
                  </li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>
        </>
      )}
      <TextField
        label="Collection Name"
        variant="outlined"
        size="small"
        fullWidth
        value={collection}
        onChange={(e) => setCollection(e.target.value)}
      />
      <div style={{width:"20em"}}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          fullWidth
          disabled={selectedFiles.length === 0 || collection.length == 0}
        >
          Upload All
        </Button>
      </div>

    </Stack>
  );
}
