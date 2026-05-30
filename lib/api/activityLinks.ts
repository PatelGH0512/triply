import { supabase } from '../supabase';
import { ActivityLink } from '@/types';

export interface LinkInput {
  title: string;
  url: string;
}

export async function createLinks(
  activityId: string,
  links: LinkInput[],
): Promise<ActivityLink[]> {
  if (!links.length) return [];
  const rows = links.map((l) => ({ activity_id: activityId, title: l.title, url: l.url }));
  const { data, error } = await supabase.from('activity_links').insert(rows).select();
  if (error || !data) return [];
  return data as ActivityLink[];
}

export async function deleteLinks(activityId: string): Promise<void> {
  await supabase.from('activity_links').delete().eq('activity_id', activityId);
}
