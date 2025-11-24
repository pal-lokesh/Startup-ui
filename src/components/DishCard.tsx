import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
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
  ShoppingCart as CartIcon,
  FlashOn as BuyNowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Dish, Business } from '../types';
import dishService from '../services/dishService';
import ImageCarousel from './ImageCarousel';
import { useCart } from '../contexts/CartContext';
import RatingDisplay from './RatingDisplay';
import RatingComponent from './RatingComponent';
import { Rating } from '../types/rating';
import { useAuth } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import DatePickerDialog from './DatePickerDialog';
import StarIcon from '@mui/icons-material/Star';

interface DishCardProps {
  dish: Dish;
  business?: Business;
  onEdit: (dish: Dish) => void;
  onDelete: (dishId: string) => void;
  onUpdate: (dish: Dish) => void;
  onBuyNow?: (dish: Dish, business: Business) => void;
  showCartButton?: boolean;
  showBuyNowButton?: boolean;
}

const DishCard: React.FC<DishCardProps> = ({
  dish,
  business,
  onEdit,
  onDelete,
  onUpdate,
  onBuyNow,
  showCartButton = true,
  showBuyNowButton = true,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<'add' | 'buyNow' | null>(null);
  const { addToCart, isInCart, removeFromCart, openCart } = useCart();
  const { user } = useAuth();
  
  const isUnavailable = !dish.isAvailable;

  const handleCartToggle = () => {
    if (business) {
      if (isInCart(dish.dishId, 'dish')) {
        removeFromCart(dish.dishId, 'dish');
      } else {
        // Open date picker first
        setPendingCartAction('add');
        setDatePickerOpen(true);
      }
    }
  };

  const handleBuyNow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (business) {
      // Always open date picker first - let client choose date
      setPendingCartAction('buyNow');
      setDatePickerOpen(true);
    }
  };

  const handleDateConfirm = (date: string | undefined) => {
    if (business && pendingCartAction) {
      // Add to cart with selected date
      addToCart(dish, business, date);
      
      if (pendingCartAction === 'buyNow') {
        // Call parent's onBuyNow if provided
        if (onBuyNow) {
          onBuyNow(dish, business);
        }
      }
    }
    setDatePickerOpen(false);
    setPendingCartAction(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dishService.deleteDish(dish.dishId, user?.phoneNumber);
      onDelete(dish.dishId);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete dish');
      console.error('Error deleting dish:', err);
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

  // Normalize image URL - handle Base64, file paths, and LOB OIDs
  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return '';
    
    // If it's already a full URL (http:// or https://) or Base64 (data:), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If it's just a number (LOB OID), it's invalid - return empty or fallback
    if (/^\d+$/.test(imagePath.trim())) {
      console.warn('Dish image is stored as LOB OID, not a valid image:', imagePath);
      return ''; // Return empty to show no image
    }
    
    // If it's a relative path starting with /uploads, prepend the backend URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:8080${imagePath}`;
    }
    
    // If it's just a filename or path without leading slash, construct the full path
    if (imagePath.includes('uploads/') || imagePath.includes('dishes/')) {
      // Handle paths like "uploads/dishes/gulabjamun.jpg" or "dishes/gulabjamun.jpg"
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:8080${normalizedPath}`;
    }
    
    // Default: assume it's a relative path in uploads/dishes
    return `http://localhost:8080/uploads/dishes/${imagePath}`;
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
        {dish.dishImage && (
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
                imageId: dish.dishId,
                imageUrl: getImageUrl(dish.dishImage),
                imageName: dish.dishName
              }]}
              height={400}
              showNavigation={false}
              showDots={false}
            />
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Availability Chip */}
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
              label={dish.isAvailable ? 'Available' : 'Unavailable'} 
              color={dish.isAvailable ? 'success' : 'default'}
              size="small"
              sx={{
                fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
                height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
              }}
            />
          </Box>
          
          {/* Dish Name */}
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
            {dish.dishName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {dish.dishDescription}
          </Typography>
          
          {/* Price Section */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              color="primary" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: 'clamp(1rem, 2vw, 1.25rem)', sm: 'clamp(1.125rem, 2vw, 1.5rem)' }
              }}
            >
              ₹{dish.price.toFixed(2)}
            </Typography>
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
                itemId={dish.dishId}
                itemType="DISH"
                businessId={business.businessId}
                onRateClick={handleRateClick}
                showRateButton={true}
                compact={true}
              />
            </Box>
          )}
          
          {/* Cart Button - Only show Add to Cart for clients, no Buy Now */}
          {business && showCartButton && user?.userType === 'CLIENT' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant={isInCart(dish.dishId, 'dish') ? "contained" : "outlined"}
                color={isInCart(dish.dishId, 'dish') ? "success" : "primary"}
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
                {isInCart(dish.dishId, 'dish') ? "In Cart" : "Add to Cart"}
              </Button>
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
                  onEdit(dish);
                }}
                title="Edit Dish"
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
                title="Delete Dish"
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
        <DialogTitle>Delete Dish</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{dish.dishName}"? This action cannot be undone.
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
          itemId={dish.dishId}
          itemType="DISH"
          itemName={dish.dishName}
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

      {/* Date Picker Dialog */}
      {business && (
        <DatePickerDialog
          open={datePickerOpen}
          onClose={() => {
            setDatePickerOpen(false);
            setPendingCartAction(null);
          }}
          onConfirm={handleDateConfirm}
          itemId={dish.dishId}
          itemType="dish"
          itemName={dish.dishName}
          businessId={business.businessId}
          title="Select Booking Date for Dish"
          onNotify={(date) => {
            setSnackbar({ 
              open: true, 
              message: `You will be notified when "${dish.dishName}" becomes available on ${date}`, 
              severity: 'success' 
            });
          }}
        />
      )}
    </>
  );
};

export default DishCard;

