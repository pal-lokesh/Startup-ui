export interface Chat {
  chatId: number;
  clientPhone: string;
  vendorPhone: string;
  businessId: string;
  businessName: string;
  orderId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherParticipantName?: string;
  otherParticipantPhone?: string;
}

export interface ChatMessage {
  messageId: number;
  chatId: number;
  senderPhone: string;
  senderType: 'CLIENT' | 'VENDOR';
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  senderName: string;
}

export interface SendMessageRequest {
  chatId: number;
  message: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
}

export interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: number;
  currentUserPhone: string;
}

export interface ChatWindowProps {
  chat: Chat;
  messages: ChatMessage[];
  currentUserPhone: string;
  onSendMessage: (message: string) => void;
  onMarkAsRead: () => void;
  isLoading?: boolean;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showSenderName?: boolean;
}
