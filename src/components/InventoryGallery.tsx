import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Inventory, InventoryImage } from '../types';
import InventoryService from '../services/inventoryService';

interface InventoryGalleryProps {
  inventory: Inventory;
  open: boolean;
  onClose: () => void;
}

const InventoryGallery: React.FC<InventoryGalleryProps> = ({ inventory, open, onClose }) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<InventoryImage | null>(null);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, inventory.inventoryId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const imagesData = await InventoryService.getInventoryImagesByInventoryId(inventory.inventoryId);
      setImages(imagesData);
    } catch (err) {
      console.error('Error fetching inventory images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await InventoryService.setPrimaryInventoryImage(imageId);
      await fetchImages(); // Refresh images
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await InventoryService.deleteInventoryImage(imageId);
      await fetchImages(); // Refresh images
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">{inventory.inventoryName} - Image Gallery</Typography>
          <Box>
            <Button variant="contained" startIcon={<AddIcon />} size="small" sx={{ mr: 1 }}>
              Add Image
            </Button>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {inventory.inventoryDescription}
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Chip label={inventory.inventoryCategory} size="small" />
            <Chip label={`₹${inventory.price}`} size="small" color="primary" />
            <Chip label={`Qty: ${inventory.quantity}`} size="small" color="secondary" />
            <Chip 
              label={inventory.isActive ? 'Active' : 'Inactive'} 
              size="small" 
              color={inventory.isActive ? 'success' : 'error'} 
            />
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading images...</Typography>
          </Box>
        ) : images.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No images found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add images to showcase this inventory item
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.imageId}>
                <Card sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={image.imageUrl}
                    alt={image.imageName}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedImage(image)}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" noWrap>
                        {image.imageName}
                      </Typography>
                      <Box>
                        <Tooltip title={image.isPrimary ? 'Primary Image' : 'Set as Primary'}>
                          <IconButton
                            size="small"
                            onClick={() => handleSetPrimary(image.imageId)}
                            color={image.isPrimary ? 'primary' : 'default'}
                          >
                            {image.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Image">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteImage(image.imageId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    {image.isPrimary && (
                      <Chip
                        icon={<StarIcon />}
                        label="Primary"
                        size="small"
                        color="primary"
                        sx={{ position: 'absolute', top: 8, left: 8 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Image Preview Dialog */}
        {selectedImage && (
          <Dialog 
            open={!!selectedImage} 
            onClose={() => setSelectedImage(null)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedImage.imageName}</Typography>
                <IconButton onClick={() => setSelectedImage(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box textAlign="center">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.imageName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Size: {(selectedImage.imageSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {selectedImage.imageType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InventoryGallery;
