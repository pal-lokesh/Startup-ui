import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  ShoppingCart as OrderIcon,
  Person as CustomerIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Notification } from '../types/notification';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (notificationId: number) => void;
  onDelete: (notificationId: number) => void;
  onViewOrder?: (orderId: number) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onViewOrder,
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return <OrderIcon color="primary" />;
      case 'ORDER_UPDATED':
        return <NotificationIcon color="info" />;
      case 'ORDER_CANCELLED':
        return <NotificationIcon color="error" />;
      case 'ORDER_DELIVERED':
        return <ReadIcon color="success" />;
      default:
        return <NotificationIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return 'primary';
      case 'ORDER_UPDATED':
        return 'info';
      case 'ORDER_CANCELLED':
        return 'error';
      case 'ORDER_DELIVERED':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        opacity: notification.isRead ? 0.7 : 1,
        borderLeft: !notification.isRead ? '4px solid #1976d2' : '4px solid transparent',
        '&:hover': {
          boxShadow: 3,
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getNotificationIcon(notification.notificationType)}
            <Typography variant="h6" component="h3">
              {notification.message}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={notification.notificationType.replace('_', ' ')} 
              color={getNotificationColor(notification.notificationType) as any}
              size="small"
            />
            <Chip 
              label={notification.isRead ? 'Read' : 'Unread'} 
              color={!notification.isRead ? 'warning' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CustomerIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Customer: {notification.customerName}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {notification.deliveryAddress}
              </Typography>
            </Box>
            
            {notification.deliveryDate && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {notification.notificationType === 'STOCK_AVAILABLE' 
                    ? `Available Date: ${new Date(notification.deliveryDate).toLocaleDateString()}`
                    : `Delivery: ${new Date(notification.deliveryDate).toLocaleDateString()}`}
                </Typography>
              </Box>
            )}

            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {formatPrice(notification.totalAmount)}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(notification.createdAt)}
            </Typography>
            
            <Box display="flex" gap={1}>
              {!notification.isRead && (
                <Tooltip title="Mark as read">
                  <IconButton 
                    size="small" 
                    onClick={() => onMarkAsRead(notification.notificationId)}
                    color="primary"
                  >
                    <ReadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Delete notification">
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(notification.notificationId)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {onViewOrder && (
                <Tooltip title="View order">
                  <IconButton 
                    size="small" 
                    onClick={() => onViewOrder(notification.orderId)}
                    color="info"
                  >
                    <OrderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
