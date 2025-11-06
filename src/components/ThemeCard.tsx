import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  FlashOn as BuyNowIcon,
} from '@mui/icons-material';
import { Theme, Image, Business } from '../types';
import ImageService from '../services/imageService';
import ImageCarousel from './ImageCarousel';
import { useCart } from '../contexts/CartContext';
import RatingDisplay from './RatingDisplay';
import RatingComponent from './RatingComponent';
import { Rating } from '../types/rating';
import { useAuth } from '../contexts/AuthContext';
import stockNotificationService from '../services/stockNotificationService';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Alert, Snackbar } from '@mui/material';

interface ThemeCardProps {
  theme: Theme;
  business?: Business;
  onEdit?: (theme: Theme) => void;
  onDelete?: (theme: Theme) => void;
  onViewImages?: (theme: Theme) => void;
  onBuyNow?: (theme: Theme, business: Business) => void;
  showActions?: boolean;
  showCartButton?: boolean;
  showBuyNowButton?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  business,
  onEdit,
  onDelete,
  onViewImages,
  onBuyNow,
  showActions = true,
  showCartButton = true,
  showBuyNowButton = true,
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | undefined>(undefined);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const { addToCart, isInCart, removeFromCart, openCart } = useCart();
  const { user } = useAuth();
  
  const isOutOfStock = (theme.quantity ?? 0) <= 0;

  const handleCartToggle = () => {
    if (business) {
      if (isInCart(theme.themeId, 'theme')) {
        removeFromCart(theme.themeId, 'theme');
      } else {
        addToCart(theme, business);
      }
    }
  };

  const handleBuyNow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (business && !isOutOfStock) {
      // Check if item is already in cart
      const itemInCart = isInCart(theme.themeId, 'theme');
      
      // If not in cart, add it
      if (!itemInCart) {
        addToCart(theme, business);
      }
      
      // Open cart drawer
      openCart();
      
      // Call parent's onBuyNow if provided
      if (onBuyNow) {
        onBuyNow(theme, business);
      }
    }
  };

  // Check subscription status on mount
  useEffect(() => {
    if (user && isOutOfStock) {
      stockNotificationService.isSubscribed(user.phoneNumber, theme.themeId, 'THEME')
        .then(setIsSubscribed)
        .catch(() => setIsSubscribed(false));
    }
  }, [user, theme.themeId, isOutOfStock]);

  const handleNotifyMe = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user || !business) return;
    
    try {
      setSubscribing(true);
      await stockNotificationService.subscribe(
        user.phoneNumber,
        theme.themeId,
        'THEME',
        theme.themeName,
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

  // Format price range to ensure rupee symbol and comma separators
  const formatPriceRange = (priceRange: string) => {
    if (!priceRange) return 'Contact for Quote';
    
    // Helper function to format number with commas
    const formatNumber = (numStr: string): string => {
      // Remove all non-digits
      const cleaned = numStr.replace(/[^\d]/g, '');
      if (!cleaned) return numStr;
      // Convert to number and format with Indian locale (comma separators)
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? numStr : num.toLocaleString('en-IN');
    };

    // If it already contains rupee symbol, ensure numbers are formatted with commas
    if (priceRange.includes('₹')) {
      // Check if numbers need comma formatting
      const numbersWithoutCommas = priceRange.match(/\d{4,}/g);
      if (numbersWithoutCommas) {
        let formatted = priceRange;
        numbersWithoutCommas.forEach(num => {
          const formattedNum = formatNumber(num);
          formatted = formatted.replace(num, formattedNum);
        });
        return formatted;
      }
      return priceRange;
    }

    // If it's a number or numeric string, format with rupee and commas
    const numericMatch = priceRange.match(/[\d,]+/);
    if (numericMatch) {
      // If it's a range (contains dash or "to")
      if (priceRange.includes('-') || priceRange.toLowerCase().includes('to')) {
        const parts = priceRange.split(/[-–—to]/i);
        if (parts.length === 2) {
          const start = parts[0].replace(/[^\d]/g, '');
          const end = parts[1].replace(/[^\d]/g, '');
          if (start && end) {
            const formattedStart = formatNumber(start);
            const formattedEnd = formatNumber(end);
            return `₹${formattedStart} - ₹${formattedEnd}`;
          }
        }
      }
      
      // Single price
      const numbers = priceRange.replace(/[^\d]/g, '');
      if (numbers) {
        const formattedNum = formatNumber(numbers);
        return `₹${formattedNum}`;
      }
    }
    
    // For special cases like "Contact for Quote", return as is
    return priceRange.includes('Contact') || priceRange.includes('Quote') 
      ? priceRange 
      : `₹${priceRange}`;
  };

  useEffect(() => {
    fetchAllImages();
  }, [theme.themeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const allImages = await ImageService.getImagesByThemeId(theme.themeId);
      setImages(allImages);
    } catch (err: any) {
      setError('Failed to load images');
      console.error('Error fetching theme images:', err);
    } finally {
      setLoading(false);
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
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Images Section */}
      <Box sx={{ position: 'relative' }}>
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="200"
            bgcolor="grey.100"
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="200"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Failed to load images
            </Typography>
          </Box>
        ) : (
          <ImageCarousel
            images={images}
            height={200}
            showNavigation={true}
            showDots={true}
            onImageClick={() => onViewImages?.(theme)}
          />
        )}
        
        {/* Status Chips */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {isOutOfStock && (
            <Chip 
              label="Out of Stock" 
              color="error"
              size="small"
            />
          )}
          {!isOutOfStock && (
            <Chip 
              label={theme.isActive ? 'Active' : 'Inactive'} 
              color={theme.isActive ? 'success' : 'default'}
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {theme.themeName}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
          {theme.themeDescription}
        </Typography>
        
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Category:</strong> {theme.themeCategory}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 1,
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography 
              variant="h6" 
              color="primary" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: 'clamp(1rem, 2vw, 1.25rem)', sm: 'clamp(1.125rem, 2vw, 1.5rem)' }
              }}
            >
              {formatPriceRange(theme.priceRange)}
            </Typography>
          </Box>
          
          {/* Rating Display */}
          {business && (
            <Box 
              mt={1}
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
                itemId={theme.themeId}
                itemType="THEME"
                businessId={business.businessId}
                onRateClick={handleRateClick}
                showRateButton={true}
                compact={true}
              />
            </Box>
          )}
        </Box>
      </CardContent>
      
      {/* Actions Section */}
      <Box sx={{ p: 2, pt: 0 }}>
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
                  variant={isInCart(theme.themeId, 'theme') ? "contained" : "outlined"}
                  color={isInCart(theme.themeId, 'theme') ? "success" : "primary"}
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
                  {isInCart(theme.themeId, 'theme') ? "In Cart" : "Add to Cart"}
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

        {/* Admin Actions - Only show for vendors */}
        {showActions && user && user.userType === 'VENDOR' && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(theme.createdAt).toLocaleDateString()}
            </Typography>
            <Box>
              {onViewImages && (
                <IconButton 
                  size="small" 
                  color="info"
                  onClick={() => onViewImages(theme)}
                  title="Manage Images"
                >
                  <ViewIcon />
                </IconButton>
              )}
              {onEdit && (
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onEdit(theme)}
                  title="Edit theme"
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onDelete(theme)}
                  title="Delete theme"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Rating Dialog */}
      {business && (
        <RatingComponent
          open={ratingDialogOpen}
          onClose={handleRatingDialogClose}
          itemId={theme.themeId}
          itemType="THEME"
          itemName={theme.themeName}
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
    </Card>
  );
};

export default ThemeCard;
