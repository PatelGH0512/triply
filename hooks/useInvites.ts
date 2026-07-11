import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createInvite,
  getInvites,
  resendInvite,
  getPendingInvitesForEmail,
  acceptInvite,
  declineInvite,
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
    mutationFn: ({ email }: { email: string }) => createInvite(tripId, invitedBy, email),
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

export function usePendingInvites(email: string | undefined | null) {
  return useQuery({
    queryKey: ['pending-invites', email],
    queryFn: () => getPendingInvitesForEmail(),
    enabled: !!email,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, userId }: { inviteId: string; userId: string }) =>
      acceptInvite(inviteId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId }: { inviteId: string }) => declineInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
    },
  });
}
