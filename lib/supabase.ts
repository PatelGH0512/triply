import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const CHUNK_INDEX_PREFIX = '__chunks:';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value === null) return null;
      if (value.startsWith(CHUNK_INDEX_PREFIX)) {
        const count = parseInt(value.slice(CHUNK_INDEX_PREFIX.length), 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_c${i}`);
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join('');
      }
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
      } else {
        const count = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < count; i++) {
          await SecureStore.setItemAsync(
            `${key}_c${i}`,
            value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          );
        }
        await SecureStore.setItemAsync(key, `${CHUNK_INDEX_PREFIX}${count}`);
      }
    } catch (e) {
      console.error('[SecureStore] setItem error:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value?.startsWith(CHUNK_INDEX_PREFIX)) {
        const count = parseInt(value.slice(CHUNK_INDEX_PREFIX.length), 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_c${i}`);
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] removeItem error:', e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
