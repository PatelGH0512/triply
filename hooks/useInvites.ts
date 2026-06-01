import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createInvite,
  getInvites,
  resendInvite,
  resolveInvite,
  getInviteByToken,
  InviteContactType,
} from '@/lib/api/invites';
import { useAuthStore } from '@/store/authStore';

export function useInvites(tripId: string) {
  return useQuery({
    queryKey: ['invites', tripId],
    queryFn: () => getInvites(tripId),
    enabled: !!tripId,
  });
}

export function useCreateInvite(tripId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const invitedBy = session?.user?.id ?? '';

  return useMutation({
    mutationFn: ({ contact, type }: { contact: string; type: InviteContactType }) =>
      createInvite(tripId, invitedBy, contact, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', tripId] });
    },
  });
}

export function useResendInvite(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inviteId,
      inviterName,
      tripName,
    }: {
      inviteId: string;
      inviterName: string;
      tripName: string;
    }) => resendInvite(inviteId, inviterName, tripName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', tripId] });
    },
  });
}

export function useResolveInvite() {
  return useMutation({
    mutationFn: ({ token, userId }: { token: string; userId: string }) =>
      resolveInvite(token, userId),
  });
}

export function useInviteByToken(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInviteByToken(token),
    enabled: !!token,
  });
}
