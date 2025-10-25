import { Chat, ChatMessage, SendMessageRequest } from '../types/chat';

const API_BASE_URL = 'http://localhost:8080/api/chat';

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createOrGetChat(
    clientPhone: string,
    vendorPhone: string,
    businessId: string,
    businessName: string,
    orderId?: number
  ): Promise<Chat> {
    const params = new URLSearchParams({
      clientPhone,
      vendorPhone,
      businessId,
      businessName,
    });
    
    if (orderId) {
      params.append('orderId', orderId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/create?${params}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to create or get chat');
    }

    return response.json();
  }

  async getChatsByUser(phoneNumber: string): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/user/${phoneNumber}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return response.json();
  }

  async getChatsByClient(clientPhone: string): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/client/${clientPhone}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch client chats');
    }

    return response.json();
  }

  async getChatsByVendor(vendorPhone: string): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor chats');
    }

    return response.json();
  }

  async getChatsByBusiness(businessId: string): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch business chats');
    }

    return response.json();
  }

  async sendMessage(request: SendMessageRequest, senderPhone: string): Promise<ChatMessage> {
    const params = new URLSearchParams({ senderPhone });
    
    const response = await fetch(`${API_BASE_URL}/message?${params}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async getMessages(chatId: number, phoneNumber: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams({ phoneNumber });
    
    const response = await fetch(`${API_BASE_URL}/${chatId}/messages?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async markMessagesAsRead(chatId: number, phoneNumber: string): Promise<void> {
    const params = new URLSearchParams({ phoneNumber });
    
    const response = await fetch(`${API_BASE_URL}/${chatId}/read?${params}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  }

  async getUnreadCount(chatId: number, phoneNumber: string): Promise<number> {
    const params = new URLSearchParams({ phoneNumber });
    
    const response = await fetch(`${API_BASE_URL}/${chatId}/unread-count?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get unread count');
    }

    return response.json();
  }

  async getTotalUnreadCount(phoneNumber: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/user/${phoneNumber}/total-unread`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get total unread count');
    }

    return response.json();
  }

  async canVendorSendMessage(chatId: number, vendorPhone: string): Promise<boolean> {
    const params = new URLSearchParams({ vendorPhone });
    
    const response = await fetch(`${API_BASE_URL}/${chatId}/can-vendor-send?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check vendor send permission');
    }

    return response.json();
  }
}

export default new ChatService();
