import { supabase } from '../supabase';
import { Document } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function getDocuments(tripId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Document[];
}

export async function uploadDocument(
  tripId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<Document | null> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const uniqueName = `${Date.now()}_${fileName}`;
  const filePath = `documents/${tripId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from('trip-documents')
    .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from('trip-documents').getPublicUrl(filePath);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('documents')
    .insert({
      trip_id: tripId,
      name: fileName,
      url: urlData.publicUrl,
      type: mimeType,
      size: arrayBuffer.byteLength,
      uploaded_by: user?.id,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to save document record: ${error?.message ?? 'unknown'}`);
  return data as Document;
}
