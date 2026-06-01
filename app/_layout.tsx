import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { INVITE_TOKEN_KEY } from '@/lib/api/invites';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

async function upsertPushToken(userId: string, pushToken: string) {
  await supabase.from('users').update({ push_token: pushToken }).eq('id', userId);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { setSession, setUser, setLoading, session } = useAuthStore();
  const router = useRouter();
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsed = Linking.parse(initialUrl);
        const token =
          (parsed.queryParams?.token as string | undefined) ?? parsed.path?.split('/invite/')?.[1];
        if (token) {
          await SecureStore.setItemAsync(INVITE_TOKEN_KEY, token);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    registerForPushNotifications().then((pushToken) => {
      if (pushToken) {
        upsertPushToken(session.user.id, pushToken);
      }
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const type = data?.type as string | undefined;
        const tripId = data?.tripId as string | undefined;

        if (type === 'trip_deleted' || !tripId) {
          router.push('/(app)/home');
        } else {
          router.push(`/trip/${tripId}` as any);
        }
      },
    );

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, [session?.user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
