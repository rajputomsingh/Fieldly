// hooks/notifications/useRealtimeNotifications.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/stores/notification.store';
import { realtimeService } from '@/services/notifications/realtimeService';
import { toast } from 'sonner';
import type { Notification } from '@/types/notification.types';

interface NotificationPages {
  pages: Array<{
    notifications: Notification[];
  }>;
  pageParams: number[];
}

export function useRealtimeNotifications(
  userId: string, 
  onNotification?: (notification: Notification) => void
) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const handleNotification = useCallback((notification: Notification) => {
    addNotification(notification);

    queryClient.setQueryData<NotificationPages>(
      ['notifications', userId],
      (oldData) => {
        if (!oldData?.pages) return oldData;
        
        const isDuplicate = oldData.pages.some(page => 
          page.notifications.some(n => n.id === notification.id)
        );
        
        if (isDuplicate) return oldData;

        const newPages = [...oldData.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            notifications: [notification, ...newPages[0].notifications],
          };
        }
        
        return { ...oldData, pages: newPages };
      }
    );

    queryClient.invalidateQueries({ 
      queryKey: ['notification-count', userId],
      exact: true,
    });

    toast(notification.title, {
      description: notification.message,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        },
      } : undefined,
    });

    onNotification?.(notification);
  }, [userId, queryClient, addNotification, onNotification]);

  useEffect(() => {
    if (!userId || subscriptionRef.current) return;
    
    subscriptionRef.current = realtimeService.subscribeToUser(userId, handleNotification);

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [userId, handleNotification]);

  return {
    isConnected: realtimeService.isConnected(),
  };
}