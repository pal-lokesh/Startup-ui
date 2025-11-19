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
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useVendorNotifications } from '../contexts/VendorNotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import orderService from '../services/orderService';
import { BusinessService } from '../services/businessService';
import { Order } from '../types/cart';
import { Notification } from '../types/notification';
import { Business } from '../types';
import { getOrderDisplayTitle } from '../utils/orderDisplay';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const VendorOrdersNotifications: React.FC = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount: unreadNotificationCount,
    loading: loadingNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    refreshNotifications,
  } = useVendorNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = Notifications, 1 = Orders
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<number | null>(null);
  const [orderToScrollTo, setOrderToScrollTo] = useState<string | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);

  useEffect(() => {
    if (user?.phoneNumber) {
      fetchData();
    }
  }, [user]);

  // Handle navigation from bell icon with notification ID
  useEffect(() => {
    const state = location.state as { activeTab?: number; notificationId?: number; orderId?: string } | null;
    // Set active tab from state if provided, otherwise default to notifications tab if notificationId exists
    if (state?.activeTab !== undefined) {
      setActiveTab(state.activeTab);
    } else if (state?.notificationId) {
      // Switch to notifications tab
      setActiveTab(0);
    }
    
    if (state?.notificationId) {
      // Refresh notifications to ensure they're loaded
      refreshNotifications();
      // Highlight the notification
      setHighlightedNotificationId(state.notificationId);
      
      // Scroll to the notification after notifications are loaded
      const scrollToNotification = () => {
        const element = document.getElementById(`notification-${state.notificationId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedNotificationId(null);
          }, 3000);
          return true;
        }
        return false;
      };
      
      // Try scrolling immediately if notifications are already loaded
      if (notifications.length > 0 && scrollToNotification()) {
        // Clear the state to prevent re-triggering
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // Wait for notifications to load, then scroll
        const checkInterval = setInterval(() => {
          if (notifications.length > 0 && scrollToNotification()) {
            clearInterval(checkInterval);
            // Clear the state to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          navigate(location.pathname, { replace: true, state: {} });
        }, 5000);
      }
    }
  }, [location.state, navigate, location.pathname, notifications.length, refreshNotifications]);

  // Scroll to the order after orders are updated
  useEffect(() => {
    if (orderToScrollTo && orders.length > 0 && !loadingOrders) {
      // Immediately restore saved position to prevent jump to top
      if (savedScrollPosition !== null) {
        window.scrollTo({ top: savedScrollPosition - 100, behavior: 'auto' });
      }
      
      // Then try to find and scroll to the element with multiple attempts
      const scrollToOrder = () => {
        const orderElement = document.getElementById(`order-${orderToScrollTo}`);
        if (orderElement) {
          // Calculate absolute position correctly
          const rect = orderElement.getBoundingClientRect();
          const absoluteElementTop = rect.top + window.pageYOffset;
          
          // Scroll to the element
          window.scrollTo({ 
            top: absoluteElementTop - 100,
            behavior: 'auto'
          });
          
          // Clear the scroll tracking
          setOrderToScrollTo(null);
          setSavedScrollPosition(null);
        } else if (savedScrollPosition !== null) {
          // If element not found, restore saved position
          window.scrollTo({ top: savedScrollPosition - 100, behavior: 'auto' });
          setOrderToScrollTo(null);
          setSavedScrollPosition(null);
        }
      };
      
      // Try multiple times with increasing delays to ensure DOM is ready
      setTimeout(() => scrollToOrder(), 0);
      setTimeout(() => scrollToOrder(), 50);
      setTimeout(() => scrollToOrder(), 100);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToOrder();
        });
      });
    }
  }, [orders, loadingOrders, orderToScrollTo, savedScrollPosition]);

  const fetchData = async () => {
    if (!user?.phoneNumber) return;
    
    setLoading(true);
    try {
      // Fetch businesses and refresh notifications
      const businessesData = await BusinessService.getBusinessesByVendorPhoneNumber(user.phoneNumber);
      await refreshNotifications();
      
      setBusinesses(businessesData);
      
      // If vendor has only one business, automatically select it and load orders
      if (businessesData.length === 1) {
        setSelectedBusiness(businessesData[0]);
        setBusinessId(businessesData[0].businessId);
        await fetchOrders(businessesData[0].businessId);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (businessIdParam: string) => {
    if (!businessIdParam) return;
    
    try {
      setLoadingOrders(true);
      setError(null);
      const ordersData = await orderService.getOrdersByBusinessId(businessIdParam);
      setOrders(ordersData);
      setBusinessId(businessIdParam);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Get the order element's position BEFORE updating
      const orderElement = document.getElementById(`order-${orderId}`);
      let elementPosition: number | null = null;
      
      if (orderElement) {
        const rect = orderElement.getBoundingClientRect();
        elementPosition = rect.top + window.pageYOffset;
      }
      
      // Save both scroll position and element position
      const currentScrollPosition = window.scrollY;
      setSavedScrollPosition(elementPosition !== null ? elementPosition : currentScrollPosition);
      
      // Store the order ID to scroll to after refresh
      setOrderToScrollTo(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      if (businessId) {
        await fetchOrders(businessId);
        // The useEffect will handle scrolling to the order after orders are loaded
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
      setOrderToScrollTo(null); // Clear on error
      setSavedScrollPosition(null);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // If switching to Orders tab, fetch orders if we have a business
    if (newValue === 1) {
      // If we have a selected business but no orders loaded yet, fetch them
      if (selectedBusiness && !businessId) {
        setBusinessId(selectedBusiness.businessId);
        fetchOrders(selectedBusiness.businessId);
      } 
      // If we already have orders loaded, refresh them
      else if (businessId) {
        fetchOrders(businessId);
      }
      // If vendor has only one business and nothing is selected, auto-select it
      else if (businesses.length === 1 && !selectedBusiness) {
        const business = businesses[0];
        setSelectedBusiness(business);
        setBusinessId(business.businessId);
        fetchOrders(business.businessId);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Orders & Notifications
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            if (activeTab === 0) {
              refreshNotifications();
            } else if (activeTab === 1 && businessId) {
              fetchOrders(businessId);
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label={
              unreadNotificationCount > 0 
                ? `Notifications (${unreadNotificationCount})` 
                : "Notifications"
            } 
          />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {/* Notifications Tab Content */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h2">
              Notifications
              {unreadNotificationCount > 0 && (
                <Chip 
                  label={`${unreadNotificationCount} Unread`} 
                  color="error" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <Box display="flex" gap={1}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={refreshNotifications}
                disabled={loadingNotifications}
              >
                Refresh
              </Button>
              {unreadNotificationCount > 0 && (
                <Button 
                  variant="contained" 
                  size="small"
                  color="primary"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </Box>
          </Box>
          
          {loadingNotifications ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No notifications yet
              </Typography>
            </Paper>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  id={`notification-${notification.notificationId}`}
                  key={notification.notificationId} 
                  divider
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    },
                    backgroundColor: highlightedNotificationId === notification.notificationId 
                      ? 'action.selected' 
                      : !notification.isRead 
                        ? 'action.selected' 
                        : 'transparent',
                    borderLeft: highlightedNotificationId === notification.notificationId
                      ? '4px solid #ff9800'
                      : !notification.isRead 
                        ? '4px solid #1976d2' 
                        : 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: highlightedNotificationId === notification.notificationId
                      ? '0 4px 8px rgba(0,0,0,0.2)'
                      : 'none',
                  }}
                  onClick={() => {
                    // Just mark as read, don't switch tabs
                    if (!notification.isRead) {
                      handleMarkNotificationAsRead(notification.notificationId);
                    }
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
                        {notification.orderId && (
                          <Typography variant="body2" color="text.secondary">
                            {notification.businessName}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!notification.isRead && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkNotificationAsRead(notification.notificationId);
                        }}
                      >
                        Mark Read
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Orders Tab Content */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Typography variant="h5" component="h2">
              Orders
            </Typography>
            {businesses.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Business</InputLabel>
                <Select
                  value={selectedBusiness?.businessId || ''}
                  label="Select Business"
                  onChange={(e) => {
                    const business = businesses.find(b => b.businessId === e.target.value);
                    if (business) {
                      setSelectedBusiness(business);
                      setBusinessId(business.businessId);
                      fetchOrders(business.businessId);
                    }
                  }}
                >
                  {businesses.map((business) => (
                    <MenuItem key={business.businessId} value={business.businessId}>
                      {business.businessName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {selectedBusiness && (
              <Typography variant="body2" color="text.secondary">
                {selectedBusiness.businessName}
              </Typography>
            )}
          </Box>
          {businessId && (
            <Button 
              variant="outlined" 
              onClick={() => fetchOrders(businessId)}
              disabled={loadingOrders}
            >
              Refresh Orders
            </Button>
          )}
        </Box>

        {!businessId ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {businesses.length === 0 ? 'No businesses found' : 'Select a business to view orders'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {businesses.length === 0 
                ? 'Please create a business first from your dashboard.'
                : businesses.length > 1
                ? 'Select a business from the dropdown above or click on a notification to view orders for that business.'
                : 'Click on a notification to view orders for that business.'
              }
            </Typography>
            {businesses.length === 0 && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate('/vendor-dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
          </Paper>
        ) : loadingOrders ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No orders yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Orders from customers will appear here once they place them.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item xs={12} key={order.orderId} id={`order-${order.orderId}`}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="h6">
                            {getOrderDisplayTitle(order)}
                          </Typography>
                          {new Date(order.orderDate).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                            <Chip 
                              label="NEW" 
                              color="primary" 
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Customer: {order.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {order.customerEmail}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {order.customerPhone}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status) as any}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" color="primary">
                          ₹{order.totalAmount}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Order Items:
                    </Typography>
                    {order.orderItems?.map((item, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box>
                          <Typography variant="body2">
                            {item.itemName} ({item.itemType})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty: {item.quantity} × ₹{item.itemPrice}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{item.itemPrice * item.quantity}
                        </Typography>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Order Date: {new Date(order.orderDate).toLocaleString()}
                        </Typography>
                        {order.deliveryDate && (
                          <Typography variant="body2" color="text.secondary">
                            Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}
                          </Typography>
                        )}
                        {order.specialNotes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {order.specialNotes}
                          </Typography>
                        )}
                      </Box>
                      <Box display="flex" gap={1}>
                        {order.status === 'PENDING' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'CONFIRMED')}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'PREPARING')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'READY')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'READY' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'DELIVERED')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'CANCELLED')}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        </Box>
      )}
    </Box>
  );
};

export default VendorOrdersNotifications;

