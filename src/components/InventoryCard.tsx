import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  AttachMoney as PriceIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Inventory, InventoryImage } from '../types';
import InventoryService from '../services/inventoryService';

interface InventoryCardProps {
  inventory: Inventory;
  onEdit?: (inventory: Inventory) => void;
  onDelete?: (inventoryId: string) => void;
  onViewImages?: (inventory: Inventory) => void;
  onPriceUpdate?: (inventoryId: string, newPrice: number) => void;
  showActions?: boolean;
  refreshTrigger?: number; // Add this to trigger image refresh
}

const InventoryCard: React.FC<InventoryCardProps> = ({
  inventory,
  onEdit,
  onDelete,
  onViewImages,
  onPriceUpdate,
  showActions = true,
  refreshTrigger,
}) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState(inventory.price);
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
      console.log('Fetching images for inventory:', inventory.inventoryId);
      const inventoryImages = await InventoryService.getInventoryImagesByInventoryId(inventory.inventoryId);
      console.log('Received images:', inventoryImages);
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
      <Box sx={{ height: 200, position: 'relative' }}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            bgcolor="grey.100"
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
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
            height="100%"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              No images uploaded
            </Typography>
          </Box>
        ) : images.length === 1 ? (
          <CardMedia
            component="img"
            height="200"
            image={images[0].imageUrl}
            alt={images[0].imageName}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
            {/* Main image (first image or primary) */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              <CardMedia
                component="img"
                height="200"
                image={images[0].imageUrl}
                alt={images[0].imageName}
                sx={{ objectFit: 'cover', width: '100%' }}
              />
              {/* Image count overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                +{images.length - 1} more
              </Box>
            </Box>

            {/* Thumbnail strip for additional images */}
            {images.length > 1 && (
              <Box sx={{ width: 60, display: 'flex', flexDirection: 'column' }}>
                {images.slice(1, 4).map((image, index) => (
                  <Box key={image.imageId} sx={{ flex: 1, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={image.imageUrl}
                      alt={image.imageName}
                      sx={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        borderLeft: '2px solid white'
                      }}
                    />
                    {index === 2 && images.length > 4 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +{images.length - 4}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Status Chip */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
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

        {/* Action Buttons */}
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
