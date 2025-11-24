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
import { OrderFormData, CartItem } from '../types/cart';
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
  const cartContext = useCart();
  const { cart, removeFromCart, updateQuantity, updateBookingDate, clearCart } = cartContext;
  const { user } = useAuth();
  
  // State declarations - must be before useEffect that uses them
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
  
  // Debug: Log cart state when drawer opens or cart changes
  React.useEffect(() => {
    console.log('🛒 Cart component rendered. Drawer open:', open);
    console.log('🛒 Full cart context:', cartContext);
    console.log('🛒 Cart from context:', cart);
    console.log('🛒 Cart items count:', cart?.items?.length || 0);
    console.log('🛒 Cart items:', cart?.items);
    console.log('🛒 Cart total items:', cart?.totalItems, 'Total price:', cart?.totalPrice);
    console.log('🛒 Cart items is array?', Array.isArray(cart?.items));
    if (open) {
      console.log('🛒 Cart drawer is OPEN. Items in cart:', cart?.items?.length || 0, cart?.items);
      console.log('🛒 Checkout dialog should NOT auto-open. User must click "Proceed to Checkout" button.');
    }
  }, [open, cart, cartContext]);
  
  // CRITICAL: Ensure checkout dialog NEVER auto-opens
  // Orders should ONLY be placed when user explicitly clicks "Place Order(s)" button
  React.useEffect(() => {
    if (checkoutDialogOpen) {
      console.log('🛒 ⚠️ Checkout dialog opened - this should ONLY happen when user clicks "Proceed to Checkout"');
      console.log('🛒 ⚠️ Order will NOT be placed until user clicks "Place Order(s)" button');
    }
  }, [checkoutDialogOpen]);

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
    console.log('🛒 ⚠️⚠️⚠️ handleOrderSubmit CALLED - ORDER WILL BE PLACED ⚠️⚠️⚠️');
    console.log('🛒 This should ONLY be called when user explicitly clicks "Place Order(s)" button');
    console.log('🛒 Order form data:', orderForm);
    console.log('🛒 Cart items:', cart.items);
    
    if (!orderForm.customerName || !orderForm.customerEmail || !orderForm.customerPhone || !orderForm.deliveryAddress || !orderForm.deliveryDate) {
      console.log('🛒 Validation failed - missing required fields');
      setOrderError('Please fill in all required fields');
      return;
    }
    
    console.log('🛒 All validations passed - proceeding with order creation');

    setOrderLoading(true);
    setOrderError(null);

    // Store cart items before order creation for potential rollback
    const cartItemsBeforeOrder = [...cart.items];

    try {
      if (!user?.phoneNumber) {
        throw new Error('User not authenticated');
      }
      
      // Group items by vendor to show how many orders will be created
      const itemsByVendor = new Map<string, CartItem[]>();
      cart.items.forEach(item => {
        const businessId = item.businessId;
        if (!itemsByVendor.has(businessId)) {
          itemsByVendor.set(businessId, []);
        }
        itemsByVendor.get(businessId)!.push(item);
      });

      console.log(`Creating ${itemsByVendor.size} order(s) for ${cart.items.length} item(s) from ${itemsByVendor.size} vendor(s)`);
      console.log('🛒 Cart items before order:', cart.items.length, cart.items);
      
      // Create orders grouped by vendor
      const orders = await orderService.createOrder(cart.items, orderForm, user.phoneNumber);
      
      console.log(`Successfully created ${orders.length} order(s)`);
      console.log('🛒 Cart items before clearing:', cart.items.length, cart.items);
      
      // Clear cart immediately after successful order creation (even if partial success)
      // This ensures cart is cleared for successfully created orders
      if (orders.length > 0) {
        clearCart();
        console.log('🛒 clearCart() called - cart should be empty now');
      }
      
      // Reset order form
      setOrderForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        deliveryAddress: '',
        deliveryDate: '',
        specialNotes: '',
      });
      
      // Close dialogs and cart drawer
      setCheckoutDialogOpen(false);
      onClose();
      
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify cart is cleared (this will use the updated cart state)
      console.log('🛒 Verifying cart is cleared...');
      
      if (onCheckout) {
        onCheckout();
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      // Try to extract a more detailed error message
      let errorMessage = 'Failed to create order(s). Please try again.';
      
      // The error from orderService.createOrder should already have the message
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Log the full error for debugging
      console.error('Full error object:', error);
      console.error('Error message:', errorMessage);
      
      // Even if there's an error, check if any orders were created
      // If orders were created, we should still clear the cart for those items
      // For now, we'll keep the cart items if there's an error
      // TODO: Implement partial success handling if needed
      
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

          {(() => {
            console.log('🛒 Cart render - cart.items.length:', cart.items.length);
            console.log('🛒 Cart render - cart.items:', cart.items);
            console.log('🛒 Cart render - cart.totalItems:', cart.totalItems);
            console.log('🛒 Cart render - cart object:', cart);
            console.log('🛒 Cart render - typeof cart.items:', typeof cart.items, Array.isArray(cart.items));
            return null;
          })()}
          {!cart.items || cart.items.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some items to get started
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Debug: cart.items.length = {cart.items.length}, cart.totalItems = {cart.totalItems}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  console.log('🧪 TEST BUTTON CLICKED');
                  console.log('🧪 cart:', cart);
                  console.log('🧪 cart.items:', cart.items);
                  console.log('🧪 cartContext:', cartContext);
                  console.log('🧪 removeFromCart function:', typeof removeFromCart);
                  console.log('🧪 updateQuantity function:', typeof updateQuantity);
                }}
                sx={{ mt: 2 }}
              >
                Test Cart Context
              </Button>
            </Box>
          ) : (
            <>
              {/* Show vendor grouping info if items from multiple vendors */}
              {(() => {
                const uniqueVendors = new Set(cart.items.map(item => item.businessId));
                const vendorCount = uniqueVendors.size;
                return vendorCount > 1 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Your cart contains items from <strong>{vendorCount} vendor(s)</strong>. 
                      Separate orders will be created for each vendor.
                    </Typography>
                  </Alert>
                ) : null;
              })()}
              <List>
                {(() => {
                  // Sort items by vendor (businessId) to group them together
                  const sortedItems = [...cart.items].sort((a, b) => {
                    if (a.businessId !== b.businessId) {
                      return a.businessId.localeCompare(b.businessId);
                    }
                    return 0;
                  });
                  
                  return sortedItems.map((item, index) => {
                    // Check if this is the first item from this vendor
                    const isFirstItemFromVendor = index === 0 || 
                      sortedItems[index - 1].businessId !== item.businessId;
                    
                    return (
                    <React.Fragment key={`${item.id}-${item.type}`}>
                      {isFirstItemFromVendor && index > 0 && (
                        <Divider sx={{ my: 1 }} />
                      )}
                      {isFirstItemFromVendor && (
                        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            Vendor: {item.businessName}
                          </Typography>
                        </Box>
                      )}
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
                            {!isFirstItemFromVendor && (
                              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                {item.businessName}
                              </Typography>
                            )}
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
                  </React.Fragment>
                    );
                  });
                })()}
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
          console.log('🛒 Checkout dialog closed by user');
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
          <Button 
            onClick={() => {
              console.log('🛒 User clicked Cancel in checkout dialog');
              setCheckoutDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              console.log('🛒 ⚠️⚠️⚠️ User clicked "Place Order(s)" button - ORDER WILL BE PLACED ⚠️⚠️⚠️');
              console.log('🛒 Button click event:', e);
              e.preventDefault();
              e.stopPropagation();
              handleOrderSubmit();
            }}
            variant="contained"
            disabled={orderLoading}
            startIcon={orderLoading ? <CircularProgress size={20} /> : <CheckoutIcon />}
          >
            {orderLoading ? 'Creating Orders...' : 'Place Order(s)'}
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
