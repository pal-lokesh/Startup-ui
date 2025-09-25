import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Inventory, InventoryImage } from '../types';
import InventoryService from '../services/inventoryService';
import ImageUpload from './ImageUpload';

interface InventoryImagesProps {
  open: boolean;
  onClose: () => void;
  inventory: Inventory | null;
}

const InventoryImages: React.FC<InventoryImagesProps> = ({ open, onClose, inventory }) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!inventory) return;
    
    try {
      setLoading(true);
      setError(null);
      const inventoryImages = await InventoryService.getInventoryImagesByInventoryId(inventory.inventoryId);
      setImages(inventoryImages);
    } catch (err: any) {
      setError('Failed to load images');
      console.error('Error fetching inventory images:', err);
    } finally {
      setLoading(false);
    }
  }, [inventory]);

  useEffect(() => {
    if (open && inventory) {
      fetchImages();
    }
  }, [open, inventory, fetchImages]);

  const handleSetPrimary = async (imageId: string) => {
    try {
      await InventoryService.setPrimaryInventoryImage(imageId);
      await fetchImages(); // Refresh the list
    } catch (err: any) {
      setError('Failed to set primary image');
      console.error('Error setting primary image:', err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await InventoryService.deleteInventoryImage(imageId);
      await fetchImages(); // Refresh the list
    } catch (err: any) {
      setError('Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const handleImageUploadSuccess = () => {
    fetchImages(); // Refresh the list after upload
  };

  if (!inventory) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            Images for {inventory.inventoryName}
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            variant="outlined"
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Image Upload Section */}
        <Box sx={{ mb: 3 }}>
          <ImageUpload
            themeId={inventory.inventoryId}
            themeName={inventory.inventoryName}
            onUploadSuccess={handleImageUploadSuccess}
            uploadType="inventory"
          />
        </Box>

        {/* Images Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={60} />
          </Box>
        ) : images.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No images uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload images using the form above
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image.imageId}>
                <Card>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={image.imageUrl}
                      alt={image.imageName}
                      sx={{ objectFit: 'cover' }}
                    />
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <Chip
                        label="Primary"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                        }}
                      />
                    )}
                    
                    {/* Action Buttons */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleSetPrimary(image.imageId)}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                      >
                        {image.isPrimary ? (
                          <StarIcon color="primary" />
                        ) : (
                          <StarBorderIcon />
                        )}
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(image.imageId)}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {image.imageName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(image.imageSize / 1024).toFixed(1)} KB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryImages;
