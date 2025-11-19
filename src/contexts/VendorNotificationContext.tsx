import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { Notification } from '../types/notification';

interface VendorNotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const VendorNotificationContext = createContext<VendorNotificationContextType | undefined>(undefined);

export const VendorNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track notifications that have been optimistically marked as read
  const pendingReadNotificationsRef = useRef<Set<number>>(new Set());

  // Only provide notifications for VENDOR users
  const isVendor = user?.userType === 'VENDOR';

  const refreshNotifications = useCallback(async () => {
    if (!isVendor || !user?.phoneNumber) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch notifications and count in parallel
      const [notificationsData, count] = await Promise.all([
        notificationService.getNotificationsByVendor(user.phoneNumber),
        notificationService.getNotificationCount(user.phoneNumber),
      ]);
      
      // Sort by date, newest first
      const sortedNotifications = notificationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Merge server data with optimistic updates
      setNotifications(prev => {
        const prevMap = new Map(prev.map(n => [n.notificationId, n]));
        const pendingSet = pendingReadNotificationsRef.current;
        
        const merged: Notification[] = sortedNotifications.map((serverNotif: Notification) => {
          const localNotif = prevMap.get(serverNotif.notificationId);
          // If we optimistically marked it as read, keep it as read even if server says unread
          if (localNotif?.isRead && !serverNotif.isRead && pendingSet.has(serverNotif.notificationId)) {
            return { ...serverNotif, isRead: true };
          }
          // Otherwise, trust server state
          return serverNotif;
        });
        
        // Calculate unread count based on merged data
        const mergedUnreadCount = merged.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(mergedUnreadCount);
        
        // Remove from pending set if server confirms it's read
        sortedNotifications.forEach((notif: Notification) => {
          if (notif.isRead) {
            pendingReadNotificationsRef.current.delete(notif.notificationId);
          }
        });
        
        return merged;
      });
    } catch (err: any) {
      console.error('Error fetching vendor notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [isVendor, user]);

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
      // Mark as read on server
      await notificationService.markAsRead(notificationId);

      // Refresh after a delay to sync with server
      setTimeout(async () => {
        try {
          await refreshNotifications();
        } catch (refreshErr) {
          console.error('Error refreshing after mark as read:', refreshErr);
        }
      }, 1000);
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
    if (!isVendor || !user?.phoneNumber) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Mark all as read on server
      await notificationService.markAllAsRead(user.phoneNumber);

      // Refresh to ensure sync with server
      await refreshNotifications();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Revert optimistic update on error
      await refreshNotifications();
      throw err;
    }
  }, [isVendor, user, refreshNotifications]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (isVendor) {
      refreshNotifications();

      // Refresh every 10 seconds to keep in sync
      const interval = setInterval(refreshNotifications, 10000);

      return () => clearInterval(interval);
    } else {
      // Clear notifications for non-vendor users
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [refreshNotifications, isVendor]);

  return (
    <VendorNotificationContext.Provider
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
    </VendorNotificationContext.Provider>
  );
};

export const useVendorNotifications = () => {
  const context = useContext(VendorNotificationContext);
  if (context === undefined) {
    throw new Error('useVendorNotifications must be used within a VendorNotificationProvider');
  }
  return context;
};

