import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
            dayIds.forEach((id) =>
              queryClient.invalidateQueries({ queryKey: ['activities', id] }),
            );
          }
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, dayIds.join(',')]);
}
