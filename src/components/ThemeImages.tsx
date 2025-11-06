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
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  
  const isVendor = user && user.userType === 'VENDOR';

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
      await ImageService.deleteImage(imageToDelete.imageId, user?.phoneNumber);
      setImages(images.filter(img => img.imageId !== imageToDelete.imageId));
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Use the dedicated setPrimaryImage endpoint which handles the logic
      await ImageService.setPrimaryImage(imageId, user?.phoneNumber);
      // Refresh images list
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Failed to set primary image');
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
        {/* Only show add images button for vendors */}
        {isVendor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Add Images
          </Button>
        )}
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
              {isVendor ? 'Add images to showcase your theme to potential clients.' : 'No images available for this theme.'}
            </Typography>
            {isVendor && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Images
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ padding: { xs: 1, sm: 2 } }}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.imageId}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 'clamp(8px, 1vw, 12px)',
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}>
                <Box position="relative" sx={{ flexGrow: 1 }}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={image.imageUrl}
                    alt={image.imageName}
                    sx={{ 
                      objectFit: 'cover',
                      width: '100%',
                      height: '240px',
                    }}
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
                <CardContent sx={{ 
                  padding: { xs: 'clamp(8px, 1.5vw, 12px)', sm: 'clamp(12px, 2vw, 16px)' },
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" noWrap sx={{ mb: 0.5, fontWeight: 500 }}>
                    {image.imageName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    {(image.imageSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  {/* Only show edit buttons for vendors */}
                  {isVendor && (
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      mt="auto"
                      pt={1}
                      sx={{
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleSetPrimary(image.imageId)}
                        color={image.isPrimary ? 'primary' : 'default'}
                        title={image.isPrimary ? 'Primary Image' : 'Set as Primary'}
                        sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
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
                        title="Delete Image"
                        sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
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
