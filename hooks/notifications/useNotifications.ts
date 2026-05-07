// hooks/notifications/useNotifications.ts
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notifications/notificationService';
import { useNotificationStore } from '@/stores/notification.store';
import type { PaginatedNotifications } from '@/types/notification.types';

interface UseNotificationsOptions {
  userId: string;
  enabled?: boolean;
  limit?: number;
}

export function useNotifications({ 
  userId, 
  enabled = false,
  limit = 20 
}: UseNotificationsOptions) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<PaginatedNotifications>({
    queryKey: ['notifications', userId],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;
      return notificationService.getNotifications({ page, limit });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    },
  });

  const notifications = data?.pages?.flatMap(page => page.notifications) ?? [];

  return {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
}

export function useNotificationCount(userId: string) {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const { refetch } = useQuery({
    queryKey: ['notification-count', userId],
    queryFn: async () => {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result.count);
      return result;
    },
    enabled: !!userId,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const storeCount = useNotificationStore((state) => state.unreadCount);

  return {
    unreadCount: storeCount,
    refetch,
  };
}