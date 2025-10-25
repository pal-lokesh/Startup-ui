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
  StepContent,
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
import orderService from '../services/orderService';
import clientNotificationService from '../services/clientNotificationService';
import OrderHistory from '../components/OrderHistory';
import OrderSummary from '../components/OrderSummary';
import OrderStatusTracker from '../components/OrderStatusTracker';
import { Order } from '../types/cart';
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
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (user?.phoneNumber) {
      fetchOrders();
      fetchNotifications();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.getOrdersByUserId(user.phoneNumber);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      const notificationsData = await clientNotificationService.getNotificationsByClient(user.phoneNumber);
      setNotifications(notificationsData);
      const unreadCount = notificationsData.filter(n => !n.isRead).length;
      setUnreadNotificationCount(unreadCount);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    if (newValue === 1) { // Orders tab
      fetchOrders();
    } else if (newValue === 2) { // Track Orders tab
      fetchOrders();
    } else if (newValue === 3) { // Notifications tab
      fetchNotifications();
    }
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
      { label: 'Order Placed', completed: true },
      { label: 'Order Confirmed', completed: order.status !== 'PENDING' },
      { label: 'Preparing', completed: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status) },
      { label: 'Ready for Delivery', completed: ['READY', 'DELIVERED'].includes(order.status) },
      { label: 'Delivered', completed: order.status === 'DELIVERED' },
    ];
    
    if (order.status === 'CANCELLED') {
      return steps.map(step => ({ ...step, completed: false }));
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
            fetchNotifications();
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
              orders.length > 0 
                ? `My Orders (${orders.length})` 
                : "My Orders"
            } 
          />
          <Tab label="Track Orders" />
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
        <OrderSummary orders={orders} />
      </TabPanel>

      {/* Orders Tab */}
      <TabPanel value={activeTab} index={1}>
        <OrderHistory 
          orders={orders}
          loading={loading}
          onRefresh={() => {
            fetchOrders();
            fetchNotifications();
          }}
          onViewOrder={handleViewOrder}
        />
      </TabPanel>

      {/* Track Orders Tab */}
      <TabPanel value={activeTab} index={2}>
        {orders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No orders to track
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Place an order to start tracking its progress!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item xs={12} key={order.orderId}>
                <OrderStatusTracker 
                  order={order} 
                  showDetails={true}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={activeTab} index={3}>
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
          <List>
            {notifications.map((notification) => (
              <ListItem key={notification.notificationId} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                    <NotificationIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.message}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Order #{notification.orderId} • {notification.businessName}
                      </Typography>
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
          Order #{selectedOrder?.orderId} Details
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
              <Stepper orientation="vertical">
                {getOrderSteps(selectedOrder).map((step, index) => (
                  <Step key={index} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
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
