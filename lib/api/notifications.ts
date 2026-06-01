import { supabase } from '../supabase';
import { Notification } from '@/types';

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Notification[];
}

export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  return markAsRead(notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  return markAllAsRead(userId);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', notificationId);
}
