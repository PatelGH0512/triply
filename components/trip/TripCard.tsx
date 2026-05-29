import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { TripWithDetails } from '@/types';
import TripStatusBadge from './TripStatusBadge';
import MemberAvatarStack from './MemberAvatarStack';
import Colors from '@/constants/colors';

interface TripCardProps {
  trip: TripWithDetails;
  onDelete: (tripId: string) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const router = useRouter();

  const destinations = [...trip.trip_destinations]
    .sort((a, b) => a.order - b.order)
    .map((d) => d.name)
    .join(' · ');

  const dateRange = `${dayjs(trip.start_date).format('MMM D')} – ${dayjs(trip.end_date).format('MMM D, YYYY')}`;

  const handleLongPress = () => {
    Alert.alert(
      'Remove trip',
      "Remove this trip from your app? Other members won't be affected.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(trip.id) },
      ],
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/trip/${trip.id}`)}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>{trip.name}</Text>
        <TripStatusBadge startDate={trip.start_date} endDate={trip.end_date} />
      </View>

      {destinations ? (
        <Text style={styles.destinations} numberOfLines={1}>{destinations}</Text>
      ) : null}

      <View style={styles.bottom}>
        <Text style={styles.dates}>{dateRange}</Text>
        <MemberAvatarStack members={trip.trip_members} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, flex: 1 },
  destinations: { fontSize: 14, color: Colors.text.secondary },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dates: { fontSize: 13, color: Colors.text.tertiary, fontWeight: '500' },
});
