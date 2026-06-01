import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationType } from '@/constants/enums';
import Colors from '@/constants/colors';

function getTripRoute(type: NotificationType, data: Record<string, unknown> | null) {
  const tripId = data?.tripId as string | undefined;
  if (!tripId) return '/(app)/home';

  switch (type) {
    case NotificationType.ExpenseAdded:
    case NotificationType.ExpenseLogged:
      return `/trip/${tripId}?tab=expenses`;
    case NotificationType.TripDeleted:
      return '/(app)/home';
    default:
      return `/trip/${tripId}`;
  }
}

export default function NotificationToast() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toastNotification, clearToast } = useNotificationStore();
  const translateY = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toastNotification) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    timerRef.current = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toastNotification]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => clearToast());
  };

  const handlePress = () => {
    if (!toastNotification) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    dismiss();
    const route = getTripRoute(toastNotification.type, toastNotification.data);
    router.push(route as any);
  };

  if (!toastNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity style={styles.toast} onPress={handlePress} activeOpacity={0.9}>
        <Text style={styles.bell}>🔔</Text>
        <Text style={styles.body} numberOfLines={2}>
          {toastNotification.body}
        </Text>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  bell: { fontSize: 18 },
  body: { flex: 1, fontSize: 14, color: Colors.neutral.white, fontWeight: '500', lineHeight: 19 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 13, color: Colors.neutral.placeholder },
});
