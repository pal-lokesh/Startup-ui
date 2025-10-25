import { Notification } from '../types/notification';

const API_BASE_URL = 'http://localhost:8080/api/notifications';

class VendorNotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getNotificationsByVendor(vendorPhone: string): Promise<Notification[]> {
    const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor notifications');
    }

    return response.json();
  }

  async getNotificationStats(vendorPhone: string): Promise<{
    total: number;
    unread: number;
    newOrders: number;
    updates: number;
    cancellations: number;
  }> {
    const notifications = await this.getNotificationsByVendor(vendorPhone);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    const stats = {
      total: notifications.length,
      unread: unreadCount,
      newOrders: notifications.filter(n => n.notificationType === 'ORDER_CONFIRMED').length,
      updates: notifications.filter(n => n.notificationType === 'ORDER_PREPARING' || n.notificationType === 'ORDER_READY' || n.notificationType === 'ORDER_SHIPPED').length,
      cancellations: notifications.filter(n => n.notificationType === 'ORDER_CANCELLED').length,
    };

    return stats;
  }

  async markAsRead(notificationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(vendorPhone: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/vendor/${vendorPhone}/read-all`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }
}

export default new VendorNotificationService();
