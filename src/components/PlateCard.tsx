import React, { useState, useEffect } from 'react';
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
import RatingDisplay from './RatingDisplay';
import RatingComponent from './RatingComponent';
import { Rating } from '../types/rating';
import { useAuth } from '../contexts/AuthContext';
import stockNotificationService from '../services/stockNotificationService';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Snackbar } from '@mui/material';

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
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | undefined>(undefined);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const { addToCart, isInCart, removeFromCart, openCart } = useCart();
  const { user } = useAuth();
  
  const isOutOfStock = (plate.quantity ?? 0) <= 0;

  const handleCartToggle = () => {
    if (business) {
      if (isInCart(plate.plateId, 'plate')) {
        removeFromCart(plate.plateId, 'plate');
      } else {
        addToCart(plate, business);
      }
    }
  };

  const handleBuyNow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (business && !isOutOfStock) {
      // Check if item is already in cart
      const itemInCart = isInCart(plate.plateId, 'plate');
      
      // If not in cart, add it
      if (!itemInCart) {
        addToCart(plate, business);
      }
      
      // Open cart drawer
      openCart();
      
      // Call parent's onBuyNow if provided
      if (onBuyNow) {
        onBuyNow(plate, business);
      }
    }
  };

  // Check subscription status on mount
  useEffect(() => {
    if (user && isOutOfStock) {
      stockNotificationService.isSubscribed(user.phoneNumber, plate.plateId, 'PLATE')
        .then(setIsSubscribed)
        .catch(() => setIsSubscribed(false));
    }
  }, [user, plate.plateId, isOutOfStock]);

  const handleNotifyMe = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user || !business) return;
    
    try {
      setSubscribing(true);
      await stockNotificationService.subscribe(
        user.phoneNumber,
        plate.plateId,
        'PLATE',
        plate.dishName,
        business.businessId
      );
      setIsSubscribed(true);
      setSnackbar({ open: true, message: 'You will be notified when this item is back in stock!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to subscribe to notifications', severity: 'error' });
    } finally {
      setSubscribing(false);
    }
  };

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
      await PlateService.deletePlate(plate.plateId, user?.phoneNumber);
      onDelete(plate.plateId);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete plate');
      console.error('Error deleting plate:', err);
    }
  };

  const handleRateClick = () => {
    setRatingDialogOpen(true);
  };

  const handleRatingSubmitted = (rating: Rating) => {
    setExistingRating(rating);
    setRatingDialogOpen(false);
  };

  const handleRatingDialogClose = () => {
    setRatingDialogOpen(false);
  };

  return (
    <>
      <Card sx={{ 
        maxWidth: { xs: '100%', sm: 345 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%'
      }}>
        {plate.plateImage && (
          <Box sx={{ 
            height: { xs: 'clamp(200px, 40vh, 280px)', sm: 'clamp(250px, 35vh, 320px)', md: 'clamp(280px, 35vh, 350px)' },
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            '& > div': {
              height: '100% !important',
              width: '100% !important'
            },
            '& img': {
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }
          }}>
            <ImageCarousel
              images={[{
                imageId: plate.plateId,
                imageUrl: plate.plateImage,
                imageName: plate.dishName
              }]}
              height={400}
              showNavigation={false}
              showDots={false}
            />
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chips Section - Veg/Non-Veg, Active/Inactive, and Out of Stock */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-start',
              alignItems: 'center',
              mb: 1,
              gap: { xs: 0.5, sm: 1 },
              flexWrap: 'wrap'
            }}
          >
            <Chip 
              label={(plate.dishType || 'veg') === 'veg' ? 'Veg' : 'Non-Veg'} 
              color={(plate.dishType || 'veg') === 'veg' ? 'success' : 'error'}
              size="small"
              variant="outlined"
              sx={{
                fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
                height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
              }}
            />
            {isOutOfStock ? (
              <Chip 
                label="Out of Stock" 
                color="error"
                size="small"
                sx={{
                  fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
                  height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
                }}
              />
            ) : (
              <Chip 
                label={plate.isActive ? 'Active' : 'Inactive'} 
                color={plate.isActive ? 'success' : 'default'}
                size="small"
                sx={{
                  fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
                  height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
                }}
              />
            )}
          </Box>
          
          {/* Dish Name - Below the chips */}
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              fontSize: { xs: 'clamp(1rem, 2vw, 1.125rem)', sm: 'clamp(1.125rem, 2vw, 1.25rem)' },
              lineHeight: { xs: 'clamp(1.25rem, 2.5vw, 1.5rem)', sm: 'clamp(1.375rem, 2.5vw, 1.625rem)' }
            }}
          >
            {plate.dishName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {plate.dishDescription}
          </Typography>
          
          {/* Price Section */}
          <Box sx={{ mb: 2 }}>
            {isEditingPrice ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ 
                    width: { xs: 'clamp(80px, 20vw, 120px)', sm: 120 },
                    flexGrow: 1,
                    '& .MuiInputBase-input': {
                      fontSize: { xs: 'clamp(0.875rem, 1.5vw, 1rem)', sm: '1rem' }
                    }
                  }}
                />
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handlePriceSave}
                  disabled={priceUpdateLoading}
                  sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
                >
                  <SaveIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handlePriceCancel}
                  disabled={priceUpdateLoading}
                  sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
                >
                  <CancelIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: 'clamp(1rem, 2vw, 1.25rem)', sm: 'clamp(1.125rem, 2vw, 1.5rem)' }
                  }}
                >
                  ₹{plate.price.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Box>
            
          {/* Rating Display */}
          {business && (
            <Box 
              mt={1} 
              mb={2}
              sx={{
                '& .MuiRating-root': {
                  fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' }
                },
                '& .MuiTypography-root': {
                  fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' }
                },
                '& .MuiButton-root': {
                  fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' },
                  padding: { xs: 'clamp(2px, 0.5vw, 4px) clamp(6px, 1vw, 8px)', sm: '4px 8px' },
                  minHeight: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
                },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' }
                }
              }}
            >
              <RatingDisplay
                itemId={plate.plateId}
                itemType="PLATE"
                businessId={business.businessId}
                onRateClick={handleRateClick}
                showRateButton={true}
                compact={true}
              />
            </Box>
          )}
          
          {/* Out of Stock - Notify Me Button */}
          {isOutOfStock && user && user.userType === 'CLIENT' && (
            <Button
              variant={isSubscribed ? "contained" : "outlined"}
              color={isSubscribed ? "success" : "primary"}
              size="small"
              startIcon={<NotificationsIcon sx={{ fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' } }} />}
              onClick={handleNotifyMe}
              disabled={subscribing || isSubscribed}
              fullWidth
              sx={{
                fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' },
                padding: { xs: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)', sm: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)' },
                minHeight: { xs: 'clamp(32px, 4vh, 36px)', sm: 'clamp(36px, 5vh, 40px)' },
                mb: 2
              }}
            >
              {subscribing ? 'Subscribing...' : isSubscribed ? 'Notification Set' : 'Notify Me When Available'}
            </Button>
          )}
          
          {/* Cart and Buy Now Buttons - Only show when in stock */}
          {business && !isOutOfStock && (showCartButton || showBuyNowButton) && (
            <Box sx={{ mb: 2 }}>
              <Box 
                display="flex" 
                gap={{ xs: 0.5, sm: 1 }} 
                flexDirection={{ xs: 'column', sm: 'row' }}
                sx={{ width: '100%' }}
              >
                {showCartButton && (
                  <Button
                    variant={isInCart(plate.plateId, 'plate') ? "contained" : "outlined"}
                    color={isInCart(plate.plateId, 'plate') ? "success" : "primary"}
                    size="small"
                    startIcon={<CartIcon sx={{ fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' } }} />}
                    onClick={handleCartToggle}
                    fullWidth
                    sx={{
                      fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' },
                      padding: { xs: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)', sm: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)' },
                      minHeight: { xs: 'clamp(32px, 4vh, 36px)', sm: 'clamp(36px, 5vh, 40px)' },
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {isInCart(plate.plateId, 'plate') ? "In Cart" : "Add to Cart"}
                  </Button>
                )}
                {showBuyNowButton && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    startIcon={<BuyNowIcon sx={{ fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' } }} />}
                    onClick={handleBuyNow}
                    fullWidth
                    sx={{
                      fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' },
                      padding: { xs: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)', sm: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)' },
                      minHeight: { xs: 'clamp(32px, 4vh, 36px)', sm: 'clamp(36px, 5vh, 40px)' },
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    Buy Now
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Admin Action Buttons - Only show for vendors */}
          {user && user.userType === 'VENDOR' && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(plate);
                }}
                title="Edit Plate"
                sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
              >
                <EditIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
                title="Delete Plate"
                sx={{ padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 } }}
              >
                <DeleteIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
              </IconButton>
            </Box>
          )}
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

      {/* Rating Dialog */}
      {business && (
        <RatingComponent
          open={ratingDialogOpen}
          onClose={handleRatingDialogClose}
          itemId={plate.plateId}
          itemType="PLATE"
          itemName={plate.dishName}
          businessId={business.businessId}
          existingRating={existingRating}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PlateCard;
