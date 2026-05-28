import { supabase } from '../supabase';
import { Message } from '@/types';

export async function getMessages(tripId: string): Promise<Message[]> {
  return [];
}

export async function sendMessage(tripId: string, content: string): Promise<Message | null> {
  return null;
}

export async function deleteMessage(messageId: string): Promise<void> {}
