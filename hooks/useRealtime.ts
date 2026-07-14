import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification } from '@/types';

export function useRealtime(
  channel: string,
  table: string,
  filter: string | undefined,
  callback: (payload: unknown) => void,
) {
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table, filter },
        callback,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, table, filter, callback]);
}

export function useTripRealtime(tripId: string, dayIds: string[]) {
  const queryClient = useQueryClient();
  const dayIdsRef = useRef<string[]>(dayIds);

  useEffect(() => {
    dayIdsRef.current = dayIds;
  });

  useEffect(() => {
    if (!tripId) return;

    const filter = `trip_id=eq.${tripId}`;

    const channel = supabase
      .channel(`trip-realtime-${tripId}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'activities', filter },
        (payload: any) => {
          const dayId = payload?.new?.day_id ?? payload?.old?.day_id;
          if (dayId) {
            queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
          } else {
            dayIdsRef.current.forEach((id) =>
              queryClient.invalidateQueries({ queryKey: ['activities', id] }),
            );
          }
          queryClient.invalidateQueries({ queryKey: ['itineraryPins', tripId] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'packing_list_items', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['packing', tripId] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'packing_list_checks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['packingChecks'] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'documents', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents', tripId] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'activity_votes' },
        (payload: any) => {
          const activityId = payload?.new?.activity_id ?? payload?.old?.activity_id;
          if (activityId) {
            queryClient.invalidateQueries({ queryKey: ['votes', activityId] });
          }
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'expenses', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
          queryClient.invalidateQueries({ queryKey: ['tripSummary', tripId] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'expense_splits' },
        (payload: any) => {
          const expenseId = payload?.new?.expense_id ?? payload?.old?.expense_id;
          if (expenseId) {
            queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);
}

export function useNotificationsRealtime(userId: string) {
  const queryClient = useQueryClient();
  const { addNotification, incrementUnread, showToast } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;

    const channelName = `notifications-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notification = payload.new as Notification;
          addNotification(notification);
          incrementUnread();
          showToast(notification);
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
