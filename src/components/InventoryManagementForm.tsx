import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import { Inventory, InventoryFormData, InventoryImageFormData } from '../types';
import InventoryService from '../services/inventoryService';

interface InventoryManagementFormProps {
  open: boolean;
  onClose: () => void;
  inventory: Inventory | null;
  businessId: string;
  onSuccess: () => void;
}

const InventoryManagementForm: React.FC<InventoryManagementFormProps> = ({
  open,
  onClose,
  inventory,
  businessId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<InventoryFormData>({
    businessId: businessId,
    inventoryName: '',
    inventoryDescription: '',
    inventoryCategory: '',
    price: 0,
    quantity: 0,
  });
  const [priceInput, setPriceInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [showCustomCategory, setShowCustomCategory] = useState<boolean>(false);

  const inventoryCategories = [
    'chair',
    'table',
    'plates',
    'decoration',
    'lighting',
    'sound',
    'catering',
    'Other'
  ];

  useEffect(() => {
    if (inventory) {
      setFormData({
        businessId: inventory.businessId,
        inventoryName: inventory.inventoryName,
        inventoryDescription: inventory.inventoryDescription,
        inventoryCategory: inventory.inventoryCategory,
        price: inventory.price,
        quantity: inventory.quantity,
      });
      setPriceInput(inventory.price.toString());
      setQuantityInput(inventory.quantity.toString());
      
      // Check if the category is custom (not in predefined list)
      if (!inventoryCategories.includes(inventory.inventoryCategory)) {
        setCustomCategory(inventory.inventoryCategory);
        setShowCustomCategory(true);
      } else {
        setCustomCategory('');
        setShowCustomCategory(false);
      }
    } else {
      setFormData({
        businessId: businessId,
        inventoryName: '',
        inventoryDescription: '',
        inventoryCategory: '',
        price: 0,
        quantity: 0,
      });
      setPriceInput('');
      setQuantityInput('');
      setCustomCategory('');
      setShowCustomCategory(false);
    }
  }, [inventory, businessId, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      setPriceInput(value);
      setFormData(prev => ({
        ...prev,
        price: parseFloat(value) || 0,
      }));
    } else if (name === 'quantity') {
      setQuantityInput(value);
      setFormData(prev => ({
        ...prev,
        quantity: parseInt(value) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    
    if (name === 'inventoryCategory') {
      if (value === 'Other') {
        setShowCustomCategory(true);
        setFormData(prev => ({
          ...prev,
          [name]: '', // Clear the category until custom is entered
        }));
      } else {
        setShowCustomCategory(false);
        setCustomCategory('');
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData(prev => ({
      ...prev,
      inventoryCategory: value,
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
    
    if (!formData.inventoryName || !formData.inventoryDescription || !formData.inventoryCategory) {
      setError('Please fill in all required fields');
      return;
    }

    if (showCustomCategory && !customCategory.trim()) {
      setError('Please enter a custom category');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (formData.quantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (inventory) {
        // Update existing inventory
        await InventoryService.updateInventory(inventory.inventoryId, formData);
      } else {
        // Create new inventory
        const newInventory = await InventoryService.createInventory(formData);
        
        // Upload images if any were selected
        if (uploadedImages.length > 0) {
          setImageUploading(true);
          try {
            const uploadPromises = uploadedImages.map(async (file) => {
              const dataUrl = await convertToBase64(file);
              const imageData: InventoryImageFormData = {
                inventoryId: newInventory.inventoryId,
                imageName: file.name,
                imageUrl: dataUrl,
                imagePath: `/uploads/inventory/${newInventory.inventoryId}/${file.name}`,
                imageSize: file.size,
                imageType: file.type,
              };
              return await InventoryService.createInventoryImage(imageData);
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

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      businessId: businessId,
      inventoryName: '',
      inventoryDescription: '',
      inventoryCategory: '',
      price: 0,
      quantity: 0,
    });
    setPriceInput('');
    setQuantityInput('');
    setUploadedImages([]);
    setImageUploading(false);
    setCustomCategory('');
    setShowCustomCategory(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {inventory ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="inventoryName"
                label="Inventory Name"
                value={formData.inventoryName}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="e.g., Wooden Dining Chair"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="inventoryDescription"
                label="Description"
                value={formData.inventoryDescription}
                onChange={handleInputChange}
                margin="normal"
                required
                multiline
                rows={3}
                placeholder="Describe the inventory item..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="inventoryCategory"
                  value={showCustomCategory ? 'Other' : formData.inventoryCategory}
                  onChange={handleSelectChange}
                  label="Category"
                >
                  {inventoryCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Category Input - Show when "Other" is selected */}
            {showCustomCategory && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="customCategory"
                  label="Custom Category"
                  value={customCategory}
                  onChange={handleCustomCategoryChange}
                  margin="normal"
                  required
                  placeholder="Enter your custom category"
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="price"
                label="Price (₹)"
                type="number"
                value={priceInput}
                onChange={handleInputChange}
                margin="normal"
                required
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="Enter price"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="quantity"
                label="Quantity Available"
                type="number"
                value={quantityInput}
                onChange={handleInputChange}
                margin="normal"
                required
                inputProps={{ min: 0 }}
                placeholder="Enter quantity"
              />
            </Grid>
          </Grid>

          {/* Image Upload Section - Only show for new inventory items */}
          {!inventory && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Upload Images (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can add images now or upload them later from the inventory management section.
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
                  id="inventory-image-upload"
                />
                <label htmlFor="inventory-image-upload">
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
          {loading ? 'Saving...' : imageUploading ? 'Uploading Images...' : (inventory ? 'Update Inventory' : 'Create Inventory')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryManagementForm;
