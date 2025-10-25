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
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Tooltip,
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
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Order } from '../types/cart';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | false>(false);

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

  const handleExpandOrder = (orderId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedOrder(isExpanded ? orderId : false);
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

  if (orders.length === 0) {
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
            Order History
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

      {/* Orders List */}
      <Box>
        {orders.map((order) => (
          <Accordion
            key={order.orderId}
            expanded={expandedOrder === order.orderId}
            onChange={handleExpandOrder(order.orderId)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: order.status === 'DELIVERED' ? 'success.light' : 
                               order.status === 'CANCELLED' ? 'error.light' : 
                               'background.paper',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main' }}>
                    {getStatusIcon(order.status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      Order #{order.orderId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.orderDate)} • {order.orderItems?.length || 0} items
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                    icon={getStatusIcon(order.status)}
                  />
                  <Typography variant="h6" color="primary">
                    ₹{order.totalAmount}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Order Progress */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getOrderProgress(order)} 
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(getOrderProgress(order))}% Complete
                    </Typography>
                  </Box>
                  
                  <Stepper orientation="vertical" sx={{ mt: 2 }}>
                    {getOrderSteps(order).map((step, index) => (
                      <Step key={index} completed={step.completed}>
                        <StepLabel 
                          StepIconComponent={() => (
                            <Avatar sx={{ 
                              bgcolor: step.completed ? 'success.main' : 'grey.300',
                              width: 24,
                              height: 24
                            }}>
                              {step.icon}
                            </Avatar>
                          )}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={step.completed ? 'bold' : 'normal'}>
                              {step.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {step.description}
                            </Typography>
                          </Box>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Grid>

                {/* Order Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
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

                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                          <StoreIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Business"
                        secondary={order.orderItems?.[0]?.businessName || 'N/A'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light', width: 32, height: 32 }}>
                          <LocationIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Delivery Address"
                        secondary={order.deliveryAddress}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}>
                          <TimeIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Delivery Date"
                        secondary={order.deliveryDate}
                      />
                    </ListItem>
                    
                    {order.specialNotes && (
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32 }}>
                            <ReceiptIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Special Notes"
                          secondary={order.specialNotes}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewOrder(order)}
                      size="small"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<TimelineIcon />}
                      onClick={() => handleViewOrder(order)}
                      size="small"
                    >
                      Track Order
                    </Button>
                  </Box>
                </Grid>

                {/* Order Items Summary */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Items ({order.orderItems?.length || 0})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.orderItems?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {item.imageUrl && (
                                  <Avatar 
                                    src={item.imageUrl} 
                                    variant="rounded"
                                    sx={{ width: 32, height: 32 }}
                                  />
                                )}
                                <Typography variant="body2">
                                  {item.itemName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.itemType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.itemPrice}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ₹{item.itemPrice * item.quantity}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
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
                Order #{selectedOrder?.orderId} Details
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
              <Stepper orientation="vertical" sx={{ mb: 3 }}>
                {getOrderSteps(selectedOrder).map((step, index) => (
                  <Step key={index} completed={step.completed}>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{ 
                          bgcolor: step.completed ? 'success.main' : 'grey.300',
                          width: 32,
                          height: 32
                        }}>
                          {step.icon}
                        </Avatar>
                      )}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight={step.completed ? 'bold' : 'normal'}>
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    </StepLabel>
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.orderItems?.map((item, index) => (
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
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
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
    </Box>
  );
};

export default OrderHistory;
