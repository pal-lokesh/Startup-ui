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
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Plate, PlateFormData } from '../types';
import PlateService from '../services/plateService';
import { useAuth } from '../contexts/AuthContext';

interface PlateManagementFormProps {
  open: boolean;
  onClose: () => void;
  plate: Plate | null;
  businessId: string;
  onSuccess: (plate: Plate) => void;
}

const PlateManagementForm: React.FC<PlateManagementFormProps> = ({
  open,
  onClose,
  plate,
  businessId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PlateFormData>({
    businessId: businessId,
    dishName: '',
    dishDescription: '',
    plateImage: '',
    price: 0,
    dishType: 'veg',
  });
  const [priceInput, setPriceInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      if (plate) {
        setFormData({
          businessId: plate.businessId,
          dishName: plate.dishName,
          dishDescription: plate.dishDescription,
          plateImage: plate.plateImage,
          price: plate.price,
          dishType: plate.dishType || 'veg', // Default to 'veg' if undefined
        });
        setPriceInput(plate.price.toString());
      } else {
        setFormData({
          businessId: businessId,
          dishName: '',
          dishDescription: '',
          plateImage: '',
          price: 0,
          dishType: 'veg',
        });
        setPriceInput('');
      }
      setUploadedImage(null);
      setImageUploading(false);
      setError(null);
    }
  }, [plate, businessId, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value);
    
    // Update formData with parsed price
    const numericPrice = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      price: numericPrice,
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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dishName || !formData.dishDescription || formData.price <= 0 || !formData.dishType) {
      setError('Please fill in all required fields including dish type and ensure price is greater than 0');
      return;
    }

    // Check if image is uploaded for new plates
    if (!plate && !uploadedImage) {
      setError('Please upload an image for the plate');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let updatedPlate: Plate;
      
      if (plate) {
        // Update existing plate - pass vendor phone for authorization
        if (uploadedImage) {
          setImageUploading(true);
          try {
            const dataUrl = await convertToBase64(uploadedImage);
            updatedPlate = await PlateService.updatePlate(plate.plateId, {
              ...formData,
              plateImage: dataUrl,
            }, user?.phoneNumber);
          } catch (imageErr) {
            console.error('Error uploading image:', imageErr);
            // Fall back to updating without image change
            updatedPlate = await PlateService.updatePlate(plate.plateId, formData, user?.phoneNumber);
          } finally {
            setImageUploading(false);
          }
        } else {
          // Update without changing image - keep existing image
          updatedPlate = await PlateService.updatePlate(plate.plateId, {
            ...formData,
            plateImage: formData.plateImage, // Preserve existing image
          }, user?.phoneNumber);
        }
      } else {
        // Create new plate - pass vendor phone for authorization
        updatedPlate = await PlateService.createPlate(formData, user?.phoneNumber);
        
        // Upload image if one was selected
        if (uploadedImage) {
          setImageUploading(true);
          try {
            const dataUrl = await convertToBase64(uploadedImage);
            const updatedPlateWithImage = await PlateService.updatePlate(updatedPlate.plateId, {
              ...formData,
              plateImage: dataUrl,
            });
            updatedPlate = updatedPlateWithImage;
          } catch (imageErr) {
            console.error('Error uploading image:', imageErr);
            // Don't fail the entire operation if image upload fails
          } finally {
            setImageUploading(false);
          }
        }
      }

      onSuccess(updatedPlate);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save plate');
      console.error('Error saving plate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUploadedImage(null);
    setImageUploading(false);
    setPriceInput('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {plate ? 'Edit Plate' : 'Add New Plate'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="dishName"
                label="Dish Name"
                value={formData.dishName}
                onChange={handleInputChange}
                margin="normal"
                placeholder="e.g., Biryani, Pulao, Curry"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                name="dishDescription"
                label="Dish Description"
                value={formData.dishDescription}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Describe the dish, ingredients, taste, etc."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                name="price"
                label="Price (₹)"
                value={priceInput}
                onChange={handlePriceInputChange}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="Enter price"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Dish Type</InputLabel>
                <Select
                  name="dishType"
                  value={formData.dishType}
                  onChange={handleSelectChange}
                  label="Dish Type"
                >
                  <MenuItem value="veg">Vegetarian</MenuItem>
                  <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Image Upload Section */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            {plate ? 'Update Plate Image' : 'Upload Plate Image'} {!plate && <span style={{ color: 'red' }}>*</span>}
          </Typography>
          {plate && formData.plateImage && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Image:
              </Typography>
              <Box
                component="img"
                src={formData.plateImage}
                alt="Current plate"
                sx={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 2
                }}
              />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {plate ? 'Select a new image to update, or leave empty to keep the current image.' : 'An image is required for the plate.'}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setUploadedImage(file);
              }}
              style={{ display: 'none' }}
              id="plate-image-upload"
            />
            <label htmlFor="plate-image-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploadedImage ? `Selected: ${uploadedImage.name}` : (plate ? 'Change Plate Image' : 'Select Plate Image')}
              </Button>
            </label>
            
            {uploadedImage && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  New Image: {uploadedImage.name} ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setUploadedImage(null)}
                >
                  Remove Image
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading || imageUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || imageUploading}
          startIcon={(loading || imageUploading) ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : imageUploading ? 'Uploading Image...' : (plate ? 'Update Plate' : 'Add Plate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlateManagementForm;
