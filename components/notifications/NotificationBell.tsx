import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/store/notificationStore';
import Colors from '@/constants/colors';

export default function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useNotificationStore();

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => router.push('/(app)/notifications')}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.neutral.white,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
});
