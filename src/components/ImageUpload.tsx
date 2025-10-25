import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Image, InventoryImage } from '../types';
import ImageService from '../services/imageService';
import InventoryService from '../services/inventoryService';

interface ImageUploadProps {
  open?: boolean;
  onClose?: () => void;
  themeId: string; // This is used for both theme and inventory IDs
  themeName?: string;
  onImagesChange?: (images: Image[]) => void;
  onUploadSuccess?: () => void;
  uploadType?: 'theme' | 'inventory';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  open = true,
  onClose,
  themeId,
  themeName = 'Item',
  onImagesChange,
  onUploadSuccess,
  uploadType = 'theme',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit (base64 increases size by ~33%)
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Only image files under 5MB are allowed.');
    } else {
      setError(null);
    }

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadType === 'inventory' ? 'inventory' : 'themes');
        formData.append('itemId', themeId);

        // Upload file to backend
        const uploadResponse = await fetch('http://localhost:8080/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }

        const uploadResult = await uploadResponse.json();
        
        if (uploadType === 'inventory') {
          const imageData = {
            inventoryId: themeId,
            imageName: file.name,
            imageUrl: `http://localhost:8080${uploadResult.filePath}`,
            imagePath: uploadResult.filePath,
            imageSize: file.size,
            imageType: file.type,
          };

          console.log('Preparing to save inventory image:', imageData);
          return await InventoryService.createInventoryImage(imageData);
        } else {
          const imageData = {
            themeId,
            imageName: file.name,
            imageUrl: `http://localhost:8080${uploadResult.filePath}`,
            imagePath: uploadResult.filePath,
            imageSize: file.size,
            imageType: file.type,
          };

          return await ImageService.createImage(imageData);
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      // Get updated images list
      if (uploadType === 'inventory') {
        // For inventory images, we don't need to update the parent's image list
        // The parent component will handle refreshing
      } else {
        const updatedImages = await ImageService.getImagesByThemeId(themeId);
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      }
      
      // Reset form
      setSelectedFiles([]);
      setPreviewUrls([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Call success callback first
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Close dialog if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response) {
        // Server responded with error status
        setError(`Upload failed: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        // Request was made but no response received
        setError('Upload failed: No response from server. Please check your connection.');
      } else {
        // Something else happened
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  // If onClose is not provided, render as a simple form (not a dialog)
  if (!onClose) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Upload Images for "{themeName}"
        </Typography>
        
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ mb: 2 }}
            >
              Select Images
            </Button>
            
            <Typography variant="body2" color="text.secondary" align="center">
              Select multiple images (JPG, PNG, GIF). Max 5MB per file.
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selected Images ({selectedFiles.length})
              </Typography>
              
              <Grid container spacing={2}>
                {selectedFiles.map((file, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={previewUrls[index]}
                        alt={file.name}
                      />
                      <CardContent>
                        <Typography variant="body2" noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFile(index)}
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
            </Box>
          )}

          {selectedFiles.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={handleUpload}
                variant="contained"
                disabled={selectedFiles.length === 0 || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                size="large"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Dialog version (when onClose is provided)
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload Images for "{themeName}"
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
            sx={{ mb: 2 }}
          >
            Select Images
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Select multiple images (JPG, PNG, GIF). Max 5MB per file.
          </Typography>
        </Box>

        {selectedFiles.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selected Images ({selectedFiles.length})
            </Typography>
            
            <Grid container spacing={2}>
              {selectedFiles.map((file, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={previewUrls[index]}
                      alt={file.name}
                    />
                    <CardContent>
                      <Typography variant="body2" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFile(index)}
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
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={selectedFiles.length === 0 || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageUpload;
