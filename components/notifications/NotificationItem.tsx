import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Avatar from '@/components/ui/Avatar';
import { Notification } from '@/types';
import { NotificationType } from '@/constants/enums';
import Colors from '@/constants/colors';

dayjs.extend(relativeTime);

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.TripInvite:
      return '✉️';
    case NotificationType.ActivityAdded:
    case NotificationType.ActivityEdited:
    case NotificationType.ActivityUpdated:
      return '📅';
    case NotificationType.ExpenseAdded:
    case NotificationType.ExpenseLogged:
      return '💰';
    case NotificationType.MemberJoined:
      return '👋';
    case NotificationType.TripDeleted:
      return '🗑️';
    case NotificationType.AdminTransfer:
      return '👑';
    case NotificationType.PackingAdded:
      return '🎒';
    case NotificationType.VoteCast:
      return '🗳️';
    default:
      return '🔔';
  }
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const actorName = (notification.data as any)?.actorName as string | undefined;
  const avatarUrl = (notification.data as any)?.actorAvatarUrl as string | undefined;

  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {!notification.read && <View style={styles.unreadDot} />}

      <View style={styles.avatarWrap}>
        <Avatar uri={avatarUrl ?? null} name={actorName ?? '?'} size={40} />
        <View style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>{getNotificationIcon(notification.type)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.body, !notification.read && styles.bodyUnread]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{dayjs(notification.created_at).fromNow()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.neutral.white,
    gap: 12,
  },
  unread: { backgroundColor: Colors.status.infoLight },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: 20,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary.coral,
  },
  avatarWrap: { position: 'relative' },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 11 },
  content: { flex: 1, gap: 3 },
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  bodyUnread: { color: Colors.text.primary, fontWeight: '500' },
  time: { fontSize: 12, color: Colors.text.tertiary },
});
