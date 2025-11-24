import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Dish, Business, Plate } from '../types';
import dishService from '../services/dishService';

interface PlateDishSelectorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedDishes: Array<{ dishId: string; dishName: string; dishPrice: number; quantity: number }>) => void;
  plate: Plate;
  business: Business;
}

interface SelectedDish {
  dishId: string;
  dishName: string;
  dishPrice: number;
  quantity: number;
}

const PlateDishSelector: React.FC<PlateDishSelectorProps> = ({
  open,
  onClose,
  onConfirm,
  plate,
  business,
}) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<Map<string, SelectedDish>>(new Map());

  useEffect(() => {
    if (open && business.businessId) {
      fetchDishes();
    }
  }, [open, business.businessId]);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const dishesData = await dishService.getDishesByBusinessId(business.businessId);
      // Filter only available dishes
      const availableDishes = dishesData.filter(dish => dish.isAvailable && (dish.quantity ?? 0) > 0);
      setDishes(availableDishes);
    } catch (err: any) {
      console.error('Error fetching dishes:', err);
      setError('Failed to load dishes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDishToggle = (dish: Dish) => {
    const newSelected = new Map(selectedDishes);
    if (newSelected.has(dish.dishId)) {
      newSelected.delete(dish.dishId);
    } else {
      newSelected.set(dish.dishId, {
        dishId: dish.dishId,
        dishName: dish.dishName,
        dishPrice: dish.price,
        quantity: 1,
      });
    }
    setSelectedDishes(newSelected);
  };

  const handleQuantityChange = (dishId: string, quantity: number) => {
    if (quantity < 1) return;
    const newSelected = new Map(selectedDishes);
    const dish = newSelected.get(dishId);
    if (dish) {
      newSelected.set(dishId, { ...dish, quantity });
    }
    setSelectedDishes(newSelected);
  };

  const handleConfirm = () => {
    console.log('🍽️ PlateDishSelector handleConfirm called');
    const dishesArray = Array.from(selectedDishes.values());
    console.log('🍽️ Selected dishes array:', dishesArray);
    console.log('🍽️ Calling onConfirm with dishes:', dishesArray);
    onConfirm(dishesArray);
    setSelectedDishes(new Map());
    console.log('🍽️ PlateDishSelector: Called onConfirm and reset selectedDishes');
  };

  const handleCancel = () => {
    setSelectedDishes(new Map());
    onClose();
  };

  const calculateTotal = () => {
    const dishesTotal = Array.from(selectedDishes.values()).reduce(
      (sum, dish) => sum + dish.dishPrice * dish.quantity,
      0
    );
    return plate.price + dishesTotal;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">Add Dishes to Plate</Typography>
          <Typography variant="body2" color="text.secondary">
            {plate.dishName} - {formatPrice(plate.price)}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : dishes.length === 0 ? (
          <Alert severity="info">No dishes available for this business.</Alert>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Select dishes to add to your plate (optional):
            </Typography>
            <Grid container spacing={2}>
              {dishes.map((dish) => {
                const isSelected = selectedDishes.has(dish.dishId);
                const selectedDish = selectedDishes.get(dish.dishId);
                return (
                  <Grid item xs={12} sm={6} key={dish.dishId}>
                    <Card
                      variant={isSelected ? 'outlined' : 'elevation'}
                      sx={{
                        border: isSelected ? 2 : 0,
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleDishToggle(dish)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleDishToggle(dish)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {dish.dishName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {dish.dishDescription}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {formatPrice(dish.price)}
                            </Typography>
                            {isSelected && (
                              <Box mt={1}>
                                <TextField
                                  type="number"
                                  label="Quantity"
                                  value={selectedDish?.quantity || 1}
                                  onChange={(e) =>
                                    handleQuantityChange(dish.dishId, parseInt(e.target.value) || 1)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  inputProps={{ min: 1, max: dish.quantity || 1 }}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Total Price:</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPrice(calculateTotal())}
              </Typography>
            </Box>
            {selectedDishes.size > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Plate: {formatPrice(plate.price)} + Dishes: {formatPrice(
                  Array.from(selectedDishes.values()).reduce(
                    (sum, dish) => sum + dish.dishPrice * dish.quantity,
                    0
                  )
                )}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
        >
          Add to Cart
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlateDishSelector;

