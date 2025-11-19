import { Notification, NotificationCount, NotificationStats } from '../types/notification';

const API_BASE_URL = 'http://localhost:8080/api/notifications';

class NotificationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getNotificationsByVendor(vendorPhone: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-cache', // Ensure fresh data on every request
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadNotificationsByVendor(vendorPhone: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}/unread`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  async getNotificationCount(vendorPhone: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-cache', // Ensure fresh data on every request
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(vendorPhone: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationsByBusiness(businessId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business notifications:', error);
      throw error;
    }
  }

  async getRecentNotifications(vendorPhone: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}/recent`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      throw error;
    }
  }

  async getNotificationStats(vendorPhone: string): Promise<NotificationStats> {
    try {
      const [notifications, unreadCount] = await Promise.all([
        this.getNotificationsByVendor(vendorPhone),
        this.getNotificationCount(vendorPhone)
      ]);

      const stats: NotificationStats = {
        total: notifications.length,
        unread: unreadCount,
        newOrders: notifications.filter(n => n.notificationType === 'ORDER_CONFIRMED').length,
        updates: notifications.filter(n => ['ORDER_PREPARING', 'ORDER_READY', 'ORDER_SHIPPED', 'ORDER_DELIVERED'].includes(n.notificationType)).length,
        cancellations: notifications.filter(n => n.notificationType === 'ORDER_CANCELLED').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
