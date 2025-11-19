import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  TextField,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  AttachMoney as PriceIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  FlashOn as BuyNowIcon,
} from '@mui/icons-material';
import { Inventory, InventoryImage, Business } from '../types';
import InventoryService from '../services/inventoryService';
import ImageCarousel from './ImageCarousel';
import { useCart } from '../contexts/CartContext';
import RatingDisplay from './RatingDisplay';
import RatingComponent from './RatingComponent';
import { Rating } from '../types/rating';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Snackbar } from '@mui/material';
import DatePickerDialog from './DatePickerDialog';

interface InventoryCardProps {
  inventory: Inventory;
  business?: Business;
  onEdit?: (inventory: Inventory) => void;
  onDelete?: (inventoryId: string) => void;
  onViewImages?: (inventory: Inventory) => void;
  onPriceUpdate?: (inventoryId: string, newPrice: number) => void;
  onBuyNow?: (inventory: Inventory, business: Business) => void;
  showActions?: boolean;
  showCartButton?: boolean;
  showBuyNowButton?: boolean;
  refreshTrigger?: number; // Add this to trigger image refresh
}

const InventoryCard: React.FC<InventoryCardProps> = ({
  inventory,
  business,
  onEdit,
  onDelete,
  onViewImages,
  onPriceUpdate,
  onBuyNow,
  showActions = true,
  showCartButton = true,
  showBuyNowButton = true,
  refreshTrigger,
}) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState<number>(inventory.price);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<'add' | 'buyNow' | null>(null);
  const { addToCart, isInCart, removeFromCart, openCart } = useCart();
  const { user } = useAuth();
  
  const isOutOfStock = inventory.quantity <= 0;

  const handleCartToggle = () => {
    if (business) {
      if (isInCart(inventory.inventoryId, 'inventory')) {
        removeFromCart(inventory.inventoryId, 'inventory');
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
      addToCart(inventory, business, date);
      
      if (pendingCartAction === 'buyNow') {
        // Open cart drawer
        openCart();
        
        // Call parent's onBuyNow if provided
        if (onBuyNow) {
          onBuyNow(inventory, business);
        }
      }
    }
    setDatePickerOpen(false);
    setPendingCartAction(null);
  };


  useEffect(() => {
    fetchInventoryImages();
  }, [inventory.inventoryId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEditPrice(inventory.price);
  }, [inventory.price]);

  const fetchInventoryImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const inventoryImages = await InventoryService.getInventoryImagesByInventoryId(inventory.inventoryId);
      setImages(inventoryImages);
    } catch (err: any) {
      setError('Failed to load images');
      console.error('Error fetching inventory images:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      chair: 'primary',
      table: 'secondary',
      plates: 'info',
      decoration: 'success',
      lighting: 'warning',
      sound: 'error',
      catering: 'default',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setEditPrice(inventory.price);
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setEditPrice(inventory.price);
  };

  const handlePriceSave = async () => {
    if (editPrice <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    try {
      setPriceUpdateLoading(true);
      
      // Update the inventory with new price
      const updatedInventory = { ...inventory, price: editPrice };
      await InventoryService.updateInventory(inventory.inventoryId, updatedInventory);
      
      // Call the parent's price update handler
      if (onPriceUpdate) {
        onPriceUpdate(inventory.inventoryId, editPrice);
      }
      
      setIsEditingPrice(false);
    } catch (err) {
      console.error('Error updating price:', err);
      alert('Failed to update price. Please try again.');
    } finally {
      setPriceUpdateLoading(false);
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
    <Card
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
        minHeight: { xs: 'auto', sm: '500px' },
      }}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', width: '100%', flexShrink: 0 }}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={{ xs: 'clamp(200px, 40vh, 250px)', sm: 'clamp(250px, 35vh, 300px)', md: 'clamp(280px, 35vh, 320px)' }}
            bgcolor="grey.100"
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={{ xs: 'clamp(200px, 40vh, 250px)', sm: 'clamp(250px, 35vh, 300px)', md: 'clamp(280px, 35vh, 320px)' }}
            bgcolor="grey.100"
            flexDirection="column"
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Failed to load images
            </Typography>
          </Box>
        ) : images.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={{ xs: 'clamp(200px, 40vh, 250px)', sm: 'clamp(250px, 35vh, 300px)', md: 'clamp(280px, 35vh, 320px)' }}
            bgcolor="grey.100"
            flexDirection="column"
          >
            <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              No images uploaded
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            height: { xs: 'clamp(200px, 40vh, 250px)', sm: 'clamp(250px, 35vh, 300px)', md: 'clamp(280px, 35vh, 320px)' },
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            '& > div': {
              height: '100% !important'
            }
          }}>
            <ImageCarousel
              images={images}
              height={400}
              showNavigation={true}
              showDots={true}
              onImageClick={() => onViewImages?.(inventory)}
            />
          </Box>
        )}
      </Box>

      {/* Content Section */}
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        padding: { xs: 'clamp(12px, 2vw, 16px)', sm: 'clamp(16px, 2vw, 20px)' }
      }}>
        {/* Product Name - Right after image */}
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            mb: 1,
            fontWeight: 'bold',
            fontSize: { xs: 'clamp(1rem, 2vw, 1.125rem)', sm: 'clamp(1.125rem, 2vw, 1.25rem)' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word'
          }}
        >
          {inventory.inventoryName}
        </Typography>

        {/* Description - Right after name with consistent spacing */}
        <Box 
          sx={{ 
            mb: 1.5,
            minHeight: { xs: 'clamp(60px, 12vh, 80px)', sm: 'clamp(70px, 12vh, 90px)', md: 'clamp(80px, 12vh, 100px)' },
            maxHeight: { xs: 'clamp(60px, 12vh, 80px)', sm: 'clamp(70px, 12vh, 90px)', md: 'clamp(80px, 12vh, 100px)' },
            display: 'flex',
            alignItems: 'flex-start'
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: 'clamp(0.875rem, 1.5vw, 1rem)', sm: 'clamp(0.875rem, 1.5vw, 1rem)' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              lineHeight: { xs: 'clamp(1.25rem, 2vw, 1.5rem)', sm: 'clamp(1.375rem, 2vw, 1.625rem)' }
            }}
          >
            {inventory.inventoryDescription}
          </Typography>
        </Box>

        {/* Category Chip - Below description */}
        <Box sx={{ mb: 1 }}>
          <Chip
            label={inventory.inventoryCategory}
            color={getCategoryColor(inventory.inventoryCategory)}
            size="small"
            variant="outlined"
            sx={{
              fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
              height: { xs: 'clamp(20px, 3vh, 24px)', sm: '24px' }
            }}
          />
        </Box>

        <Box mb={2}>
          <Box 
            display="flex" 
            justifyContent="flex-start" 
            alignItems="center" 
            mb={1} 
            flexWrap="nowrap" 
            gap={1}
            sx={{ 
              width: '100%',
              overflow: 'hidden'
            }}
          >
            {isEditingPrice ? (
              <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ 
                    width: { xs: 'clamp(80px, 20vw, 120px)', sm: 120 },
                    flexShrink: 0,
                    '& .MuiInputBase-input': {
                      fontSize: { xs: 'clamp(0.875rem, 1.5vw, 1rem)', sm: '1rem' }
                    }
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handlePriceSave}
                  disabled={priceUpdateLoading}
                  color="primary"
                  sx={{ 
                    padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 },
                    flexShrink: 0
                  }}
                >
                  {priceUpdateLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CheckIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handlePriceCancel}
                  disabled={priceUpdateLoading}
                  sx={{ 
                    padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 },
                    flexShrink: 0
                  }}
                >
                  <CloseIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
                </IconButton>
              </Box>
            ) : (
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{ 
                  width: '100%',
                  minWidth: 0 // Allows flex items to shrink
                }}
              >
                <Typography 
                  variant="h6" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: 'clamp(1rem, 2vw, 1.25rem)', sm: 'clamp(1.125rem, 2vw, 1.5rem)' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                    maxWidth: '100%'
                  }}
                >
                  {formatPrice(inventory.price)}
                </Typography>
                {/* Only show edit price button for vendors */}
                {showActions && onPriceUpdate && user && user.userType === 'VENDOR' && (
                  <Tooltip title="Edit Price">
                    <IconButton
                      size="small"
                      onClick={handlePriceEdit}
                      sx={{ 
                        ml: 0.5,
                        padding: { xs: 'clamp(4px, 1vw, 8px)', sm: 1 },
                        flexShrink: 0
                      }}
                    >
                      <PriceIcon sx={{ fontSize: { xs: 'clamp(16px, 2vw, 18px)', sm: 18 } }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: 'clamp(0.625rem, 1vw, 0.75rem)', sm: '0.75rem' },
              display: 'block',
              mb: 1
            }}
          >
            Qty: {inventory.quantity}
          </Typography>
          
          {/* Rating Display */}
          {business && (
            <Box 
              mt={1} 
              mb={1}
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
                itemId={inventory.inventoryId}
                itemType="INVENTORY"
                businessId={business.businessId}
                onRateClick={handleRateClick}
                showRateButton={true}
                compact={true}
              />
            </Box>
          )}
        </Box>

        {/* Cart and Buy Now Buttons - Always show, date picker will handle availability */}
        {business && (showCartButton || showBuyNowButton) && (
          <Box sx={{ mb: 2, mt: 'auto' }}>
            <Box 
              display="flex" 
              gap={{ xs: 0.5, sm: 1 }} 
              flexDirection={{ xs: 'column', sm: 'row' }}
              sx={{ width: '100%' }}
            >
              {showCartButton && (
                <Button
                  variant={isInCart(inventory.inventoryId, 'inventory') ? "contained" : "outlined"}
                  color={isInCart(inventory.inventoryId, 'inventory') ? "success" : "primary"}
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
                  {isInCart(inventory.inventoryId, 'inventory') ? "In Cart" : "Add to Cart"}
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
        {showActions && user && user.userType === 'VENDOR' && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              {onViewImages && (
                <Tooltip title="View Images">
                  <IconButton
                    size="small"
                    onClick={() => onViewImages(inventory)}
                    color="primary"
                  >
                    <ImageIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            <Box>
              {onEdit && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(inventory)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(inventory.inventoryId)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      {/* Rating Dialog */}
      {business && (
        <RatingComponent
          open={ratingDialogOpen}
          onClose={handleRatingDialogClose}
          itemId={inventory.inventoryId}
          itemType="INVENTORY"
          itemName={inventory.inventoryName}
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
          itemId={inventory.inventoryId}
          itemType="inventory"
          itemName={inventory.inventoryName}
          businessId={business.businessId}
          title="Select Booking Date for Inventory"
          onNotify={(date) => {
            setSnackbar({ 
              open: true, 
              message: `You will be notified when "${inventory.inventoryName}" becomes available on ${date}`, 
              severity: 'success' 
            });
          }}
        />
      )}
    </Card>
  );
};

export default InventoryCard;
