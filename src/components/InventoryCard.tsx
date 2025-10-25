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
  const { addToCart, isInCart } = useCart();
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);

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
      {/* Image Section */}
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
        ) : images.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="200"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              No images uploaded
            </Typography>
          </Box>
        ) : (
          <ImageCarousel
            images={images}
            height={200}
            showNavigation={true}
            showDots={true}
            onImageClick={() => onViewImages?.(inventory)}
          />
        )}

        {/* Status Chip */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
          <Chip
            label={inventory.isActive ? 'Available' : 'Unavailable'}
            color={inventory.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {inventory.inventoryName}
          </Typography>
          <Chip
            label={inventory.inventoryCategory}
            color={getCategoryColor(inventory.inventoryCategory)}
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
          {inventory.inventoryDescription}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            {isEditingPrice ? (
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  size="small"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: 100 }}
                />
                <IconButton
                  size="small"
                  onClick={handlePriceSave}
                  disabled={priceUpdateLoading}
                  color="primary"
                >
                  {priceUpdateLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CheckIcon />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handlePriceCancel}
                  disabled={priceUpdateLoading}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatPrice(inventory.price)}
                </Typography>
                {showActions && onPriceUpdate && (
                  <Tooltip title="Edit Price">
                    <IconButton
                      size="small"
                      onClick={handlePriceEdit}
                      sx={{ ml: 0.5 }}
                    >
                      <PriceIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary">
              Qty: {inventory.quantity}
            </Typography>
          </Box>
        </Box>

        {/* Cart and Buy Now Buttons */}
        {business && (showCartButton || showBuyNowButton) && (
          <Box sx={{ mb: 2 }}>
            <Box display="flex" gap={1} mb={1}>
              {showCartButton && (
                <Button
                  variant={isInCart(inventory.inventoryId, 'inventory') ? "contained" : "outlined"}
                  color={isInCart(inventory.inventoryId, 'inventory') ? "success" : "primary"}
                  size="small"
                  startIcon={<CartIcon />}
                  onClick={() => addToCart(inventory, business)}
                  fullWidth
                >
                  {isInCart(inventory.inventoryId, 'inventory') ? "In Cart" : "Add to Cart"}
                </Button>
              )}
              {showBuyNowButton && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<BuyNowIcon />}
                  onClick={() => onBuyNow && onBuyNow(inventory, business)}
                  fullWidth
                >
                  Buy Now
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Admin Action Buttons */}
        {showActions && (
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
    </Card>
  );
};

export default InventoryCard;
