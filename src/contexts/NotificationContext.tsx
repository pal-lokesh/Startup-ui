import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import clientNotificationService from '../services/clientNotificationService';
import { Notification } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track notifications that have been optimistically marked as read (using ref to avoid dependency issues)
  const pendingReadNotificationsRef = useRef<Set<number>>(new Set());

  // Only provide notifications for CLIENT users
  const isClient = user?.userType === 'CLIENT';

  const refreshNotifications = useCallback(async () => {
    if (!isClient || !user?.phoneNumber) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
            // Use the optimized endpoint that returns both notifications and count
            const response = await fetch(
              `http://localhost:8080/api/client-notifications/client/${user.phoneNumber}/with-count`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                cache: 'no-cache', // Ensure fresh data on every request
              }
            );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const serverNotifications = data.notifications || [];
      
      // Debug: Log what we receive from server
      console.log('🔔 Received notifications from server:', serverNotifications.map((n: Notification) => ({
        id: n.notificationId,
        isRead: n.isRead,
        isReadType: typeof n.isRead
      })));
      
      // Merge server data with optimistic updates
      // If a notification was optimistically marked as read but server says unread,
      // keep it as read (server might not have processed yet)
      setNotifications(prev => {
        const prevMap = new Map(prev.map(n => [n.notificationId, n]));
        const pendingSet = pendingReadNotificationsRef.current;
        
        const merged: Notification[] = serverNotifications.map((serverNotif: Notification) => {
          const localNotif = prevMap.get(serverNotif.notificationId);
          // If we optimistically marked it as read, keep it as read even if server says unread
          // (server might not have processed the update yet)
          if (localNotif?.isRead && !serverNotif.isRead && pendingSet.has(serverNotif.notificationId)) {
            return { ...serverNotif, isRead: true };
          }
          // Otherwise, trust server state
          return serverNotif;
        });
        
        // Debug: Log merged result
        console.log('🔔 Merged notifications:', merged.map((n: Notification) => ({
          id: n.notificationId,
          isRead: n.isRead,
          isReadType: typeof n.isRead
        })));
        
        // Calculate unread count based on merged data
        const mergedUnreadCount = merged.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(mergedUnreadCount);
        
        // Remove from pending set if server confirms it's read
        serverNotifications.forEach((notif: Notification) => {
          if (notif.isRead) {
            pendingReadNotificationsRef.current.delete(notif.notificationId);
          }
        });
        
        return merged;
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      // Fallback to separate calls if the new endpoint fails
      try {
        const [notificationsData, count] = await Promise.all([
          clientNotificationService.getNotificationsByClient(user.phoneNumber),
          clientNotificationService.getNotificationCount(user.phoneNumber),
        ]);
        setNotifications(notificationsData);
        setUnreadCount(count);
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [isClient, user]);

  const markAsRead = useCallback(async (notificationId: number) => {
    // Check if notification is already read to avoid unnecessary updates
    const notification = notifications.find(n => n.notificationId === notificationId);
    const isAlreadyRead = notification?.isRead || false;

    // Optimistic update - mark as read immediately for better UX (only if not already read)
    if (!isAlreadyRead) {
      // Add to pending set to track optimistic updates
      pendingReadNotificationsRef.current.add(notificationId);
      
      setNotifications(prev =>
        prev.map(n =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      // Mark as read on server (backend handles already-read case)
      await clientNotificationService.markNotificationAsRead(notificationId);
      console.log('Successfully marked notification as read:', notificationId);

      // Refresh after a delay to sync with server
      // The merge logic will preserve the optimistic update if server hasn't processed yet
      setTimeout(async () => {
        try {
          await refreshNotifications();
        } catch (refreshErr) {
          console.error('Error refreshing after mark as read:', refreshErr);
        }
      }, 1000); // Increased delay to ensure server has processed
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Remove from pending set on error
      pendingReadNotificationsRef.current.delete(notificationId);
      // Revert optimistic update on error by refreshing
      if (!isAlreadyRead) {
        await refreshNotifications();
      }
      throw err;
    }
  }, [refreshNotifications, notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!isClient || !user?.phoneNumber) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Mark all as read on server
      await clientNotificationService.markAllAsRead(user.phoneNumber);

      // Refresh to ensure sync with server
      await refreshNotifications();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Revert optimistic update on error
      await refreshNotifications();
      throw err;
    }
  }, [isClient, user, refreshNotifications]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (isClient) {
      refreshNotifications();

      // Refresh every 10 seconds to keep in sync
      const interval = setInterval(refreshNotifications, 10000);

      return () => clearInterval(interval);
    } else {
      // Clear notifications for non-client users
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [refreshNotifications, isClient]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

