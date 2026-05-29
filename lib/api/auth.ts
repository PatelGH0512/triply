import { supabase } from '../supabase';
import { User } from '@/types';

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createProfile(data: Partial<User> & { id: string }): Promise<User | null> {
  const { data: result, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error || !result) return null;
  return result as User;
}

export async function updateProfile(
  userId: string,
  data: Partial<User>,
): Promise<User | null> {
  const { data: result, error } = await supabase
    .from('users')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !result) return null;
  return result as User;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filePath = `avatars/${userId}.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}
