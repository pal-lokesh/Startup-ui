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
import { useAuth } from '../contexts/AuthContext';

interface InventoryImagesProps {
  open: boolean;
  onClose: () => void;
  inventory: Inventory | null;
}

const InventoryImages: React.FC<InventoryImagesProps> = ({ open, onClose, inventory }) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const isVendor = user && user.userType === 'VENDOR';

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
      await InventoryService.setPrimaryInventoryImage(imageId, user?.phoneNumber);
      await fetchImages(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to set primary image');
      console.error('Error setting primary image:', err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await InventoryService.deleteInventoryImage(imageId, user?.phoneNumber);
      await fetchImages(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
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

        {/* Image Upload Section - Only show for vendors */}
        {isVendor && (
          <Box sx={{ mb: 3 }}>
            <ImageUpload
              themeId={inventory.inventoryId}
              themeName={inventory.inventoryName}
              onUploadSuccess={handleImageUploadSuccess}
              uploadType="inventory"
            />
          </Box>
        )}

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
                  <Box sx={{ 
                    position: 'relative',
                    flexGrow: 1,
                    minHeight: '240px'
                  }}>
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
                    
                    {/* Action Buttons - Only show for vendors */}
                    {isVendor && (
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
                          title={image.isPrimary ? 'Primary Image' : 'Set as Primary'}
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
                          title="Delete Image"
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Box>
                    )}
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
