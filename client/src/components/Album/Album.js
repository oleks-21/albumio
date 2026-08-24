import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import FileSelect from '../FileSelect/FileSelect';
import './Album.css';
import Button from '@mui/material/Button';
import Preview from '../Preview/Preview';
import Slideshow from '../Slideshow/Slideshow';
import CollectionDisplay from '../CollectionDisplay/CollectionDisplay';
import Preset from '../Preset/Preset';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function Album() {
  const [images, setImages] = useState([]);
  const email = useSelector(state => state.user.email);

  const [selectedCollections, setSelectedCollections] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilterMode, setActiveFilterMode] = useState('collection');
  const [activeFilterSource, setActiveFilterSource] = useState('collection');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const mode = newValue === 2 ? 'preset' : 'collection';
    setActiveFilterMode(mode);
  };

  const [manuallySelectedImageNames, setManuallySelectedImageNames] = useState([]);

  const filteredImages = images.filter(img => {
    if (activeFilterSource === 'collection') {
      return selectedCollections.length === 0 || selectedCollections.includes(img.collection);
    }

    if (activeFilterSource === 'preset') {
      return manuallySelectedImageNames.includes(img.file.name);
    }

    return true;
  });

  const fetchUserImages = async () => {
    try {
      const response = await fetch(`https://albumio-backend.onrender.com/api/my-images?email=${email}`);
      const files = await response.json();
      if (response.ok && Array.isArray(files)) {
        const imagePreviews = files.map((file) => ({
          file: { name: file.name },
          url: file.url,
          name: file.name,
          collection: file.collection
        }));
        setImages((prev) => [
          ...prev,
          ...imagePreviews.filter((img) => !prev.some((prevImg) => prevImg.url === img.url))
        ]);
      } else {
        console.error('Failed to fetch images');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  useEffect(() => {
    if (email) {
      fetchUserImages();
    }
  }, [email]);

  const handleDelete = async (name) => {
    try {
      const response = await fetch(`https://albumio-backend.onrender.com/api/delete-image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      if (result.success) {
        setImages(prev =>
          prev.filter(img => {
            const imageName = img.name || img.file?.name;
            return imageName !== name;
          })
        );
      } else {
        console.error('Deletion failed:', result.message);
      }
    } catch (err) {
      console.error('Delete request error:', err);
    }
  };

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  const getCols = () => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    if (isLg) return 4;
    return 3;
  };

  const [previewedImage, setPreviewedImage] = useState(null);
  const [previewedImageName, setPreviewedImageName] = useState(null);
  const [previewedImageCollection, setPreviewedImageCollection] = useState(null);
  const previewImage = (imageName) => {
    const found = images.find(img => img.file.name === imageName);
    if (found) {
      setPreviewedImage(found.url);
      setPreviewedImageName(imageName);
      setPreviewedImageCollection(found.collection || '');
    }
  };

  const closePreview = () => {
    setPreviewedImage(null);
  };

  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const openSlideshow = () => setIsSlideshowOpen(true);
  const closeSlideshow = () => setIsSlideshowOpen(false);

  return (
    <div className="album-carousel">
      {/* Wrap Tabs in a container */}
      <div className="tabs-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Upload Images" />
          <Tab label="Filter Collections" />
          <Tab label="Presets" />
        </Tabs>
      </div>

      <Box className={`menu-container top-align ${activeTab === 1 ? "left-align" : "center-align"}`} style={{ marginTop: '1em', marginBottom: '0.5em' }}>
        <div className="menu-box">
          {activeTab === 0 && (
            <FileSelect
              onImagesRetrieved={(uploadedImages) => {
                setImages((prev) => [
                  ...prev,
                  ...uploadedImages.filter(
                    (img) => !prev.some((prevImg) => prevImg.url === img.url)
                  )
                ]);
              }}
            />
          )}
          {activeTab === 1 && (
            <CollectionDisplay
              selectedCollections={selectedCollections}
              setSelectedCollections={setSelectedCollections}
              setActiveFilterSource={setActiveFilterSource}
            />
          )}
          {activeTab === 2 && (
            <Preset
              allImages={images}
              selectedImages={filteredImages}
              selectedCollections={selectedCollections}
              setSelectedCollections={setSelectedCollections}
              setManuallySelectedImageNames={setManuallySelectedImageNames}
              setActiveFilterSource={setActiveFilterSource}
              email={email}
            />
          )}
        </div>
      </Box>


      {previewedImage && (
        <Preview imageName={previewedImageName} imageUrl={previewedImage} imageCollection={previewedImageCollection} onClose={closePreview} />
      )}
      {isSlideshowOpen && (
        <Slideshow images={filteredImages} onClose={closeSlideshow} />
      )}
      <Button
        variant="contained"
        id="slideshowButton"
        onClick={openSlideshow}
      >
        Album Slideshow
      </Button>
      <div style={{ paddingLeft: "2em", paddingRight: "2em" }}>
        {images.length > 0 && (
          <>
            <div className="album-images">
              <ImageList
                sx={{
                  width: '100%',
                  height: 'auto',
                  overflow: 'hidden',
                }}
                cols={getCols()}
                gap={16}
              >
                {filteredImages.map((img, index) => (
                  <ImageListItem key={index} sx={{ position: 'relative' }}>
                    <img
                      src={img.url}
                      alt={img.file.name}
                      loading="lazy"
                      onClick={() => previewImage(img.file.name)}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        padding: '2px',
                        backgroundColor: 'rgba(108, 0, 0, 0.7)',
                        '&:hover': { backgroundColor: 'rgb(108, 0, 0)' },
                      }}
                      size="small"
                      onClick={() => handleDelete(img.file.name)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            </div>



          </>
        )}
      </div>
    </div>
  );
}
