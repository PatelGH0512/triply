import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import NotificationItem from '@/components/notifications/NotificationItem';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification } from '@/types';
import { NotificationType } from '@/constants/enums';
import Colors from '@/constants/colors';

function getTripRoute(type: NotificationType, data: Record<string, unknown> | null): string {
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

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead } = useMarkAllAsRead();
  const { markRead: storeMarkRead, markAllRead: storeMarkAllRead } = useNotificationStore();

  const handlePress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markRead(notification.id);
        storeMarkRead(notification.id);
      }
      const route = getTripRoute(notification.type, notification.data);
      router.push(route as any);
    },
    [markRead, storeMarkRead, router],
  );

  const handleMarkAll = useCallback(() => {
    markAllRead();
    storeMarkAllRead();
  }, [markAllRead, storeMarkAllRead]);

  const today = dayjs().startOf('day');
  const todayItems = notifications.filter((n) => dayjs(n.created_at).isAfter(today));
  const earlierItems = notifications.filter((n) => !dayjs(n.created_at).isAfter(today));

  const sections: { title: string; data: Notification[] }[] = [];
  if (todayItems.length > 0) sections.push({ title: 'Today', data: todayItems });
  if (earlierItems.length > 0) sections.push({ title: 'Earlier', data: earlierItems });

  const flatData: ({ type: 'header'; title: string } | { type: 'item'; notification: Notification })[] =
    sections.flatMap((s) => [
      { type: 'header' as const, title: s.title },
      ...s.data.map((n) => ({ type: 'item' as const, notification: n })),
    ]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary.coral} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyBody}>You'll be notified about trip activity here</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, idx) =>
            item.type === 'header' ? `header-${item.title}` : item.notification.id
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionHeader}>{item.title}</Text>;
            }
            return (
              <NotificationItem
                notification={item.notification}
                onPress={handlePress}
              />
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  markAllText: { fontSize: 13, color: Colors.primary.coral, fontWeight: '600' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: Colors.neutral.background,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.borderLight,
    marginLeft: 72,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  emptyBody: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: 40 },
});
