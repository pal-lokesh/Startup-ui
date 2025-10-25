import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  FlashOn as BuyNowIcon,
} from '@mui/icons-material';
import { Plate, Business } from '../types';
import PlateService from '../services/plateService';
import ImageCarousel from './ImageCarousel';
import { useCart } from '../contexts/CartContext';

interface PlateCardProps {
  plate: Plate;
  business?: Business;
  onEdit: (plate: Plate) => void;
  onDelete: (plateId: string) => void;
  onUpdate: (plate: Plate) => void;
  onBuyNow?: (plate: Plate, business: Business) => void;
  showCartButton?: boolean;
  showBuyNowButton?: boolean;
}

const PlateCard: React.FC<PlateCardProps> = ({
  plate,
  business,
  onEdit,
  onDelete,
  onUpdate,
  onBuyNow,
  showCartButton = true,
  showBuyNowButton = true,
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState(plate.price.toString());
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, isInCart } = useCart();

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setEditPrice(plate.price.toString());
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setEditPrice(plate.price.toString());
  };

  const handlePriceSave = async () => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setPriceUpdateLoading(true);
      setError(null);
      
      const updatedPlate = await PlateService.updatePlate(plate.plateId, {
        businessId: plate.businessId,
        dishName: plate.dishName,
        dishDescription: plate.dishDescription,
        plateImage: plate.plateImage,
        price: newPrice,
        dishType: plate.dishType || 'veg',
      });
      
      onUpdate(updatedPlate);
      setIsEditingPrice(false);
    } catch (err: any) {
      setError('Failed to update price');
      console.error('Error updating plate price:', err);
    } finally {
      setPriceUpdateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await PlateService.deletePlate(plate.plateId);
      onDelete(plate.plateId);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError('Failed to delete plate');
      console.error('Error deleting plate:', err);
    }
  };

  return (
    <>
      <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {plate.plateImage && (
          <ImageCarousel
            images={[{
              imageId: plate.plateId,
              imageUrl: plate.plateImage,
              imageName: plate.dishName
            }]}
            height={200}
            showNavigation={false}
            showDots={false}
          />
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {plate.dishName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={(plate.dishType || 'veg') === 'veg' ? 'Veg' : 'Non-Veg'} 
                color={(plate.dishType || 'veg') === 'veg' ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={plate.isActive ? 'Active' : 'Inactive'} 
                color={plate.isActive ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {plate.dishDescription}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            {isEditingPrice ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                <TextField
                  size="small"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: 100 }}
                />
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handlePriceSave}
                  disabled={priceUpdateLoading}
                >
                  <SaveIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handlePriceCancel}
                  disabled={priceUpdateLoading}
                >
                  <CancelIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  ₹{plate.price.toFixed(2)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handlePriceEdit}
                  title="Edit Price"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            
            {/* Cart and Buy Now Buttons */}
            {business && (showCartButton || showBuyNowButton) && (
              <Box sx={{ mb: 2 }}>
                <Box display="flex" gap={1} mb={1}>
                  {showCartButton && (
                    <Button
                      variant={isInCart(plate.plateId, 'plate') ? "contained" : "outlined"}
                      color={isInCart(plate.plateId, 'plate') ? "success" : "primary"}
                      size="small"
                      startIcon={<CartIcon />}
                      onClick={() => addToCart(plate, business)}
                      fullWidth
                    >
                      {isInCart(plate.plateId, 'plate') ? "In Cart" : "Add to Cart"}
                    </Button>
                  )}
                  {showBuyNowButton && (
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      startIcon={<BuyNowIcon />}
                      onClick={() => onBuyNow && onBuyNow(plate, business)}
                      fullWidth
                    >
                      Buy Now
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            {/* Admin Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit(plate)}
                title="Edit Plate"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete Plate"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Plate</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{plate.dishName}"? This action cannot be undone.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlateCard;
