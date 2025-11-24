import React, { useState, useEffect, useRef } from 'react';
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
import { Snackbar } from '@mui/material';
import DatePickerDialog from './DatePickerDialog';
import PlateDishSelector from './PlateDishSelector';

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dishSelectorOpen, setDishSelectorOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<'add' | 'buyNow' | null>(null);
  const [pendingBookingDate, setPendingBookingDate] = useState<string | undefined>(undefined);
  const openingDishSelectorRef = useRef(false); // Track if we're about to open dish selector
  const { addToCart, isInCart, removeFromCart, openCart } = useCart();
  const { user } = useAuth();
  
  const isOutOfStock = (plate.quantity ?? 0) <= 0;

  // Normalize plate image URL - handle Base64, file paths, and LOB OIDs
  const getPlateImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return '';
    
    // If it's already a full URL (http:// or https://) or Base64 (data:), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If it's just a number (LOB OID), it's invalid - return empty or fallback
    if (/^\d+$/.test(imagePath.trim())) {
      console.warn('Plate image is stored as LOB OID, not a valid image:', imagePath);
      return ''; // Return empty to show no image
    }
    
    // If it's a relative path starting with /uploads, prepend the backend URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:8080${imagePath}`;
    }
    
    // If it's just a filename or path without leading slash, construct the full path
    if (imagePath.includes('uploads/') || imagePath.includes('plates/')) {
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:8080${normalizedPath}`;
    }
    
    // Default: assume it's a relative path in uploads/plates
    return `http://localhost:8080/uploads/plates/${imagePath}`;
  };

  const handleCartToggle = (event?: React.MouseEvent) => {
    console.log('🍽️ PlateCard handleCartToggle called');
    console.log('🍽️ event:', event);
    console.log('🍽️ business:', business);
    console.log('🍽️ plate:', plate);
    console.log('🍽️ plate.plateId:', plate?.plateId);
    console.log('🍽️ isInCart function:', typeof isInCart);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      if (!business) {
        console.error('🍽️ ERROR: No business provided to handleCartToggle');
        alert('Error: Business information is missing. Cannot add to cart.');
        return;
      }
      
      if (!plate || !plate.plateId) {
        console.error('🍽️ ERROR: Plate or plateId is missing');
        alert('Error: Plate information is missing. Cannot add to cart.');
        return;
      }
      
      const inCart = isInCart(plate.plateId, 'plate');
      console.log('🍽️ isInCart result:', inCart);
      
      if (inCart) {
        console.log('🍽️ Item already in cart, removing');
        removeFromCart(plate.plateId, 'plate');
      } else {
        console.log('🍽️ Item not in cart, opening date picker');
        // Open date picker first
        setPendingCartAction('add');
        console.log('🍽️ Set pendingCartAction to "add"');
        setDatePickerOpen(true);
        console.log('🍽️ Set datePickerOpen to true');
        console.log('🍽️ Date picker should now be open');
      }
    } catch (error) {
      console.error('🍽️ ERROR in handleCartToggle:', error);
      alert('Error adding item to cart. Please try again.');
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
    console.log('🍽️ PlateCard handleDateConfirm called');
    console.log('🍽️ date:', date);
    console.log('🍽️ business:', business);
    console.log('🍽️ pendingCartAction:', pendingCartAction);
    console.log('🍽️ business?.businessCategory:', business?.businessCategory);
    
    if (!business) {
      console.error('🍽️ ERROR: No business provided to handleDateConfirm');
      return;
    }
    
    if (!pendingCartAction) {
      console.error('🍽️ ERROR: No pendingCartAction set');
      return;
    }
    
    // Store the booking date
    setPendingBookingDate(date);
    
    // Only open dish selector for catering businesses
    if (business.businessCategory === 'caters') {
      console.log('🍽️ Opening dish selector for catering business');
      console.log('🍽️ Keeping pendingCartAction:', pendingCartAction);
      // Set ref to indicate we're opening dish selector
      openingDishSelectorRef.current = true;
      // Don't reset pendingCartAction - dish selector needs it
      // Close date picker first, then open dish selector
      setDatePickerOpen(false);
      // Use setTimeout to ensure state updates happen in order
      setTimeout(() => {
        setDishSelectorOpen(true);
        openingDishSelectorRef.current = false; // Reset after opening
      }, 0);
    } else {
      // For non-catering businesses, add directly to cart without dishes
      console.log('🍽️ Adding plate to cart directly (non-catering)');
      console.log('🍽️ Plate:', plate);
      console.log('🍽️ Business:', business);
      console.log('🍽️ Date:', date);
      console.log('🍽️ About to call addToCart with:', { plate, business, date });
      
      try {
        addToCart(plate, business, date);
        console.log('🍽️ Successfully called addToCart');
      } catch (error) {
        console.error('🍽️ ERROR calling addToCart:', error);
      }
      
      if (pendingCartAction === 'buyNow') {
        if (onBuyNow) {
          onBuyNow(plate, business);
        }
      }
      setPendingCartAction(null);
      setPendingBookingDate(undefined);
    }
  };

  const handleDishSelectorConfirm = (selectedDishes: Array<{ dishId: string; dishName: string; dishPrice: number; quantity: number }>) => {
    console.log('🍽️ PlateCard handleDishSelectorConfirm called');
    console.log('🍽️ business:', business);
    console.log('🍽️ pendingCartAction:', pendingCartAction);
    console.log('🍽️ pendingBookingDate:', pendingBookingDate);
    console.log('🍽️ selectedDishes:', selectedDishes);
    console.log('🍽️ plate:', plate);
    
    if (!business) {
      console.error('🍽️ ERROR: No business provided to handleDishSelectorConfirm');
      return;
    }
    
    if (!pendingCartAction) {
      console.error('🍽️ ERROR: No pendingCartAction set');
      return;
    }
    
    // Add to cart with selected date and dishes
    console.log('🍽️ About to call addToCart with:', { 
      plate, 
      business, 
      pendingBookingDate, 
      selectedDishes 
    });
    
    try {
      addToCart(plate, business, pendingBookingDate, selectedDishes);
      console.log('🍽️ Successfully called addToCart from handleDishSelectorConfirm');
    } catch (error) {
      console.error('🍽️ ERROR calling addToCart from handleDishSelectorConfirm:', error);
    }
    
    if (pendingCartAction === 'buyNow') {
      // Call parent's onBuyNow if provided
      if (onBuyNow) {
        onBuyNow(plate, business);
      }
    }
    
    setDishSelectorOpen(false);
    setPendingCartAction(null);
    setPendingBookingDate(undefined);
    console.log('🍽️ Reset state after dish selector confirm');
  };

  const handleDishSelectorCancel = () => {
    setDishSelectorOpen(false);
    setPendingCartAction(null);
    setPendingBookingDate(undefined);
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
                imageUrl: getPlateImageUrl(plate.plateImage),
                imageName: plate.dishName
              }]}
              height={400}
              showNavigation={false}
              showDots={false}
            />
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chips Section - Veg/Non-Veg and Active/Inactive */}
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
            <Chip 
              label={plate.isActive ? 'Active' : 'Inactive'} 
              color={plate.isActive ? 'success' : 'default'}
              size="small"
              sx={{
                fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
                height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
              }}
            />
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
          
          {/* Cart Button - Only show Add to Cart for clients, no Buy Now */}
          {business && showCartButton && user?.userType === 'CLIENT' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant={isInCart(plate.plateId, 'plate') ? "contained" : "outlined"}
                color={isInCart(plate.plateId, 'plate') ? "success" : "primary"}
                size="small"
                startIcon={<CartIcon sx={{ fontSize: { xs: 'clamp(14px, 1.5vw, 16px)', sm: 'clamp(16px, 1.5vw, 18px)' } }} />}
                onClick={(e) => {
                  console.log('🍽️ Button onClick triggered');
                  handleCartToggle(e);
                }}
                disabled={!business || !plate || !plate.plateId}
                fullWidth
                sx={{
                  fontSize: { xs: 'clamp(0.625rem, 1vw, 0.7rem)', sm: 'clamp(0.7rem, 1vw, 0.8rem)' },
                  padding: { xs: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)', sm: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 20px)' },
                  minHeight: { xs: 'clamp(32px, 4vh, 36px)', sm: 'clamp(36px, 5vh, 40px)' },
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  zIndex: 1
                }}
              >
                {isInCart(plate.plateId, 'plate') ? "In Cart" : "Add to Cart"}
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

      {/* Date Picker Dialog */}
      {business && (
        <>
          <DatePickerDialog
            open={datePickerOpen}
            onClose={() => {
              console.log('🍽️ DatePickerDialog onClose called');
              console.log('🍽️ openingDishSelectorRef.current:', openingDishSelectorRef.current);
              // Only reset pendingCartAction if we're NOT opening the dish selector
              // If dish selector is about to open, we need to keep pendingCartAction
              // We'll reset it when dish selector is cancelled or confirmed
              if (!openingDishSelectorRef.current) {
                console.log('🍽️ Not opening dish selector, resetting pendingCartAction');
                setPendingCartAction(null);
                setPendingBookingDate(undefined);
              } else {
                console.log('🍽️ Opening dish selector, keeping pendingCartAction');
              }
              setDatePickerOpen(false);
            }}
            onConfirm={handleDateConfirm}
            itemId={plate.plateId}
            itemType="plate"
            itemName={plate.dishName}
          businessId={business.businessId}
          title="Select Booking Date for Plate"
          onNotify={(date) => {
            setSnackbar({ 
              open: true, 
              message: `You will be notified when "${plate.dishName}" becomes available on ${date}`, 
              severity: 'success' 
            });
          }}
        />
        <PlateDishSelector
          open={dishSelectorOpen}
          onClose={handleDishSelectorCancel}
          onConfirm={handleDishSelectorConfirm}
          plate={plate}
          business={business}
        />
        </>
      )}
    </>
  );
};

export default PlateCard;
