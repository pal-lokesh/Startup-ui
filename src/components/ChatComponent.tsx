import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Chat, ChatMessage } from '../types/chat';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import chatService from '../services/chatService';

interface ChatComponentProps {
  currentUserPhone: string;
  userType: 'CLIENT' | 'VENDOR';
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  currentUserPhone,
  userType,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [newChatData, setNewChatData] = useState({
    clientPhone: '',
    vendorPhone: '',
    businessId: '',
    businessName: '',
    orderId: '',
  });

  useEffect(() => {
    fetchChats();
  }, [currentUserPhone, userType]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.chatId);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let chatsData: Chat[];
      if (userType === 'CLIENT') {
        chatsData = await chatService.getChatsByClient(currentUserPhone);
      } else {
        chatsData = await chatService.getChatsByVendor(currentUserPhone);
      }
      
      setChats(chatsData);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(err.message || 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      setMessagesLoading(true);
      const messagesData = await chatService.getMessages(chatId, currentUserPhone);
      setMessages(messagesData);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedChat) return;

    try {
      const messageData = await chatService.sendMessage(
        {
          chatId: selectedChat.chatId,
          message,
          messageType: 'TEXT',
        },
        currentUserPhone
      );

      setMessages(prev => [...prev, messageData]);
      
      // Update the chat in the list with new last message
      setChats(prev => 
        prev.map(chat => 
          chat.chatId === selectedChat.chatId 
            ? { ...chat, lastMessage: message, lastMessageTime: new Date().toISOString() }
            : chat
        )
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      if (err.message && err.message.includes('Vendors can only reply')) {
        setError('You can only reply to client messages. Please wait for the client to send the first message.');
      } else {
        setError(err.message || 'Failed to send message');
      }
    }
  };

  const handleMarkAsRead = async () => {
    if (!selectedChat) return;

    try {
      await chatService.markMessagesAsRead(selectedChat.chatId, currentUserPhone);
      
      // Update messages to mark as read
      setMessages(prev => 
        prev.map(msg => ({ ...msg, isRead: true, readAt: new Date().toISOString() }))
      );
      
      // Update chat unread count
      setChats(prev => 
        prev.map(chat => 
          chat.chatId === selectedChat.chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleCreateChat = async () => {
    try {
      const chat = await chatService.createOrGetChat(
        newChatData.clientPhone,
        newChatData.vendorPhone,
        newChatData.businessId,
        newChatData.businessName,
        newChatData.orderId ? parseInt(newChatData.orderId) : undefined
      );

      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat);
      setCreateChatOpen(false);
      setNewChatData({
        clientPhone: '',
        vendorPhone: '',
        businessId: '',
        businessName: '',
        orderId: '',
      });
    } catch (err: any) {
      console.error('Error creating chat:', err);
      setError(err.message || 'Failed to create chat');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchChats}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {userType === 'CLIENT' ? 'My Conversations' : 'Business Conversations'}
          </Typography>
          <Box display="flex" gap={1}>
            {/* Only show "New Chat" button for clients - vendors can only reply to existing conversations */}
            {userType === 'CLIENT' && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateChatOpen(true)}
                size="small"
              >
                New Chat
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchChats}
              size="small"
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Chat List */}
          <Grid item xs={12} md={4} sx={{ borderRight: 1, borderColor: 'divider' }}>
            <ChatList
              chats={chats}
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChat?.chatId}
              currentUserPhone={currentUserPhone}
            />
          </Grid>

          {/* Chat Window */}
          <Grid item xs={12} md={8}>
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                messages={messages}
                currentUserPhone={currentUserPhone}
                onSendMessage={handleSendMessage}
                onMarkAsRead={handleMarkAsRead}
                isLoading={messagesLoading}
              />
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="text.secondary"
              >
                <Typography variant="h6" gutterBottom>
                  Select a conversation
                </Typography>
                <Typography variant="body2">
                  Choose a chat from the list to start messaging
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Create Chat Dialog */}
      <Dialog open={createChatOpen} onClose={() => setCreateChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Client Phone"
              value={newChatData.clientPhone}
              onChange={(e) => setNewChatData(prev => ({ ...prev, clientPhone: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Vendor Phone"
              value={newChatData.vendorPhone}
              onChange={(e) => setNewChatData(prev => ({ ...prev, vendorPhone: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Business ID"
              value={newChatData.businessId}
              onChange={(e) => setNewChatData(prev => ({ ...prev, businessId: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Business Name"
              value={newChatData.businessName}
              onChange={(e) => setNewChatData(prev => ({ ...prev, businessName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Order ID (Optional)"
              value={newChatData.orderId}
              onChange={(e) => setNewChatData(prev => ({ ...prev, orderId: e.target.value }))}
              fullWidth
              type="number"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChatOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateChat}
            variant="contained"
            disabled={!newChatData.clientPhone || !newChatData.vendorPhone || !newChatData.businessId || !newChatData.businessName}
          >
            Create Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatComponent;
