import { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/store/authStore';
import { useTrips, useDeleteOwnTrip } from '@/hooks/useTrip';
import { useNotificationsRealtime } from '@/hooks/useRealtime';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import TripCard from '@/components/trip/TripCard';
import CreateTripSheet from '@/components/trip/CreateTripSheet';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationToast from '@/components/notifications/NotificationToast';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import { TripWithDetails } from '@/types';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const sheetRef = useRef<BottomSheet>(null);
  const userId = session?.user?.id ?? '';

  const { data: trips, isLoading, refetch, isFetching } = useTrips();
  const { mutate: deleteTrip } = useDeleteOwnTrip();
  const { data: notificationsData } = useNotifications();
  const { setNotifications } = useNotificationStore();

  useNotificationsRealtime(userId);

  useEffect(() => {
    if (notificationsData) setNotifications(notificationsData);
  }, [notificationsData]);

  const handleDelete = useCallback(
    (tripId: string) => {
      deleteTrip(tripId);
    },
    [deleteTrip],
  );

  const handleTripCreated = useCallback(
    (tripId: string) => {
      router.push(`/trip/${tripId}`);
    },
    [router],
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
      <View style={styles.skeletonBottom} />
    </View>
  );

  const renderItem = ({ item }: { item: TripWithDetails }) => (
    <TripCard trip={item} onDelete={handleDelete} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>triply</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addBtn} onPress={() => sheetRef.current?.expand()}>
            <Text style={styles.addBtnText}>+ Add Trip</Text>
          </TouchableOpacity>
          <NotificationBell />
          <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
            <Avatar uri={user?.avatar_url} name={user?.full_name} size={36} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((k) => (
            <View key={k}>{renderSkeleton()}</View>
          ))}
        </View>
      ) : (
        <FlatList
          data={trips ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            (!trips || trips.length === 0) && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={Colors.primary.coral}
            />
          }
          ListEmptyComponent={<EmptyState icon="🗺️" title="No trips yet. Plan your first one." />}
        />
      )}

      <CreateTripSheet sheetRef={sheetRef} onCreated={handleTripCreated} />
      <NotificationToast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  logo: { fontSize: 24, fontWeight: '800', color: Colors.primary.coral, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.primary.coral,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16 },
  listEmpty: { flex: 1 },
  skeletonCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    width: '60%',
    backgroundColor: Colors.neutral.border,
    borderRadius: 6,
  },
  skeletonSubtitle: {
    height: 14,
    width: '80%',
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 6,
  },
  skeletonBottom: {
    height: 14,
    width: '40%',
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 6,
  },
});
