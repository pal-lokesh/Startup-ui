import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { Image } from '../types';
import ImageService from '../services/imageService';
import ImageUpload from './ImageUpload';

interface ThemeImagesProps {
  themeId: string;
  themeName: string;
}

const ThemeImages: React.FC<ThemeImagesProps> = ({ themeId, themeName }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<Image | null>(null);

  useEffect(() => {
    fetchImages();
  }, [themeId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const imagesData = await ImageService.getImagesByThemeId(themeId);
      setImages(imagesData);
    } catch (err: any) {
      setError('Failed to fetch images');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (updatedImages: Image[]) => {
    setImages(updatedImages);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await ImageService.deleteImage(imageToDelete.imageId);
      setImages(images.filter(img => img.imageId !== imageToDelete.imageId));
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    } catch (err: any) {
      setError('Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // First, unset all other primary images for this theme
      const otherImages = images.filter(img => img.imageId !== imageId);
      for (const img of otherImages) {
        if (img.isPrimary) {
          await ImageService.updateImage(img.imageId, { ...img, isPrimary: false });
        }
      }

      // Set the selected image as primary
      const imageToUpdate = images.find(img => img.imageId === imageId);
      if (imageToUpdate) {
        await ImageService.updateImage(imageId, { ...imageToUpdate, isPrimary: true });
        setImages(images.map(img => ({
          ...img,
          isPrimary: img.imageId === imageId
        })));
      }
    } catch (err: any) {
      setError('Failed to set primary image');
      console.error('Error setting primary image:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Theme Images ({images.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Add Images
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {images.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No images uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add images to showcase your theme to potential clients.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Images
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image.imageId}>
              <Card>
                <Box position="relative">
                  <CardMedia
                    component="img"
                    height="200"
                    image={image.imageUrl}
                    alt={image.imageName}
                  />
                  <Box
                    position="absolute"
                    top={8}
                    right={8}
                    display="flex"
                    gap={1}
                  >
                    {image.isPrimary && (
                      <Chip
                        label="Primary"
                        color="primary"
                        size="small"
                        icon={<StarIcon />}
                      />
                    )}
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="body2" noWrap>
                    {image.imageName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(image.imageSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleSetPrimary(image.imageId)}
                      color={image.isPrimary ? 'primary' : 'default'}
                    >
                      {image.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setImageToDelete(image);
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Image Upload Dialog */}
      <ImageUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        themeId={themeId}
        themeName={themeName}
        onImagesChange={handleUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{imageToDelete?.imageName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteImage} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemeImages;
