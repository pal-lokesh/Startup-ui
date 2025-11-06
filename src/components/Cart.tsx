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
