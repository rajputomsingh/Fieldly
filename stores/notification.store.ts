// stores/notification.store.ts
import { create } from 'zustand';
import type { Notification } from '@/types/notification.types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isRinging: boolean;
  
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  triggerRing: () => void;
  stopRing: () => void;
  optimisticMarkRead: (id: string) => Notification | undefined;
  rollbackMarkRead: (id: string) => void;
  optimisticMarkAllRead: () => Notification[];
  rollbackMarkAllRead: (previousNotifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isRinging: false,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => {
    const { notifications } = get();
    if (notifications.some(n => n.id === notification.id)) return;

    set({
      notifications: [notification, ...notifications],
      unreadCount: get().unreadCount + 1,
    });
    
    get().triggerRing();
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.isRead ? n.readAt : new Date(),
      })),
      unreadCount: 0,
    }));
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  triggerRing: () => {
    set({ isRinging: true });
    setTimeout(() => set({ isRinging: false }), 3000);
  },

  stopRing: () => set({ isRinging: false }),

  optimisticMarkRead: (id) => {
    const previous = get().notifications.find(n => n.id === id);
    get().markAsRead(id);
    return previous;
  },

  rollbackMarkRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: false, readAt: null } : n
      ),
      unreadCount: state.unreadCount + 1,
    }));
  },

  optimisticMarkAllRead: () => {
    const previous = [...get().notifications];
    get().markAllAsRead();
    return previous;
  },

  rollbackMarkAllRead: (previous) => {
    set({
      notifications: previous,
      unreadCount: previous.filter(n => !n.isRead).length,
    });
  },
}));    