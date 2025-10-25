import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ChatComponent from '../components/ChatComponent';

const ClientChat: React.FC = () => {
  const { user } = useAuth();

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
          Chat with Vendors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with vendors about your orders and inquiries
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ChatComponent
          currentUserPhone={user.phoneNumber}
          userType="CLIENT"
        />
      </Box>
    </Box>
  );
};

export default ClientChat;
