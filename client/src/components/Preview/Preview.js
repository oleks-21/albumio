import { API_BASE } from '../../api';
import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Input from '@mui/material/Input';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Preview.css';
export default function Preview({ imageName, imageUrl, imageCollection, onClose }) {
    const [newName, setNewName] = useState(imageName);
    const [newCollection, setNewCollection] = useState(imageCollection || '');
    const email = useSelector(state => state.user.email);
    const navigate = useNavigate();

    const renameImage = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/rename-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName: imageName, newName, email })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Rename successful');
            }
            else {
                console.error('Rename failed:', result.message);
            }
        }
        catch (err) {
            console.error('Rename request error:', err);
        }
    };
    const saveCollection = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/update-collection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageName, email, newCollection })
            });

            const result = await response.json();
            if (result.success) {
                console.log('Collection updated');
            } else {
                console.error('Failed to update collection:', result.message);
            }
        } catch (err) {
            console.error('Collection request error:', err);
        }
    };

    return (
        <div className="preview-overlay" onClick={onClose}>
            <Card className="preview-card">
                <CardContent style={{ width: "18em" }} onClick={(e) => e.stopPropagation()} >
                    <Grid container spacing={2}>
                        <Grid size={8}>
                            <Input style={{ fontSize: "12px", width: "100%", textAlign: "center" }} value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </Grid>
                        <Grid size={4}>
                            <Button style={{ fontSize: "10px", width: "100%" }} variant="contained" onClick={() => renameImage()}>
                                Save Name
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid size={8}>
                            <Input style={{ fontSize: "12px", width: "100%", textAlign: "center" }} value={newCollection} onChange={(e) => setNewCollection(e.target.value)} />
                        </Grid>
                        <Grid size={4}>
                            <Button
                                style={{ fontSize: "10px", width: "100%" }}
                                variant="contained"
                                onClick={saveCollection}
                            >
                                Save Collection
                            </Button>
                        </Grid>
                    </Grid>
                    <img src={imageUrl} alt="Preview" style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '70vh', marginTop: '0.5em' }} />
                    <Button
                        style={{ fontSize: "10px", width: "100%" }}
                        variant="contained"
                        onClick={() => navigate('/edit', { state: { imageUrl, imageName, newCollection } })}
                    >
                        Edit Image
                    </Button>
                </CardContent>
            </Card>
        </div>);
}