import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Button,
  Divider,
  Chip,
  Avatar,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Payment as CheckoutIcon,
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { OrderFormData } from '../types/cart';
import orderService from '../services/orderService';
import DatePickerDialog from './DatePickerDialog';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface CartProps {
  open: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({ open, onClose, onCheckout }) => {
  const { cart, removeFromCart, updateQuantity, updateBookingDate, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedItemForDate, setSelectedItemForDate] = useState<{ id: string; type: 'theme' | 'inventory' | 'plate' | 'dish' } | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryDate: '',
    specialNotes: '',
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleQuantityChange = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish', newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, itemType);
    } else {
      updateQuantity(itemId, itemType, newQuantity);
    }
  };

  const handleDatePickerOpen = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => {
    setSelectedItemForDate({ id: itemId, type: itemType });
    setDatePickerOpen(true);
  };

  const handleDateConfirm = (date: string | undefined) => {
    if (selectedItemForDate) {
      updateBookingDate(selectedItemForDate.id, selectedItemForDate.type, date);
    }
    setDatePickerOpen(false);
    setSelectedItemForDate(null);
  };

  const handleCheckout = () => {
    // Auto-fill form with user details and earliest booking date
    const userFullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName || user?.lastName || '';
    
    // Find the earliest booking date from cart items
    let earliestBookingDate = '';
    if (cart.items.length > 0) {
      const bookingDates = cart.items
        .map(item => item.bookingDate)
        .filter((date): date is string => date !== undefined && date !== null && date !== '');
      
      if (bookingDates.length > 0) {
        // Sort dates and get the earliest one
        bookingDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        earliestBookingDate = bookingDates[0];
      } else {
        // If no booking dates, use today's date as default
        const today = new Date();
        earliestBookingDate = today.toISOString().split('T')[0];
      }
    } else {
      // If cart is empty, use today's date
      const today = new Date();
      earliestBookingDate = today.toISOString().split('T')[0];
    }
    
    // Auto-fill form with user details
    setOrderForm({
      customerName: userFullName,
      customerEmail: user?.email || '',
      customerPhone: user?.phoneNumber || '',
      deliveryAddress: orderForm.deliveryAddress || '', // Keep existing address if any
      deliveryDate: earliestBookingDate,
      specialNotes: orderForm.specialNotes || '', // Keep existing notes if any
    });
    
    setCheckoutDialogOpen(true);
  };

  const handleOrderSubmit = async () => {
    if (!orderForm.customerName || !orderForm.customerEmail || !orderForm.customerPhone || !orderForm.deliveryAddress || !orderForm.deliveryDate) {
      setOrderError('Please fill in all required fields');
      return;
    }

    setOrderLoading(true);
    setOrderError(null);

    try {
      if (!user?.phoneNumber) {
        throw new Error('User not authenticated');
      }
      await orderService.createOrder(cart.items, orderForm, user.phoneNumber);
      clearCart();
      setCheckoutDialogOpen(false);
      onClose();
      if (onCheckout) {
        onCheckout();
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      // Try to extract a more detailed error message
      let errorMessage = 'Failed to create order. Please try again.';
      
      // The error from orderService.createOrder should already have the message
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Log the full error for debugging
      console.error('Full error object:', error);
      console.error('Error message:', errorMessage);
      
      setOrderError(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const getItemImage = (item: any) => {
    if ((item.type === 'plate' || item.type === 'dish') && item.image) {
      return item.image;
    }
    return '/api/placeholder/80/80';
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: 'clamp(300px, 85vw, 400px)', sm: 'clamp(350px, 70vw, 450px)', md: 500 },
            maxWidth: '90vw',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <CartIcon />
              Shopping Cart ({cart.totalItems})
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {cart.items.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some items to get started
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {cart.items.map((item, index) => (
                  <React.Fragment key={`${item.id}-${item.type}`}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                      <Box display="flex" width="100%" gap={2}>
                        <Avatar
                          src={getItemImage(item)}
                          sx={{ width: 60, height: 60, flexShrink: 0 }}
                        />
                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            {item.businessName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                          {/* Display selected dishes for plates */}
                          {item.type === 'plate' && item.selectedDishes && item.selectedDishes.length > 0 && (
                            <Box sx={{ mb: 1, pl: 1, borderLeft: '2px solid', borderColor: 'primary.main' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                                Selected Dishes:
                              </Typography>
                              {item.selectedDishes.map((dish, idx) => (
                                <Typography key={idx} variant="caption" color="text.secondary" display="block">
                                  • {dish.dishName} (Qty: {dish.quantity}) - {formatPrice(dish.dishPrice * dish.quantity)}
                                </Typography>
                              ))}
                              <Typography variant="caption" color="primary" fontWeight="bold" display="block" sx={{ mt: 0.5 }}>
                                Plate: {formatPrice(item.price - item.selectedDishes.reduce((sum, d) => sum + d.dishPrice * d.quantity, 0))} + 
                                Dishes: {formatPrice(item.selectedDishes.reduce((sum, d) => sum + d.dishPrice * d.quantity, 0))}
                              </Typography>
                            </Box>
                          )}
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Chip
                              label={item.type.toUpperCase()}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="h6" color="primary">
                              {formatPrice(item.price)} each
                            </Typography>
                          </Box>
                          {/* Booking Date */}
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CalendarIcon />}
                              onClick={() => handleDatePickerOpen(item.id, item.type)}
                              sx={{ textTransform: 'none' }}
                            >
                              {item.bookingDate
                                ? `Date: ${format(new Date(item.bookingDate), 'MMM dd, yyyy')}`
                                : 'Select Date'}
                            </Button>
                            {item.bookingDate && (
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                onClick={() => updateBookingDate(item.id, item.type, undefined)}
                              >
                                Clear
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Quantity and Delete Controls Below */}
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        width="100%" 
                        mt={2}
                        px={1}
                        flexWrap="wrap"
                        gap={2}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)' }}>
                            Quantity:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1)}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              width: { xs: 'clamp(28px, 3vw, 32px)', sm: 32 },
                              height: { xs: 'clamp(28px, 3vw, 32px)', sm: 32 }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              minWidth: 40, 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1)}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              width: { xs: 'clamp(28px, 3vw, 32px)', sm: 32 },
                              height: { xs: 'clamp(28px, 3vw, 32px)', sm: 32 }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)' }}>
                            Subtotal:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
                            {formatPrice(item.price * item.quantity)}
                          </Typography>
                          <IconButton
                            size="medium"
                            color="error"
                            onClick={() => removeFromCart(item.id, item.type)}
                            sx={{ 
                              ml: 1,
                              '&:hover': {
                                backgroundColor: 'error.lighter',
                              },
                              width: { xs: 'clamp(36px, 4vw, 40px)', sm: 40 },
                              height: { xs: 'clamp(36px, 4vw, 40px)', sm: 40 }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: { xs: 'clamp(18px, 2.5vw, 20px)', sm: 20 } }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < cart.items.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Total Items:</Typography>
                  <Typography variant="h6">{cart.totalItems}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Total Price:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatPrice(cart.totalPrice)}
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<CheckoutIcon />}
                  onClick={handleCheckout}
                  sx={{ mt: 2 }}
                >
                  Proceed to Checkout
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      {/* Checkout Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        onClose={() => {
          setCheckoutDialogOpen(false);
          setOrderError(null); // Clear any errors when closing
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Your Order</DialogTitle>
        <DialogContent>
          {orderError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {orderError}
            </Alert>
          )}
          
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Customer Name"
              value={orderForm.customerName}
              onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={orderForm.customerEmail}
              onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={orderForm.customerPhone}
              onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Delivery Address"
              value={orderForm.deliveryAddress}
              onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Delivery Date"
              type="date"
              value={orderForm.deliveryDate}
              onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Special Notes (Optional)"
              multiline
              rows={3}
              value={orderForm.specialNotes}
              onChange={(e) => setOrderForm({ ...orderForm, specialNotes: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleOrderSubmit}
            variant="contained"
            disabled={orderLoading}
            startIcon={orderLoading ? <CircularProgress size={20} /> : <CheckoutIcon />}
          >
            {orderLoading ? 'Creating Order...' : 'Place Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog */}
      {selectedItemForDate && (
        <DatePickerDialog
          open={datePickerOpen}
          onClose={() => {
            setDatePickerOpen(false);
            setSelectedItemForDate(null);
          }}
          onConfirm={handleDateConfirm}
          itemId={selectedItemForDate.id}
          itemType={selectedItemForDate.type}
          currentDate={cart.items.find(
            item => item.id === selectedItemForDate.id && item.type === selectedItemForDate.type
          )?.bookingDate}
          title="Select Booking Date"
        />
      )}
    </>
  );
};

export default Cart;
