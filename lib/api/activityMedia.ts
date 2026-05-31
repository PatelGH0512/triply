import { supabase } from '../supabase';
import { ActivityMedia } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadMedia(
  activityId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<ActivityMedia | null> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const uniqueName = `${Date.now()}_${fileName}`;
  const filePath = `activities/${activityId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from('activity-media')
    .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from('activity-media').getPublicUrl(filePath);

  const type: ActivityMedia['type'] = mimeType.startsWith('image/')
    ? 'image'
    : mimeType === 'application/pdf'
      ? 'pdf'
      : 'video';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('activity_media')
    .insert({
      activity_id: activityId,
      url: urlData.publicUrl,
      type,
      uploaded_by: user?.id,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to save media record: ${error?.message ?? 'unknown'}`);
  return data as ActivityMedia;
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await supabase.from('activity_media').delete().eq('id', mediaId);
}
