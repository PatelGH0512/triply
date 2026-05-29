import { supabase } from '../supabase';
import { Trip, TripMember, TripDestination, Day, TripWithDetails } from '@/types';
import { MemberRole } from '@/constants/enums';
import { DestinationInput } from '@/lib/validations/trip';
import dayjs from 'dayjs';

export async function getTrips(userId: string): Promise<TripWithDetails[]> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_destinations(*),
      trip_members!inner(*, users(id, full_name, avatar_url))
    `)
    .eq('trip_members.user_id', userId)
    .order('start_date', { ascending: true });

  if (error || !data) return [];
  return data as TripWithDetails[];
}

export async function getTripById(tripId: string): Promise<TripWithDetails | null> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_destinations(*),
      trip_members(*, users(id, full_name, avatar_url))
    `)
    .eq('id', tripId)
    .single();

  if (error || !data) return null;
  return data as TripWithDetails;
}

export interface CreateTripInput {
  name: string;
  destinations: DestinationInput[];
  start_date: string;
  end_date: string;
  userId: string;
}

export async function createTrip(input: CreateTripInput): Promise<TripWithDetails | null> {
  const { name, destinations, start_date, end_date } = input;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[createTrip] No active session');
    return null;
  }
  const userId = session.user.id;
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ name, start_date, end_date, admin_id: userId })
    .select()
    .single();

  if (tripError || !trip) {
    console.error('[createTrip] trips insert error:', JSON.stringify(tripError));
    return null;
  }

  // Insert member FIRST so is_trip_member() passes for subsequent inserts
  const { error: memberError } = await supabase.from('trip_members').insert({
    trip_id: trip.id,
    user_id: userId,
    role: MemberRole.Admin,
  });
  if (memberError) {
    console.error('[createTrip] members insert error:', JSON.stringify(memberError));
    return null;
  }

  const destRows = destinations.map((d, i) => ({
    trip_id: trip.id,
    name: d.name,
    place_id: d.place_id ?? null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    order: i + 1,
  }));
  const { error: destError } = await supabase.from('trip_destinations').insert(destRows);
  if (destError) console.error('[createTrip] destinations insert error:', JSON.stringify(destError));

  const dayRows = buildDayRows(trip.id, start_date, end_date);
  const { error: daysError } = await supabase.from('days').insert(dayRows);
  if (daysError) console.error('[createTrip] days insert error:', JSON.stringify(daysError));

  return getTripById(trip.id);
}

export async function deleteOwnTrip(tripId: string, userId: string): Promise<void> {
  await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
}

export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip | null> {
  const { data: result, error } = await supabase
    .from('trips')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select()
    .single();
  if (error || !result) return null;
  return result as Trip;
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*, users(*)')
    .eq('trip_id', tripId);
  if (error || !data) return [];
  return data as TripMember[];
}

export async function getTripDestinations(tripId: string): Promise<TripDestination[]> {
  const { data, error } = await supabase
    .from('trip_destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('order', { ascending: true });
  if (error || !data) return [];
  return data as TripDestination[];
}

export function buildDayRows(
  tripId: string,
  startDate: string,
  endDate: string,
): Partial<Day>[] {
  const days: Partial<Day>[] = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  let order = 1;

  while (!current.isAfter(end)) {
    days.push({
      trip_id: tripId,
      date: current.format('YYYY-MM-DD'),
      label: null,
      order,
    });
    current = current.add(1, 'day');
    order++;
  }
  return days;
}

export async function generateDaysForTrip(
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<Day[]> {
  const rows = buildDayRows(tripId, startDate, endDate);
  const { data, error } = await supabase.from('days').insert(rows).select();
  if (error || !data) return [];
  return data as Day[];
}
