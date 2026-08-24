import React, { useEffect, useState } from 'react';
import { FormControl, FormLabel, CircularProgress, Chip, Box } from '@mui/material';
import { useSelector } from 'react-redux';

import './CollectionDisplay.css';

export default function CollectionDisplay({ selectedCollections, setSelectedCollections, setActiveFilterSource }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = useSelector(state => state.user.email);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`https://albumio-backend.onrender.com/api/collections?email=${email}`)

        const data = await response.json();
        if (Array.isArray(data)) {
          setCollections(data);
        } else {
          console.error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

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
