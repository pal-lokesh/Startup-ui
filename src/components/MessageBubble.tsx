import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { MessageBubbleProps } from '../types/chat';

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderName = false,
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSenderIcon = () => {
    return message.senderType === 'CLIENT' ? <PersonIcon /> : <StoreIcon />;
  };

  const getSenderColor = () => {
    return message.senderType === 'CLIENT' ? 'primary' : 'secondary';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-end',
      }}
    >
      {!isOwnMessage && (
        <Avatar
          sx={{
            bgcolor: `${getSenderColor()}.main`,
            width: 32,
            height: 32,
            mr: 1,
          }}
        >
          {getSenderIcon()}
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        {showSenderName && !isOwnMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, mb: 0.5, display: 'block' }}
          >
            {message.senderName}
          </Typography>
        )}
        
        <Paper
          elevation={2}
          sx={{
            p: 2,
            bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
            color: isOwnMessage ? 'white' : 'text.primary',
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            position: 'relative',
          }}
        >
          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
            {message.message}
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              {formatTime(message.createdAt)}
            </Typography>
            
            {isOwnMessage && (
              <Box sx={{ ml: 1 }}>
                {message.isRead ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.7rem',
                    }}
                  >
                    ✓✓
                  </Typography>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.7rem',
                    }}
                  >
                    ✓
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Paper>
        
        {message.messageType !== 'TEXT' && (
          <Chip
            label={message.messageType}
            size="small"
            color={getSenderColor() as any}
            sx={{ mt: 0.5, ml: 1 }}
          />
        )}
      </Box>
      
      {isOwnMessage && (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 32,
            height: 32,
            ml: 1,
          }}
        >
          <PersonIcon />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
