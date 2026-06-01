import { supabase } from '../supabase';
import { TripInvite, InviteWithDetails } from '@/types';
import { InviteStatus } from '@/constants/enums';

export const INVITE_TOKEN_KEY = 'pending_invite_token';

export type InviteContactType = 'sms' | 'email';

export async function createInvite(
  tripId: string,
  invitedBy: string,
  contact: string,
  type: InviteContactType,
): Promise<TripInvite | null> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const inviteData = {
    trip_id: tripId,
    invited_by: invitedBy,
    invited_email: type === 'email' ? contact : null,
    invited_phone: type === 'sms' ? contact : null,
    token,
    expires_at: expiresAt,
    status: InviteStatus.Pending,
  };

  const { data: invite, error } = await supabase
    .from('trip_invites')
    .insert(inviteData)
    .select()
    .single();

  if (error || !invite) return null;

  const { data: tripData } = await supabase
    .from('trips')
    .select('name')
    .eq('id', tripId)
    .single();

  const { data: inviterData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', invitedBy)
    .single();

  await supabase.functions.invoke('send-invite', {
    body: {
      token,
      contact,
      type,
      tripName: tripData?.name ?? 'a trip',
      inviterName: inviterData?.full_name ?? 'Someone',
      expiresAt,
    },
  });

  return invite as TripInvite;
}

export async function getInvites(tripId: string): Promise<TripInvite[]> {
  const { data, error } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as TripInvite[];
}

export async function resendInvite(
  inviteId: string,
  inviterName: string,
  tripName: string,
): Promise<void> {
  const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: invite } = await supabase
    .from('trip_invites')
    .update({ status: InviteStatus.Pending, expires_at: newExpiresAt })
    .eq('id', inviteId)
    .select()
    .single();

  if (!invite) return;

  const contact = invite.invited_email ?? invite.invited_phone;
  const type: InviteContactType = invite.invited_email ? 'email' : 'sms';

  if (contact) {
    await supabase.functions.invoke('send-invite', {
      body: {
        token: invite.token,
        contact,
        type,
        tripName,
        inviterName,
        expiresAt: newExpiresAt,
      },
    });
  }
}

export async function resolveInvite(
  token: string,
  userId: string,
): Promise<{ success: boolean; tripId?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('resolve-invite', {
    body: { token, userId },
  });

  if (error) return { success: false, error: 'network_error' };

  if (data?.error) return { success: false, error: data.error };

  return { success: true, tripId: data?.tripId };
}

export async function getInviteByToken(token: string): Promise<InviteWithDetails | null> {
  const { data, error } = await supabase
    .from('trip_invites')
    .select(`
      *,
      trip:trips(
        *,
        trip_destinations(*),
        trip_members(*, users(id, full_name, avatar_url))
      ),
      inviter:users!trip_invites_invited_by_fkey(id, full_name, avatar_url)
    `)
    .eq('token', token)
    .single();

  if (error || !data) return null;
  return data as unknown as InviteWithDetails;
}

export async function declineInvite(token: string): Promise<void> {
  await supabase
    .from('trip_invites')
    .update({ status: InviteStatus.Declined })
    .eq('token', token);
}
