import { API_BASE } from '../../api';
import React, { useEffect, useState } from 'react';
import { FormControl, CircularProgress, Chip, Box, Alert, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

import './CollectionDisplay.css';

export default function CollectionDisplay({ selectedCollections, setSelectedCollections, setActiveFilterSource }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const email = useSelector(state => state.user.email);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    const fetchCollections = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/api/collections?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          setCollections(data);
        } else {
          setError('Could not load collections.');
        }
      } catch (err) {
        if (!cancelled) setError('Could not load collections. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCollections();
    return () => { cancelled = true; };
  }, [email]);

  const generateColorFromName = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 75%)`;
  };

  const handleToggle = (name) => {
    setSelectedCollections((prev) =>
      prev.includes(name) ? prev.filter(val => val !== name) : [...prev, name]
    );
    setActiveFilterSource('collection');

  };

  return (
    <FormControl
      component="fieldset"
      sx={{
        marginTop: '12px',
        width: '100%',         // takes full width of menu-container (20em)
        maxWidth: '20em',      // keep consistent with FileSelect
        '& .MuiFormLabel-root': {
          textAlign: 'left',
        },
      }}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>{error}</Alert>
      ) : collections.length === 0 ? (
        <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
          No collections yet. Add a collection name when you upload images.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em', mt: 1, maxWidth: '100%'}}>
          {collections.map((name) => (
            <Chip
              key={name}
              label={name}
              clickable
              onClick={() => handleToggle(name)}
              sx={{
                backgroundColor: generateColorFromName(name),
                color: 'black',
                fontWeight: 'bold',
                opacity: selectedCollections.includes(name) ? 1 : 0.6,
                border: selectedCollections.includes(name) ? '2px solid black' : 'none',
              }}
            />
          ))}
        </Box>
      )}
    </FormControl>
  );
}
