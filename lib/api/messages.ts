import { supabase } from '../supabase';
import { Message } from '@/types';

const PAGE_SIZE = 50;

const MESSAGE_SELECT = `
  id,
  trip_id,
  user_id,
  body,
  image_url,
  reply_to_id,
  is_deleted,
  is_edited,
  created_at,
  updated_at,
  sender:users(id, full_name, avatar_url)
`.trim();

export async function getMessageById(messageId: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('id', messageId)
    .single();
  if (error) return null;
  return data as unknown as Message;
}

export async function getMessages(
  tripId: string,
  cursor?: string,
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[getMessages]', error.message);
    return [];
  }

  const messages = (data ?? []) as unknown as Message[];

  const replyIds = [...new Set(messages.map((m) => m.reply_to_id).filter(Boolean))] as string[];
  if (replyIds.length > 0) {
    const { data: replies } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .in('id', replyIds);

    if (replies) {
      const replyMap = new Map((replies as unknown as Message[]).map((r) => [r.id, r]));
      return messages.map((m) =>
        m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m,
      );
    }
  }

  return messages;
}

export async function sendMessage(
  tripId: string,
  userId: string,
  body: string,
  replyToId?: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      trip_id: tripId,
      user_id: userId,
      body,
      reply_to_id: replyToId ?? null,
    })
    .select('id')
    .single();
  if (error) {
    console.error('[sendMessage]', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function sendImageMessage(
  tripId: string,
  userId: string,
  imageUrl: string,
  replyToId?: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      trip_id: tripId,
      user_id: userId,
      image_url: imageUrl,
      reply_to_id: replyToId ?? null,
    })
    .select('id')
    .single();
  if (error) {
    console.error('[sendImageMessage]', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function editMessage(
  messageId: string,
  newBody: string,
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ body: newBody, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', messageId);
  if (error) console.error('[editMessage]', error.message);
}

export async function deleteMessage(messageId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({
      is_deleted: true,
      body: null,
      image_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId);
}

export async function uploadChatImage(
  tripId: string,
  uri: string,
  filename: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

  const path = `chat/${tripId}/${Date.now()}_${filename}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('chat-images')
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[uploadChatImage] upload failed:', error.message);
    return null;
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('chat-images')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);

  if (signError || !signedData?.signedUrl) {
    console.error('[uploadChatImage] signed URL failed:', signError?.message);
    return null;
  }

  return signedData.signedUrl;
}
