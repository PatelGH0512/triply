import { supabase } from '../supabase';
import { Notification } from '@/types';

export async function getNotifications(userId: string): Promise<Notification[]> {
  return [];
}

export async function markNotificationRead(notificationId: string): Promise<void> {}

export async function markAllNotificationsRead(userId: string): Promise<void> {}

export async function deleteNotification(notificationId: string): Promise<void> {}
