import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import { Theme, ThemeFormData, ImageFormData } from '../types';
import ThemeService from '../services/themeService';
import ImageService from '../services/imageService';

interface ThemeManagementFormProps {
  open: boolean;
  onClose: () => void;
  theme: Theme | null;
  businessId: string;
  onSuccess: (theme: Theme) => void;
}

const ThemeManagementForm: React.FC<ThemeManagementFormProps> = ({
  open,
  onClose,
  theme,
  businessId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ThemeFormData>({
    businessId: businessId,
    themeName: '',
    themeDescription: '',
    themeCategory: '',
    priceRange: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const themeCategories = [
    'Wedding',
    'Corporate',
    'Birthday',
    'Anniversary',
    'Graduation',
    'Holiday',
    'Photography',
    'Catering',
    'Decoration',
    'Entertainment',
    'Other'
  ];

  const priceRanges = [
    'Under $500',
    '$500 - $1,000',
    '$1,000 - $2,500',
    '$2,500 - $5,000',
    '$5,000 - $10,000',
    'Over $10,000',
    'Contact for Quote'
  ];

  useEffect(() => {
    if (theme) {
      setFormData({
        businessId: theme.businessId,
        themeName: theme.themeName,
        themeDescription: theme.themeDescription,
        themeCategory: theme.themeCategory,
        priceRange: theme.priceRange,
      });
    } else {
      setFormData({
        businessId: businessId,
        themeName: '',
        themeDescription: '',
        themeCategory: '',
        priceRange: '',
      });
    }
    setError(null);
  }, [theme, businessId, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.themeName || !formData.themeDescription || !formData.themeCategory || !formData.priceRange) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let updatedTheme: Theme;
      
      if (theme) {
        // Update existing theme
        updatedTheme = await ThemeService.updateTheme(theme.themeId, formData);
      } else {
        // Create new theme
        updatedTheme = await ThemeService.createTheme(formData);
        
        // Upload images if any were selected
        if (uploadedImages.length > 0) {
          setImageUploading(true);
          try {
            const uploadPromises = uploadedImages.map(async (file) => {
              const dataUrl = await convertToBase64(file);
              const imageData: ImageFormData = {
                themeId: updatedTheme.themeId,
                imageName: file.name,
                imageUrl: dataUrl,
                imagePath: `/uploads/${updatedTheme.themeId}/${file.name}`,
                imageSize: file.size,
                imageType: file.type,
              };
              return await ImageService.createImage(imageData);
            });
            
            await Promise.all(uploadPromises);
          } catch (imageErr) {
            console.error('Error uploading images:', imageErr);
            // Don't fail the entire operation if image upload fails
          } finally {
            setImageUploading(false);
          }
        }
      }

      onSuccess(updatedTheme);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save theme');
      console.error('Error saving theme:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUploadedImages([]);
    setImageUploading(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {theme ? 'Edit Theme' : 'Add New Theme'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="themeName"
                label="Theme Name"
                value={formData.themeName}
                onChange={handleInputChange}
                margin="normal"
                placeholder="e.g., Rustic Wedding, Modern Corporate"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="themeCategory"
                  value={formData.themeCategory}
                  onChange={handleSelectChange}
                  label="Category"
                >
                  {themeCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                name="themeDescription"
                label="Theme Description"
                value={formData.themeDescription}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Describe your theme, what's included, special features..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Price Range</InputLabel>
                <Select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleSelectChange}
                  label="Price Range"
                >
                  {priceRanges.map((range) => (
                    <MenuItem key={range} value={range}>
                      {range}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Image Upload Section - Only show for new themes */}
          {!theme && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Upload Images (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can add images now or upload them later from the theme management section.
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadedImages(files);
                  }}
                  style={{ display: 'none' }}
                  id="theme-image-upload"
                />
                <label htmlFor="theme-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Select Images ({uploadedImages.length} selected)
                  </Button>
                </label>
                
                {uploadedImages.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Selected Images:
                    </Typography>
                    {uploadedImages.map((file, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            setUploadedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || imageUploading}
          startIcon={(loading || imageUploading) ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : imageUploading ? 'Uploading Images...' : (theme ? 'Update Theme' : 'Add Theme')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeManagementForm;
