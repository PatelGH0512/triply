import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '@/lib/api/notifications';
import { useAuthStore } from '@/store/authStore';

export function useNotifications() {
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(userId),
    enabled: !!userId,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';

  return useMutation({
    mutationFn: () => markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
    },
  });
}

export function useUnreadCount() {
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';

  return useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: () => getUnreadCount(userId),
    enabled: !!userId,
  });
}
