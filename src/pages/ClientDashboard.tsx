import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
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
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useLocation } from 'react-router-dom';
import orderService from '../services/orderService';
import OrderHistory from '../components/OrderHistory';
import OrderStatusTracker from '../components/OrderStatusTracker';
import OrderSummary from '../components/OrderSummary';
import { Order } from '../types/cart';
import { getOrderDisplayTitle } from '../utils/orderDisplay';
import { Notification } from '../types/notification';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount: unreadNotificationCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  // Ensure orders is always an array
  const ordersArray = Array.isArray(orders) ? orders : [];

  // Handle navigation state to set active tab
  useEffect(() => {
    const state = location.state as { activeTab?: number; orderId?: number; notificationId?: number } | null;
    if (state?.activeTab !== undefined) {
      setActiveTab(state.activeTab);
      
      // If navigating to My Orders tab (index 1) from a notification, refresh orders
      // but don't auto-open the dialog - let user see all orders first
      if (state.activeTab === 1) {
        fetchOrders();
      }
      
      // Don't auto-open order detail dialog - let user see all orders first
      // They can click on a specific order from the list if they want details
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.phoneNumber) {
      fetchOrders();
    }
  }, [user]);

  // NotificationContext handles all notification fetching and syncing
  // No need for separate useEffect hooks here

  const fetchOrders = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.getOrdersByUserId(user.phoneNumber);
      
      // Ensure ordersData is always an array
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      
      console.log(`Setting ${ordersArray.length} orders in state`);
      
      // Always set orders, even if empty array
      setOrders(ordersArray);
      
      if (ordersArray.length === 0) {
        console.log('No orders found for user:', user.phoneNumber);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      // Set empty array on error to prevent stale data
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Always mark as read when notification is clicked/opened
    // The backend will handle if it's already read
    try {
      await markAsRead(notification.notificationId);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Continue to order details even if marking as read fails
    }
    
    // If notification has an orderId, switch to My Orders tab to show all orders
    // User can then click on the specific order if they want details
    if (notification.orderId) {
      setActiveTab(1); // Switch to My Orders tab (index 1)
      // Refresh orders to ensure we have the latest data
      fetchOrders();
      // Don't open the dialog automatically - let user see all orders first
      // They can click on the specific order from the list if needed
    } else {
      // If no orderId, switch to notifications tab
      setActiveTab(2);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Close order detail dialog when switching tabs to ensure all orders are visible
    if (orderDetailOpen) {
      setOrderDetailOpen(false);
      setSelectedOrder(null);
    }
    
    if (newValue === 1) { // Orders tab
      fetchOrders();
    }
    // Notifications tab doesn't need manual refresh - NotificationContext handles it
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleCloseOrderDetail = () => {
    setOrderDetailOpen(false);
    setSelectedOrder(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Orders Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Welcome back, {user?.firstName}! Track your orders and get updates.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchOrders();
            refreshNotifications();
          }}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab 
            label={
              ordersArray.length > 0 
                ? `My Orders (${ordersArray.length})` 
                : "My Orders"
            } 
          />
          <Tab 
            label={
              unreadNotificationCount > 0 
                ? `Notifications (${unreadNotificationCount})` 
                : "Notifications"
            } 
          />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        <OrderSummary orders={ordersArray} />
      </TabPanel>

      {/* Orders Tab */}
      <TabPanel value={activeTab} index={1}>
        {ordersArray.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                Live Order Status ({ordersArray.length} {ordersArray.length === 1 ? 'order' : 'orders'})
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  fetchOrders();
                  refreshNotifications();
                }}
                disabled={loading}
              >
                Refresh Status
              </Button>
            </Box>
            <Grid container spacing={3}>
              {ordersArray.map((order) => (
                <Grid item xs={12} key={order.orderId}>
                  <OrderStatusTracker 
                    order={order} 
                    showDetails={false}
                    onCancel={() => {
                      fetchOrders();
                      refreshNotifications();
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4 }} />
          </Box>
        )}
        <OrderHistory 
          orders={ordersArray}
          loading={loading}
          onRefresh={() => {
            fetchOrders();
            refreshNotifications();
          }}
          onViewOrder={handleViewOrder}
        />
      </TabPanel>

      {/* Notifications Tab (Separate) */}
      <TabPanel value={activeTab} index={2}>
        {notifications.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <NotificationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll receive updates about your orders here.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Notifications
                </Typography>
                {unreadNotificationCount > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {unreadNotificationCount} unread {unreadNotificationCount === 1 ? 'notification' : 'notifications'}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={1}>
                {unreadNotificationCount > 0 && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={async () => {
                      try {
                        await markAllAsRead();
                      } catch (err: any) {
                        console.error('Error marking all notifications as read:', err);
                        setError(err.message || 'Failed to mark all notifications as read');
                      }
                    }}
                  >
                    Mark All as Read
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={refreshNotifications}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            <List>
            {notifications.map((notification) => (
              <ListItem 
                key={notification.notificationId} 
                divider
                onClick={() => handleNotificationClick(notification)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  backgroundColor: !notification.isRead ? 'action.selected' : 'transparent'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                    <NotificationIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        color: notification.isRead ? 'text.primary' : 'primary.main'
                      }}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {notification.businessName}
                      </Typography>
                      {notification.notificationType === 'STOCK_AVAILABLE' && notification.deliveryDate && (
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                          Available Date: {new Date(notification.deliveryDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  {!notification.isRead && (
                    <Chip label="New" color="primary" size="small" />
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          </Box>
        )}
      </TabPanel>

      {/* Order Detail Dialog */}
      <Dialog 
        open={orderDetailOpen} 
        onClose={handleCloseOrderDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {`${getOrderDisplayTitle(selectedOrder || undefined)} Details`}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.customerName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={selectedOrder.status} 
                    color={getStatusColor(selectedOrder.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₹{selectedOrder.totalAmount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedOrder.orderDate).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Address
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.deliveryAddress}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.deliveryDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Special Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.specialNotes || 'None'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              {selectedOrder.orderItems?.map((item, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">
                          {item.itemName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.itemType} • {item.businessName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.quantity} × ₹{item.itemPrice}
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary">
                        ₹{item.itemPrice * item.quantity}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}

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

export default ClientDashboard;
