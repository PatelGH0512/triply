import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function AppLayout() {
  const router = useRouter();
  const { session, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        clearAuth();
        router.replace('/(auth)/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [session]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
