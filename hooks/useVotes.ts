import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVotes, castVote, VoteSummary } from '@/lib/api/votes';
import { VoteType } from '@/constants/enums';
import { useAuthStore } from '@/store/authStore';

export function useVotes(activityId: string) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery<VoteSummary>({
    queryKey: ['votes', activityId],
    queryFn: () => getVotes(activityId, userId),
    enabled: !!activityId && !!userId,
  });
}

export function useCastVote(activityId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (vote: VoteType) => castVote(activityId, userId, vote),

    onMutate: async (vote: VoteType) => {
      await queryClient.cancelQueries({ queryKey: ['votes', activityId] });

      const previous = queryClient.getQueryData<VoteSummary>(['votes', activityId]);

      queryClient.setQueryData<VoteSummary>(['votes', activityId], (old) => {
        if (!old) return old;

        const prevVote = old.userVote;
        let { yayCount, nayCount } = old;

        if (prevVote === vote) {
          if (vote === VoteType.Yay) yayCount = Math.max(0, yayCount - 1);
          else nayCount = Math.max(0, nayCount - 1);
          return { yayCount, nayCount, userVote: null };
        }

        if (prevVote === VoteType.Yay) yayCount = Math.max(0, yayCount - 1);
        if (prevVote === VoteType.Nay) nayCount = Math.max(0, nayCount - 1);

        if (vote === VoteType.Yay) yayCount += 1;
        else nayCount += 1;

        return { yayCount, nayCount, userVote: vote };
      });

      return { previous };
    },

    onError: (_err, _vote, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['votes', activityId], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', activityId] });
    },
  });
}
