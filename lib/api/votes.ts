import { supabase } from '../supabase';
import { VoteType } from '@/constants/enums';

export interface VoteSummary {
  yayCount: number;
  nayCount: number;
  userVote: VoteType | null;
}

export async function getVotes(
  activityId: string,
  userId: string,
): Promise<VoteSummary> {
  const { data, error } = await supabase
    .from('activity_votes')
    .select('user_id, vote')
    .eq('activity_id', activityId);

  if (error || !data) return { yayCount: 0, nayCount: 0, userVote: null };

  const yayCount = data.filter((v) => v.vote === VoteType.Yay).length;
  const nayCount = data.filter((v) => v.vote === VoteType.Nay).length;
  const userVoteRow = data.find((v) => v.user_id === userId);
  const userVote = userVoteRow ? (userVoteRow.vote as VoteType) : null;

  return { yayCount, nayCount, userVote };
}

export async function castVote(
  activityId: string,
  userId: string,
  vote: VoteType,
): Promise<void> {
  const { data: existing } = await supabase
    .from('activity_votes')
    .select('id, vote')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('activity_votes')
      .insert({ activity_id: activityId, user_id: userId, vote });
    return;
  }

  if (existing.vote === vote) {
    await supabase.from('activity_votes').delete().eq('id', existing.id);
    return;
  }

  await supabase.from('activity_votes').update({ vote }).eq('id', existing.id);
}
