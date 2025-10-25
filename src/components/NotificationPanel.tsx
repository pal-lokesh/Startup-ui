import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Notification } from '../types/notification';
import NotificationCard from './NotificationCard';
import notificationService from '../services/notificationService';

interface NotificationPanelProps {
  vendorPhone: string;
  onViewOrder?: (orderId: number) => void;
  onRefresh?: () => void;
}

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
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  vendorPhone,
  onViewOrder,
  onRefresh,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allNotifications, unread, count] = await Promise.all([
        notificationService.getNotificationsByVendor(vendorPhone),
        notificationService.getUnreadNotificationsByVendor(vendorPhone),
        notificationService.getNotificationCount(vendorPhone),
      ]);
      
      setNotifications(allNotifications);
      setUnreadNotifications(unread);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorPhone) {
      fetchNotifications();
    }
  }, [vendorPhone]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(vendorPhone);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getCurrentNotifications = () => {
    return activeTab === 0 ? unreadNotifications : notifications;
  };

  const getNotificationStats = () => {
    const newOrders = notifications.filter(n => n.notificationType === 'ORDER_CONFIRMED').length;
    const updates = notifications.filter(n => ['ORDER_PREPARING', 'ORDER_READY', 'ORDER_SHIPPED', 'ORDER_DELIVERED'].includes(n.notificationType)).length;
    const cancellations = notifications.filter(n => n.notificationType === 'ORDER_CANCELLED').length;
    
    return { newOrders, updates, cancellations };
  };

  const stats = getNotificationStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Notifications
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh notifications">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Notification Stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2}>
            <Chip 
              label={`${unreadCount} Unread`} 
              color="warning" 
              icon={<NotificationIcon />}
            />
            <Chip 
              label={`${stats.newOrders} New Orders`} 
              color="primary" 
            />
            <Chip 
              label={`${stats.updates} Updates`} 
              color="info" 
            />
            <Chip 
              label={`${stats.cancellations} Cancelled`} 
              color="error" 
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total: {notifications.length} notifications
          </Typography>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label={`Unread (${unreadCount})`} 
            id="notification-tab-0"
            aria-controls="notification-tabpanel-0"
          />
          <Tab 
            label="All" 
            id="notification-tab-1"
            aria-controls="notification-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {unreadNotifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No unread notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up! New notifications will appear here.
            </Typography>
          </Box>
        ) : (
          <Box>
            {unreadNotifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onViewOrder={onViewOrder}
              />
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {notifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Notifications will appear here when customers place orders.
            </Typography>
          </Box>
        ) : (
          <Box>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onViewOrder={onViewOrder}
              />
            ))}
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default NotificationPanel;
