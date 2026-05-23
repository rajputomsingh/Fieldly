// services/notifications/realtimeService.ts
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';
import type { Notification } from '@/types/notification.types';

type SubscriptionCallback = (notification: Notification) => void;

interface Subscription {
  channel: Channel;
  unsubscribe: () => void;
}

class RealtimeService {
  private pusher: Pusher | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private lastNotification: Notification | null = null;
  private listeners: Set<SubscriptionCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not configured');
      return;
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth'
    });

    this.pusher.connection.bind('connected', () => {
      console.log('Connected to realtime service');
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Disconnected from realtime service');
    });

    this.pusher.connection.bind('error', (err: unknown) => {
      console.error('Realtime service error:', err);
    });
  }

  subscribeToUser(userId: string, onNotification: SubscriptionCallback): Subscription {
    const channelName = `private-user-${userId}`;
    
    if (!this.pusher) {
      console.warn('Pusher not initialized');
      return { channel: {} as Channel, unsubscribe: () => {} };
    }

    if (this.subscriptions.has(channelName)) {
      const existing = this.subscriptions.get(channelName)!;
      this.listeners.add(onNotification);
      return existing;
    }

    const channel = this.pusher.subscribe(channelName);
    
    channel.bind('new-notification', (data: Notification) => {
      this.lastNotification = data;
      this.listeners.forEach(listener => listener(data));
      onNotification(data);
    });

    const subscription: Subscription = {
      channel,
      unsubscribe: () => {
        this.listeners.delete(onNotification);
        if (this.listeners.size === 0) {
          this.pusher?.unsubscribe(channelName);
          this.subscriptions.delete(channelName);
        }
      },
    };

    this.subscriptions.set(channelName, subscription);
    this.listeners.add(onNotification);

    return subscription;
  }

  isConnected(): boolean {
    return this.pusher?.connection.state === 'connected';
  }

  getLastNotification(): Notification | null {
    return this.lastNotification;
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.subscriptions.clear();
      this.listeners.clear();
    }
  }
}

export const realtimeService = new RealtimeService();