import { supabase } from '../supabase';
import { Trip, TripMember, TripDestination, Day } from '@/types';
import dayjs from 'dayjs';

export async function getTrips(userId: string): Promise<Trip[]> {
  return [];
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  return null;
}

export async function createTrip(data: Partial<Trip>): Promise<Trip | null> {
  return null;
}

export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip | null> {
  return null;
}

export async function deleteTrip(tripId: string): Promise<void> {}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  return [];
}

export async function getTripDestinations(tripId: string): Promise<TripDestination[]> {
  return [];
}

export async function generateDaysForTrip(
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<Day[]> {
  const days: Partial<Day>[] = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  let order = 0;

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

  return days as Day[];
}
