import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

interface CartProps {
  open: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({ open, onClose, onCheckout }) => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
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

  const handleQuantityChange = (itemId: string, itemType: 'theme' | 'inventory' | 'plate', newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, itemType);
    } else {
      updateQuantity(itemId, itemType, newQuantity);
    }
  };

  const handleCheckout = () => {
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
      setOrderError(error.message || 'Failed to create order. Please try again.');
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
    if (item.type === 'plate' && item.image) {
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
            width: 400,
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
                    <ListItem>
                      <Avatar
                        src={getItemImage(item)}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.businessName}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={1}>
                              <Chip
                                label={item.type.toUpperCase()}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Typography variant="h6" color="primary">
                                {formatPrice(item.price)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1)}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(item.id, item.type)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
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
        onClose={() => setCheckoutDialogOpen(false)}
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
    </>
  );
};

export default Cart;
