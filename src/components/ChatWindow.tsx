import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { ChatWindowProps } from '../types/chat';
import MessageBubble from './MessageBubble';
import chatService from '../services/chatService';

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUserPhone,
  onSendMessage,
  onMarkAsRead,
  isLoading = false,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [canVendorSend, setCanVendorSend] = useState(true);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when chat is opened
    onMarkAsRead();
    
    // Check if vendor can send messages
    checkVendorPermissions();
  }, [chat.chatId, onMarkAsRead]);

  const checkVendorPermissions = async () => {
    const isVendor = chat.vendorPhone === currentUserPhone;
    if (!isVendor) return;

    setCheckingPermissions(true);
    try {
      const canSend = await chatService.canVendorSendMessage(chat.chatId, currentUserPhone);
      setCanVendorSend(canSend);
    } catch (error) {
      console.error('Error checking vendor permissions:', error);
      setCanVendorSend(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isSending) {
      const isVendor = chat.vendorPhone === currentUserPhone;
      
      // Check vendor restrictions
      if (isVendor && !canVendorSend) {
        alert('You can only reply to client messages. Please wait for the client to send the first message.');
        return;
      }
      
      setIsSending(true);
      try {
        await onSendMessage(newMessage.trim());
        setNewMessage('');
        
        // Refresh vendor permissions after sending message
        if (isVendor) {
          checkVendorPermissions();
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        if (error instanceof Error && error.message.includes('Vendors can only reply')) {
          alert(error.message);
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipantInfo = () => {
    const isClient = chat.clientPhone === currentUserPhone;
    return {
      phone: isClient ? chat.vendorPhone : chat.clientPhone,
      name: isClient ? chat.otherParticipantName || 'Vendor' : chat.otherParticipantName || 'Client',
      type: isClient ? 'VENDOR' : 'CLIENT',
    };
  };

  const otherParticipant = getOtherParticipantInfo();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderRadius: 0,
        }}
      >
        <IconButton
          onClick={() => window.history.back()}
          sx={{ display: { xs: 'block', sm: 'none' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Avatar
          sx={{
            bgcolor: otherParticipant.type === 'VENDOR' ? 'secondary.main' : 'primary.main',
          }}
        >
          {otherParticipant.type === 'VENDOR' ? <StoreIcon /> : <PersonIcon />}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" noWrap>
            {otherParticipant.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {chat.businessName}
          </Typography>
        </Box>
        
        {chat.orderId && (
          <Chip
            label={`Order #${chat.orderId}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Paper>

      <Divider />

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
        }}
      >
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            color="text.secondary"
          >
            <Typography variant="h6" gutterBottom>
              No messages yet
            </Typography>
            <Typography variant="body2">
              Start a conversation with {otherParticipant.name}
            </Typography>
          </Box>
        ) : (
          <Box>
            {messages.map((message) => (
              <MessageBubble
                key={message.messageId}
                message={message}
                isOwnMessage={message.senderPhone === currentUserPhone}
                showSenderName={false}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Message Input */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
        }}
      >
        {/* Vendor Restriction Alert */}
        {chat.vendorPhone === currentUserPhone && !canVendorSend && (
          <Alert 
            severity="info" 
            icon={<BlockIcon />}
            sx={{ mb: 2 }}
            action={
              <Button 
                size="small" 
                onClick={checkVendorPermissions}
                disabled={checkingPermissions}
              >
                {checkingPermissions ? 'Checking...' : 'Refresh'}
              </Button>
            }
          >
            You can only reply to client messages. Please wait for the client to send the first message.
          </Alert>
        )}
        
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              chat.vendorPhone === currentUserPhone && !canVendorSend
                ? "Waiting for client to send first message..."
                : `Message ${otherParticipant.name}...`
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending || (chat.vendorPhone === currentUserPhone && !canVendorSend)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || (chat.vendorPhone === currentUserPhone && !canVendorSend)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow;
