import { supabase } from '../supabase';
import { PackingListItem, PackingListCheck } from '@/types';

export async function getPackingItems(tripId: string): Promise<PackingListItem[]> {
  const { data, error } = await supabase
    .from('packing_list_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as PackingListItem[];
}

export async function addPackingItem(
  tripId: string,
  name: string,
  userId: string,
): Promise<PackingListItem | null> {
  const { data, error } = await supabase
    .from('packing_list_items')
    .insert({ trip_id: tripId, name, created_by: userId, quantity: 1 })
    .select()
    .single();
  if (error || !data) return null;
  return data as PackingListItem;
}

export async function getChecks(tripId: string, userId: string): Promise<PackingListCheck[]> {
  const { data: items } = await supabase
    .from('packing_list_items')
    .select('id')
    .eq('trip_id', tripId);

  if (!items?.length) return [];

  const itemIds = items.map((i) => i.id);

  const { data, error } = await supabase
    .from('packing_list_checks')
    .select('*')
    .eq('user_id', userId)
    .in('item_id', itemIds);

  if (error || !data) return [];
  return data as PackingListCheck[];
}

export async function checkItem(itemId: string, userId: string): Promise<void> {
  await supabase
    .from('packing_list_checks')
    .insert({ item_id: itemId, user_id: userId, checked: true });
}

export async function uncheckItem(itemId: string, userId: string): Promise<void> {
  await supabase
    .from('packing_list_checks')
    .delete()
    .eq('item_id', itemId)
    .eq('user_id', userId);
}
