import { supabase } from '../supabase';
import { Activity } from '@/types';

export async function getActivitiesByDay(dayId: string): Promise<Activity[]> {
  return [];
}

export async function getActivitiesByTrip(tripId: string): Promise<Activity[]> {
  return [];
}

export async function createActivity(data: Partial<Activity>): Promise<Activity | null> {
  return null;
}

export async function updateActivity(
  activityId: string,
  data: Partial<Activity>,
): Promise<Activity | null> {
  return null;
}

export async function deleteActivity(activityId: string): Promise<void> {}

export async function reorderActivities(
  dayId: string,
  orderedIds: string[],
): Promise<void> {}
