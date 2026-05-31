import { supabase } from '../supabase';
import { Activity, Day } from '@/types';

export async function getDays(tripId: string): Promise<Day[]> {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', tripId)
    .order('order', { ascending: true });
  if (error || !data) return [];
  return data as Day[];
}

export async function getActivitiesByDay(dayId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, links:activity_links(*), media:activity_media(*)')
    .eq('day_id', dayId)
    .order('order', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as Activity[];
}

export async function getActivitiesByTrip(tripId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, links:activity_links(*), media:activity_media(*)')
    .eq('trip_id', tripId)
    .order('order', { ascending: true });
  if (error || !data) return [];
  return data as Activity[];
}

export async function createActivity(data: Partial<Activity>): Promise<Activity | null> {
  const { data: result, error } = await supabase
    .from('activities')
    .insert(data)
    .select()
    .single();
  if (error || !result) return null;
  return result as Activity;
}

export async function updateActivity(
  activityId: string,
  data: Partial<Activity>,
): Promise<Activity | null> {
  const { data: result, error } = await supabase
    .from('activities')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', activityId)
    .select()
    .single();
  if (error || !result) return null;
  return result as Activity;
}

export async function deleteActivity(activityId: string): Promise<void> {
  await supabase.from('activities').delete().eq('id', activityId);
}

export async function reorderActivity(activityId: string, newOrder: number): Promise<void> {
  await supabase.from('activities').update({ order: newOrder }).eq('id', activityId);
}

export async function reorderActivities(
  dayId: string,
  orderedIds: string[],
): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('activities').update({ order: index + 1 }).eq('id', id),
  );
  await Promise.all(updates);
}
