import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { Order } from '../types/cart';
import { getOrderDisplayTitle } from '../utils/orderDisplay';
import RatingComponent from './RatingComponent';
import { ratingService } from '../services/ratingService';
import { Rating } from '../types/rating';
import { useAuth } from '../contexts/AuthContext';

interface OrderHistoryProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewOrder?: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  loading = false,
  onRefresh,
  onViewOrder,
}) => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  
  // Rating state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedItemForRating, setSelectedItemForRating] = useState<{
    itemId: string;
    itemType: 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH';
    itemName: string;
    businessId: string;
    orderId: number;
  } | null>(null);
  const [existingRatings, setExistingRatings] = useState<Map<string, Rating>>(new Map());
  const [checkingRatings, setCheckingRatings] = useState(false);

  // Ensure orders is always an array
  const ordersArray = Array.isArray(orders) ? orders : [];
  
  // Log orders count for debugging
  useEffect(() => {
    console.log(`OrderHistory: Displaying ${ordersArray.length} orders`);
    if (ordersArray.length > 0) {
      console.log('Order IDs:', ordersArray.map(o => o.orderId).join(', '));
    }
  }, [ordersArray.length]);

  // Check ratings for delivered orders
  useEffect(() => {
    const checkRatings = async () => {
      if (!user || user.userType !== 'CLIENT' || ordersArray.length === 0) return;
      
      const deliveredOrders = ordersArray.filter(order => order.status === 'DELIVERED');
      if (deliveredOrders.length === 0) return;
      
      setCheckingRatings(true);
      const ratingsMap = new Map<string, Rating>();
      
      try {
        // Check ratings for all items in delivered orders
        for (const order of deliveredOrders) {
          if (order.orderItems) {
            for (const item of order.orderItems) {
              const key = `${item.itemId}-${item.itemType}`;
              try {
                const rating = await ratingService.getClientRatingForItem(
                  item.itemId,
                  item.itemType.toUpperCase() as 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH'
                );
                if (rating) {
                  ratingsMap.set(key, rating);
                }
              } catch (err) {
                // Item not rated yet, that's fine
                console.log(`No rating found for ${item.itemName}`);
              }
            }
          }
        }
        setExistingRatings(ratingsMap);
      } catch (err) {
        console.error('Error checking ratings:', err);
      } finally {
        setCheckingRatings(false);
      }
    };
    
    checkRatings();
  }, [ordersArray, user]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
    if (onViewOrder) {
      onViewOrder(order);
    }
  };

  const handleCloseOrderDetail = () => {
    setOrderDetailOpen(false);
    setSelectedOrder(null);
  };

  const handleRateProduct = (item: any, orderId: number) => {
    setSelectedItemForRating({
      itemId: item.itemId,
      itemType: item.itemType.toUpperCase() as 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
      itemName: item.itemName,
      businessId: item.businessId,
      orderId: orderId,
    });
    setRatingDialogOpen(true);
  };

  const handleRatingSubmitted = (rating: Rating) => {
    // Update the existing ratings map
    const key = `${rating.itemId}-${rating.itemType}`;
    setExistingRatings(prev => new Map(prev).set(key, rating));
    
    // Refresh orders to show updated state
    if (onRefresh) {
      onRefresh();
    }
    
    setRatingDialogOpen(false);
    setSelectedItemForRating(null);
  };

  const hasItemBeenRated = (itemId: string, itemType: string): boolean => {
    const key = `${itemId}-${itemType}`;
    return existingRatings.has(key);
  };

  const getItemRating = (itemId: string, itemType: string): Rating | null => {
    const key = `${itemId}-${itemType}`;
    return existingRatings.get(key) || null;
  };

  // Get delivered orders with unrated items
  const getDeliveredOrdersWithUnratedItems = () => {
    return ordersArray.filter(order => {
      if (order.status !== 'DELIVERED' || !order.orderItems) return false;
      return order.orderItems.some(item => !hasItemBeenRated(item.itemId, item.itemType));
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'primary';
      case 'READY': return 'success';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ShoppingCartIcon />;
      case 'CONFIRMED': return <CheckCircleIcon />;
      case 'PREPARING': return <RefreshIcon />;
      case 'READY': return <ShippingIcon />;
      case 'DELIVERED': return <CheckCircleIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return <ShoppingCartIcon />;
    }
  };

  const getOrderSteps = (order: Order) => {
    const steps = [
      { 
        label: 'Order Placed', 
        completed: true,
        description: `Order placed on ${new Date(order.orderDate).toLocaleString()}`,
        icon: <ShoppingCartIcon />
      },
      { 
        label: 'Order Confirmed', 
        completed: order.status !== 'PENDING',
        description: order.status !== 'PENDING' ? 'Order confirmed by vendor' : 'Waiting for confirmation',
        icon: <CheckCircleIcon />
      },
      { 
        label: 'Preparing', 
        completed: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status),
        description: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status) ? 'Your order is being prepared' : 'Waiting to start preparation',
        icon: <RefreshIcon />
      },
      { 
        label: 'Ready for Delivery', 
        completed: ['READY', 'DELIVERED'].includes(order.status),
        description: ['READY', 'DELIVERED'].includes(order.status) ? 'Order is ready for delivery' : 'Order is being prepared',
        icon: <ShippingIcon />
      },
      { 
        label: 'Delivered', 
        completed: order.status === 'DELIVERED',
        description: order.status === 'DELIVERED' ? 'Order has been delivered' : 'Order is ready for delivery',
        icon: <CheckCircleIcon />
      },
    ];
    
    if (order.status === 'CANCELLED') {
      return steps.map(step => ({ ...step, completed: false, description: 'Order was cancelled' }));
    }
    
    return steps;
  };

  const getOrderProgress = (order: Order) => {
    const steps = getOrderSteps(order);
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusMessage = (order: Order) => {
    switch (order.status) {
      case 'PENDING':
        return 'Your order is pending confirmation from the vendor.';
      case 'CONFIRMED':
        return 'Your order has been confirmed and will be prepared soon.';
      case 'PREPARING':
        return 'Your order is being prepared. You will be notified when it\'s ready.';
      case 'READY':
        return 'Your order is ready for delivery. It will be delivered soon.';
      case 'DELIVERED':
        return 'Your order has been delivered successfully. Thank you for your business!';
      case 'CANCELLED':
        return 'Your order has been cancelled.';
      default:
        return 'Order status is being updated.';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Box textAlign="center">
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading order history...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (ordersArray.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No orders yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start exploring businesses and place your first order!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Order History Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Order History ({ordersArray.length} {ordersArray.length === 1 ? 'order' : 'orders'})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track all your orders and their current status
          </Typography>
        </Box>
        {onRefresh && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Rating Prompt Section - Show delivered orders with unrated items */}
      {user?.userType === 'CLIENT' && (() => {
        const ordersWithUnratedItems = getDeliveredOrdersWithUnratedItems();
        if (ordersWithUnratedItems.length > 0) {
          return (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={<StarIcon />}
            >
              <AlertTitle>Rate Your Products</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You have delivered orders with products that haven't been rated yet. Please share your experience!
              </Typography>
              {ordersWithUnratedItems.map((order) => (
                <Box key={order.orderId} sx={{ mb: 2, mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {getOrderDisplayTitle(order)} - Delivered on {new Date(order.orderDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {order.orderItems?.map((item, index) => {
                      const isRated = hasItemBeenRated(item.itemId, item.itemType);
                      if (isRated) return null;
                      
                      return (
                        <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {item.itemName} ({item.itemType})
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<RateReviewIcon />}
                            onClick={() => handleRateProduct(item, order.orderId)}
                            disabled={checkingRatings}
                          >
                            Rate Product
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Alert>
          );
        }
        return null;
      })()}

      {/* Orders List */}
      <Box>
        {ordersArray.map((order) => (
          <Card
            key={order.orderId}
            sx={{ 
              mb: 3,
              borderLeft: `4px solid ${
                order.status === 'DELIVERED' ? '#4caf50' : 
                order.status === 'CANCELLED' ? '#f44336' : 
                order.status === 'READY' ? '#2196f3' :
                order.status === 'PREPARING' ? '#ff9800' :
                order.status === 'CONFIRMED' ? '#00bcd4' :
                '#ffc107'
              }`
            }}
          >
            <CardContent>
              {/* Order Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main', width: 56, height: 56 }}>
                    {getStatusIcon(order.status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {getOrderDisplayTitle(order)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order Date: {formatDate(order.orderDate)} • {order.orderItems?.length || 0} items
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order ID: #{order.orderId}
                    </Typography>
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status) as any}
                    icon={getStatusIcon(order.status)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ₹{order.totalAmount}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                {/* Order Progress */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getOrderProgress(order)} 
                      sx={{ height: 10, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="body1" color="text.secondary" fontWeight="medium">
                      {Math.round(getOrderProgress(order))}% Complete
                    </Typography>
                  </Box>
                  
                  <Stepper 
                    orientation="horizontal" 
                    sx={{ 
                      mt: 2,
                      mb: 3,
                      '& .MuiStepLabel-root': {
                        flexDirection: 'column',
                        alignItems: 'center',
                        '& .MuiStepLabel-label': {
                          marginTop: 1,
                          textAlign: 'center'
                        }
                      }
                    }}
                  >
                    {getOrderSteps(order).map((step, index) => (
                      <Step key={index} completed={step.completed} active={!step.completed && index === getOrderSteps(order).findIndex(s => !s.completed)}>
                        <StepLabel 
                          StepIconComponent={() => (
                            <Avatar sx={{ 
                              bgcolor: step.completed ? 'success.main' : 'grey.300',
                              width: 48,
                              height: 48,
                              border: step.completed ? '3px solid #4caf50' : '3px solid #e0e0e0',
                              boxShadow: step.completed ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'
                            }}>
                              {step.icon}
                            </Avatar>
                          )}
                          sx={{
                            '& .MuiStepLabel-label': {
                              fontSize: '0.875rem',
                              fontWeight: step.completed ? 'bold' : 'normal',
                              color: step.completed ? 'success.main' : 'text.primary',
                              mt: 1
                            }
                          }}
                        >
                          {step.label}
                        </StepLabel>
                        <Box sx={{ mt: 1, textAlign: 'center', px: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            {step.description}
                          </Typography>
                          {step.completed && (
                            <Chip 
                              label="✓" 
                              size="small" 
                              color="success" 
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Step>
                    ))}
                  </Stepper>
                </Grid>

                {/* Order Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Details
                  </Typography>
                  
                  <Alert 
                    severity={order.status === 'CANCELLED' ? 'error' : 
                             order.status === 'DELIVERED' ? 'success' : 'info'}
                    sx={{ mb: 2 }}
                  >
                    <AlertTitle>
                      {order.status === 'DELIVERED' ? 'Order Delivered' : 
                       order.status === 'CANCELLED' ? 'Order Cancelled' : 
                       'Order in Progress'}
                    </AlertTitle>
                    {getOrderStatusMessage(order)}
                  </Alert>

                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                              <StoreIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Business"
                            secondary={order.orderItems?.[0]?.businessName || 'N/A'}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                              <LocationIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Delivery Address"
                            secondary={order.deliveryAddress}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                              <TimeIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Delivery Date"
                            secondary={order.deliveryDate}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>

                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
                              <PhoneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Customer Phone"
                            secondary={order.customerPhone || 'N/A'}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>

                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
                              <EmailIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Customer Email"
                            secondary={order.customerEmail || 'N/A'}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>
                        
                        {order.specialNotes && (
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'error.light', width: 40, height: 40 }}>
                                <ReceiptIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Special Notes"
                              secondary={order.specialNotes}
                              primaryTypographyProps={{ fontWeight: 'medium' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewOrder(order)}
                    >
                      View Full Details
                    </Button>
                  </Box>
                </Grid>

                {/* Order Items Summary */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Order Items ({order.orderItems?.length || 0})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell><strong>Item</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell align="right"><strong>Quantity</strong></TableCell>
                          <TableCell align="right"><strong>Unit Price</strong></TableCell>
                          <TableCell align="right"><strong>Total</strong></TableCell>
                          {order.status === 'DELIVERED' && user?.userType === 'CLIENT' && (
                            <TableCell align="center"><strong>Rate</strong></TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.orderItems?.map((item, index) => {
                          const isRated = hasItemBeenRated(item.itemId, item.itemType);
                          const existingRating = getItemRating(item.itemId, item.itemType);
                          
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  {item.imageUrl && (
                                    <Avatar 
                                      src={item.imageUrl} 
                                      variant="rounded"
                                      sx={{ width: 48, height: 48 }}
                                    />
                                  )}
                                  <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                      {item.itemName}
                                    </Typography>
                                    {item.businessName && (
                                      <Typography variant="caption" color="text.secondary">
                                        {item.businessName}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label={item.itemType} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="medium">
                                  {item.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1">
                                  ₹{item.itemPrice}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="bold" color="primary">
                                  ₹{item.itemPrice * item.quantity}
                                </Typography>
                              </TableCell>
                              {order.status === 'DELIVERED' && user?.userType === 'CLIENT' && (
                                <TableCell align="center">
                                  {isRated ? (
                                    <Chip 
                                      label="Rated" 
                                      color="success" 
                                      size="small"
                                      icon={<CheckCircleIcon />}
                                    />
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      size="small"
                                      startIcon={<StarIcon />}
                                      onClick={() => handleRateProduct(item, order.orderId)}
                                      disabled={checkingRatings}
                                    >
                                      Rate
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell colSpan={order.status === 'DELIVERED' && user?.userType === 'CLIENT' ? 5 : 4} align="right">
                            <Typography variant="h6" color="text.secondary">
                              Total Amount:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h5" color="primary" fontWeight="bold">
                              ₹{order.totalAmount}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Order Detail Dialog */}
      <Dialog 
        open={orderDetailOpen} 
        onClose={handleCloseOrderDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: getStatusColor(selectedOrder?.status || '') + '.main' }}>
              {getStatusIcon(selectedOrder?.status || '')}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {`${getOrderDisplayTitle(selectedOrder || undefined)} Details`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedOrder && formatDate(selectedOrder.orderDate)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Customer Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              <ShoppingCartIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Name"
                            secondary={selectedOrder.customerName}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.light' }}>
                              <PhoneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Phone"
                            secondary={selectedOrder.customerPhone}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.light' }}>
                              <EmailIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Email"
                            secondary={selectedOrder.customerEmail}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Delivery Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.light' }}>
                              <LocationIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Address"
                            secondary={selectedOrder.deliveryAddress}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              <TimeIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Delivery Date"
                            secondary={selectedOrder.deliveryDate}
                          />
                        </ListItem>
                        {selectedOrder.specialNotes && (
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'info.light' }}>
                                <ReceiptIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary="Special Notes"
                              secondary={selectedOrder.specialNotes}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Order Progress
              </Typography>
              <Stepper 
                orientation="horizontal" 
                sx={{ 
                  mb: 3,
                  '& .MuiStepLabel-root': {
                    flexDirection: 'column',
                    alignItems: 'center',
                    '& .MuiStepLabel-label': {
                      marginTop: 1,
                      textAlign: 'center'
                    }
                  }
                }}
              >
                {getOrderSteps(selectedOrder).map((step, index) => (
                  <Step 
                    key={index} 
                    completed={step.completed}
                    active={!step.completed && index === getOrderSteps(selectedOrder).findIndex(s => !s.completed)}
                  >
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{ 
                          bgcolor: step.completed ? 'success.main' : 'grey.300',
                          width: 48,
                          height: 48,
                          border: step.completed ? '3px solid #4caf50' : '3px solid #e0e0e0',
                          boxShadow: step.completed ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'
                        }}>
                          {step.icon}
                        </Avatar>
                      )}
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontSize: '0.875rem',
                          fontWeight: step.completed ? 'bold' : 'normal',
                          color: step.completed ? 'success.main' : 'text.primary',
                          mt: 1
                        }
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <Box sx={{ mt: 1, textAlign: 'center', px: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        {step.description}
                      </Typography>
                      {step.completed && (
                        <Chip 
                          label="✓" 
                          size="small" 
                          color="success" 
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      {selectedOrder.status === 'DELIVERED' && user?.userType === 'CLIENT' && (
                        <TableCell align="center">Rate</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.orderItems?.map((item, index) => {
                      const isRated = hasItemBeenRated(item.itemId, item.itemType);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              {item.imageUrl && (
                                <Avatar 
                                  src={item.imageUrl} 
                                  variant="rounded"
                                  sx={{ width: 48, height: 48 }}
                                />
                              )}
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {item.itemName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.businessName}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.itemType} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.itemPrice}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              ₹{item.itemPrice * item.quantity}
                            </Typography>
                          </TableCell>
                          {selectedOrder.status === 'DELIVERED' && user?.userType === 'CLIENT' && (
                            <TableCell align="center">
                              {isRated ? (
                                <Chip 
                                  label="Rated" 
                                  color="success" 
                                  size="small"
                                  icon={<CheckCircleIcon />}
                                />
                              ) : (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<StarIcon />}
                                  onClick={() => handleRateProduct(item, selectedOrder.orderId)}
                                  disabled={checkingRatings}
                                >
                                  Rate
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={selectedOrder.status === 'DELIVERED' && user?.userType === 'CLIENT' ? 5 : 4} align="right">
                        <Typography variant="h6" color="primary">
                          Total Amount:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ₹{selectedOrder.totalAmount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetail}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      {selectedItemForRating && (
        <RatingComponent
          open={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
            setSelectedItemForRating(null);
          }}
          itemId={selectedItemForRating.itemId}
          itemType={selectedItemForRating.itemType}
          itemName={selectedItemForRating.itemName}
          businessId={selectedItemForRating.businessId}
          orderId={selectedItemForRating.orderId.toString()}
          existingRating={getItemRating(selectedItemForRating.itemId, selectedItemForRating.itemType) || undefined}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Box>
  );
};

export default OrderHistory;
