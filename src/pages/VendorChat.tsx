import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Chip, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ChatComponent from '../components/ChatComponent';
import vendorNotificationService from '../services/vendorNotificationService';

const VendorChat: React.FC = () => {
  const { user } = useAuth();
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    newOrders: 0,
    updates: 0,
    cancellations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotificationStats();
    }
  }, [user]);

  const fetchNotificationStats = async () => {
    try {
      setLoading(true);
      const stats = await vendorNotificationService.getNotificationStats(user!.phoneNumber);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography variant="h6">Please log in to access chat</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chat with Clients
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Communicate with clients about their orders and provide support
        </Typography>
        
        {/* Notification Stats */}
        {!loading && notificationStats.total > 0 && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <Typography variant="h6">Notifications:</Typography>
              <Chip 
                label={`${notificationStats.unread} Unread`} 
                color="error" 
                size="small"
              />
              <Chip 
                label={`${notificationStats.newOrders} New Orders`} 
                color="success" 
                size="small"
              />
              <Chip 
                label={`${notificationStats.updates} Updates`} 
                color="info" 
                size="small"
              />
              {notificationStats.cancellations > 0 && (
                <Chip 
                  label={`${notificationStats.cancellations} Cancellations`} 
                  color="warning" 
                  size="small"
                />
              )}
            </Box>
          </Paper>
        )}
        
        {/* Vendor Restriction Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> You can only reply to client messages. 
            Clients must send the first message before you can respond.
          </Typography>
        </Alert>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ChatComponent
          currentUserPhone={user.phoneNumber}
          userType="VENDOR"
        />
      </Box>
    </Box>
  );
};

export default VendorChat;
