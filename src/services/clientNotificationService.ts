import { Notification } from '../types/notification';

const API_BASE_URL = 'http://localhost:8080/api/client-notifications';

class ClientNotificationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getNotificationsByClient(clientPhone: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/client/${clientPhone}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching client notifications:', error);
      throw error;
    }
  }

  async getNotificationCount(clientPhone: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/client/${clientPhone}/unread-count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${notificationId}/mark-read`, {
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

  async markAllAsRead(clientPhone: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/client/${clientPhone}/mark-all-read`, {
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

  async getRecentNotifications(clientPhone: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/client/${clientPhone}/recent`, {
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
}

const clientNotificationService = new ClientNotificationService();
export default clientNotificationService;
