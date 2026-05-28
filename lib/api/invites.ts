import { supabase } from '../supabase';
import { TripInvite } from '@/types';

export async function createInvite(
  tripId: string,
  emailOrPhone: string,
): Promise<TripInvite | null> {
  return null;
}

export async function acceptInvite(inviteId: string): Promise<void> {}

export async function declineInvite(inviteId: string): Promise<void> {}

export async function getInviteByCode(code: string): Promise<TripInvite | null> {
  return null;
}

export async function getPendingInvites(tripId: string): Promise<TripInvite[]> {
  return [];
}
