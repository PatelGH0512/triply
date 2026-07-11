import { supabase } from '../supabase';
import { TripInvite, InviteWithDetails } from '@/types';
import { InviteStatus } from '@/constants/enums';

export async function createInvite(
  tripId: string,
  invitedBy: string,
  email: string,
): Promise<TripInvite | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('trip_id', tripId)
    .eq('invited_email', normalizedEmail)
    .eq('status', InviteStatus.Pending)
    .maybeSingle();

  if (existing) return existing as TripInvite;

  const inviteData = {
    trip_id: tripId,
    invited_by: invitedBy,
    invited_email: normalizedEmail,
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
      email: normalizedEmail,
      tripName: tripData?.name ?? 'a trip',
      inviterName: inviterData?.full_name ?? 'Someone',
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
  const { data: invite } = await supabase
    .from('trip_invites')
    .update({ status: InviteStatus.Pending })
    .eq('id', inviteId)
    .select()
    .single();

  if (!invite || !invite.invited_email) return;

  await supabase.functions.invoke('send-invite', {
    body: {
      email: invite.invited_email,
      tripName,
      inviterName,
    },
  });
}

export async function getPendingInvitesForEmail(): Promise<InviteWithDetails[]> {
  const { data, error } = await supabase.functions.invoke('get-my-invites');

  if (error || !data?.invites) return [];
  return data.invites as InviteWithDetails[];
}

export async function acceptInvite(
  inviteId: string,
  userId: string,
): Promise<{ success: boolean; tripId?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('accept-invite', {
    body: { inviteId, userId },
  });

  if (error) return { success: false, error: 'network_error' };
  if (data?.error) return { success: false, error: data.error };

  return { success: true, tripId: data?.tripId };
}

export async function declineInvite(inviteId: string): Promise<void> {
  await supabase
    .from('trip_invites')
    .update({ status: InviteStatus.Declined })
    .eq('id', inviteId);
}
