export interface Notification {
  notificationId: number;
  clientPhone: string;
  businessId: string;
  businessName: string;
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  deliveryDate: string;
  deliveryAddress: string;
  notificationType: 'ORDER_CONFIRMED' | 'ORDER_PREPARING' | 'ORDER_READY' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'STOCK_AVAILABLE';
  isRead: boolean;
  message: string;
  createdAt: string;
}

export interface NotificationCount {
  count: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  newOrders: number;
  updates: number;
  cancellations: number;
}
