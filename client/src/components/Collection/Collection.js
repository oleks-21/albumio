import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import './Collection.css';
import { useState } from 'react';

export default function Collection({ imageUrl, originalName, email, onClose, onSubmit }) {
  const [newName, setNewName] = useState(originalName);
  const [collectionName, setCollectionName] = useState('');

  const handleSubmit = () => {
    onSubmit({
      url: imageUrl,
      newName,
      collection: collectionName,
    });
    onClose();
  };

  return (
    <div className="collection-overlay" onClick={onClose}>
      <Card className="collection-card" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Preview" style={{ maxWidth: '18em', maxHeight: '10em' }} />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Image Name"
          fullWidth
          style={{ marginTop: '1em' }}
        />
        <Input
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          placeholder="Collection Name"
          fullWidth
          style={{ marginTop: '1em' }}
        />
        <Button variant="contained" onClick={handleSubmit} sx={{ marginTop: '1em' }}>
          Submit To Album
        </Button>
      </Card>
    </div>
  );
}
