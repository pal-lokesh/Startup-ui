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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Dish, DishFormData } from '../types';
import dishService from '../services/dishService';
import { useAuth } from '../contexts/AuthContext';

interface DishManagementFormProps {
  open: boolean;
  onClose: () => void;
  dish: Dish | null;
  businessId: string;
  onSuccess: (dish: Dish) => void;
}

const DishManagementForm: React.FC<DishManagementFormProps> = ({
  open,
  onClose,
  dish,
  businessId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<DishFormData>({
    businessId: businessId,
    dishName: '',
    dishDescription: '',
    dishImage: '',
    price: 0,
    quantity: 0,
    isAvailable: true,
    availabilityDates: [],
  });
  const [priceInput, setPriceInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      if (dish) {
        setFormData({
          businessId: dish.businessId,
          dishName: dish.dishName,
          dishDescription: dish.dishDescription,
          dishImage: dish.dishImage,
          price: dish.price,
          quantity: dish.quantity || 0,
          isAvailable: dish.isAvailable,
          availabilityDates: dish.availabilityDates || [],
        });
        setPriceInput(dish.price.toString());
        setQuantityInput((dish.quantity || 0).toString());
      } else {
        setFormData({
          businessId: businessId,
          dishName: '',
          dishDescription: '',
          dishImage: '',
          price: 0,
          quantity: 0,
          isAvailable: true,
          availabilityDates: [],
        });
        setPriceInput('');
        setQuantityInput('');
      }
      setUploadedImage(null);
      setImageUploading(false);
      setError(null);
    }
  }, [dish, businessId, open]);

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

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantityInput(value);
    
    // Update formData with parsed quantity
    const numericQuantity = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      quantity: numericQuantity,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
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
    
    if (!formData.dishName || !formData.dishDescription || formData.price <= 0) {
      setError('Please fill in all required fields and ensure price is greater than 0');
      return;
    }

    // Note: Image is not required on creation - can be added via update
    // if (!dish && !uploadedImage) {
    //   setError('Please upload an image for the dish');
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);

      let updatedDish: Dish;
      
      if (dish) {
        // Update existing dish - pass vendor phone for authorization
        if (uploadedImage) {
          setImageUploading(true);
          try {
            const dataUrl = await convertToBase64(uploadedImage);
            updatedDish = await dishService.updateDish(dish.dishId, {
              ...formData,
              dishImage: dataUrl,
            }, user?.phoneNumber);
          } catch (imageErr) {
            console.error('Error uploading image:', imageErr);
            // Fall back to updating without image change
            updatedDish = await dishService.updateDish(dish.dishId, formData, user?.phoneNumber);
          } finally {
            setImageUploading(false);
          }
        } else {
          // Update without changing image - keep existing image
          updatedDish = await dishService.updateDish(dish.dishId, {
            ...formData,
            dishImage: formData.dishImage, // Preserve existing image
          }, user?.phoneNumber);
        }
      } else {
        // Create new dish - pass vendor phone for authorization
        updatedDish = await dishService.createDish(formData, user?.phoneNumber);
        
        // Upload image if one was selected
        if (uploadedImage) {
          setImageUploading(true);
          try {
            const dataUrl = await convertToBase64(uploadedImage);
            const updatedDishWithImage = await dishService.updateDish(updatedDish.dishId, {
              ...formData,
              dishImage: dataUrl,
            });
            updatedDish = updatedDishWithImage;
          } catch (imageErr) {
            console.error('Error uploading image:', imageErr);
            // Don't fail the entire operation if image upload fails
          } finally {
            setImageUploading(false);
          }
        }
      }

      onSuccess(updatedDish);
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.message || 'Failed to save dish';
      setError(errorMessage);
      console.error('Error saving dish:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUploadedImage(null);
    setImageUploading(false);
    setPriceInput('');
    setQuantityInput('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {dish ? 'Edit Dish' : 'Add New Dish'}
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
              <TextField
                fullWidth
                type="number"
                name="quantity"
                label="Quantity (Stock)"
                value={quantityInput}
                onChange={handleQuantityInputChange}
                margin="normal"
                inputProps={{ min: 0, step: 1 }}
                placeholder="Enter available quantity"
                helperText="Number of dishes available in stock"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={handleSwitchChange}
                    name="isAvailable"
                    color="primary"
                  />
                }
                label="Available"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Toggle availability status for this dish
              </Typography>
            </Grid>
          </Grid>

          {/* Image Upload Section */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            {dish ? 'Update Dish Image' : 'Upload Dish Image'} {!dish && <span style={{ color: 'red' }}>*</span>}
          </Typography>
          {dish && formData.dishImage && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Image:
              </Typography>
              <Box
                component="img"
                src={formData.dishImage}
                alt="Current dish"
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
            {dish ? 'Select a new image to update, or leave empty to keep the current image.' : 'An image is required for the dish.'}
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
              id="dish-image-upload"
            />
            <label htmlFor="dish-image-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ mb: 2 }}
              >
                {uploadedImage ? `Selected: ${uploadedImage.name}` : (dish ? 'Change Dish Image' : 'Select Dish Image')}
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
          {loading ? 'Saving...' : imageUploading ? 'Uploading Image...' : (dish ? 'Update Dish' : 'Add Dish')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DishManagementForm;

