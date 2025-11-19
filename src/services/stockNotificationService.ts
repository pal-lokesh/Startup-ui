import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT authentication interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface StockNotification {
  notificationId: number;
  userId: string;
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH';
  itemName: string;
  businessId: string;
  requestedDate?: string; // Optional: specific date the user wants to be notified about
  notified: boolean;
  createdAt: string;
  notifiedAt?: string;
}

class StockNotificationService {
  /**
   * Subscribe to stock notifications for an item
   */
  async subscribe(
    userId: string,
    itemId: string,
    itemType: 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
    itemName: string,
    businessId: string,
    requestedDate?: string // Optional: specific date for date-wise availability
  ): Promise<StockNotification> {
    try {
      const response = await apiClient.post('/stock-notifications/subscribe', {
        userId,
        itemId,
        itemType,
        itemName,
        businessId,
        requestedDate, // Include date if provided
      });
      return response.data;
    } catch (error: any) {
      console.error('Error subscribing to stock notification:', error);
      throw new Error(error.response?.data?.error || 'Failed to subscribe to notifications');
    }
  }

  /**
   * Unsubscribe from stock notifications for an item
   */
  async unsubscribe(
    userId: string,
    itemId: string,
    itemType: 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH'
  ): Promise<void> {
    try {
      await apiClient.delete('/stock-notifications/unsubscribe', {
        params: { userId, itemId, itemType },
      });
    } catch (error: any) {
      console.error('Error unsubscribing from stock notification:', error);
      throw new Error(error.response?.data?.error || 'Failed to unsubscribe from notifications');
    }
  }

  /**
   * Check if user is subscribed to notifications for an item
   */
  async isSubscribed(
    userId: string,
    itemId: string,
    itemType: 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
    requestedDate?: string // Optional: specific date to check subscription for
  ): Promise<boolean> {
    try {
      const params: any = { userId, itemId, itemType };
      if (requestedDate) {
        params.requestedDate = requestedDate;
      }
      const response = await apiClient.get('/stock-notifications/check', { params });
      return response.data.subscribed || false;
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<StockNotification[]> {
    try {
      const response = await apiClient.get(`/stock-notifications/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user subscriptions:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch subscriptions');
    }
  }
}

const stockNotificationService = new StockNotificationService();
export default stockNotificationService;

