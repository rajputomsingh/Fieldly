// components/shared/notifications/NotificationInitializer.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRealtimeNotifications } from '@/hooks/notifications/useRealtimeNotifications';

export function NotificationInitializer() {
  const { userId } = useAuth();
  useRealtimeNotifications(userId || '');
  return null;
}