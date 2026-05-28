import { useEffect } from 'react';
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
