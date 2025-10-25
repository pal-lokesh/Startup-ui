import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Store as StoreIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { ChatListProps } from '../types/chat';

const ChatList: React.FC<ChatListProps> = ({
  chats,
  onChatSelect,
  selectedChatId,
  currentUserPhone,
}) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const truncateMessage = (message?: string, maxLength: number = 50) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const getOtherParticipantInfo = (chat: any) => {
    const isClient = chat.clientPhone === currentUserPhone;
    return {
      phone: isClient ? chat.vendorPhone : chat.clientPhone,
      name: chat.otherParticipantName || (isClient ? 'Vendor' : 'Client'),
      type: isClient ? 'VENDOR' : 'CLIENT',
    };
  };

  if (chats.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No conversations yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a conversation with a vendor or client
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <List sx={{ p: 0 }}>
        {chats.map((chat, index) => {
          const otherParticipant = getOtherParticipantInfo(chat);
          const isSelected = selectedChatId === chat.chatId;
          
          return (
            <React.Fragment key={chat.chatId}>
              <ListItem
                disablePadding
                sx={{
                  bgcolor: isSelected ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => onChatSelect(chat)}
                  sx={{
                    py: 2,
                    px: 2,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: otherParticipant.type === 'VENDOR' ? 'secondary.main' : 'primary.main',
                      }}
                    >
                      {otherParticipant.type === 'VENDOR' ? <StoreIcon /> : <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="subtitle1"
                          fontWeight={chat.unreadCount && chat.unreadCount > 0 ? 'bold' : 'normal'}
                          noWrap
                          sx={{ flex: 1, mr: 1 }}
                        >
                          {otherParticipant.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(chat.lastMessageTime)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{
                            fontWeight: chat.unreadCount && chat.unreadCount > 0 ? 'bold' : 'normal',
                            mb: 0.5,
                          }}
                        >
                          {truncateMessage(chat.lastMessage)}
                        </Typography>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {chat.businessName}
                          </Typography>
                          
                          <Box display="flex" gap={1} alignItems="center">
                            {chat.orderId && (
                              <Chip
                                label={`#${chat.orderId}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                            
                            {chat.unreadCount && chat.unreadCount > 0 && (
                              <Chip
                                label={chat.unreadCount}
                                size="small"
                                color="primary"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 20,
                                  minWidth: 20,
                                  '& .MuiChip-label': {
                                    px: 1,
                                  },
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              
              {index < chats.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default ChatList;
