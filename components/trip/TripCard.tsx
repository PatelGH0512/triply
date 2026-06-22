import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { TripWithDetails } from '@/types';
import MemberAvatarStack from './MemberAvatarStack';
import { Badge } from '@/components/ui/Badge';
import { getTripStatus } from './TripStatusBadge';
import { colors, radius, shadows, typography } from '@/constants/tokens';
import type { BadgeVariant } from '@/components/ui/Badge';

const WARM_GRADIENT_PAIRS: [string, string][] = [
  ['#FF6B4A', '#FF9E8A'],
  ['#F5A623', '#FFD166'],
  ['#E8845A', '#FFBEA0'],
  ['#D4713E', '#F0A060'],
  ['#C46050', '#F08A7A'],
  ['#E07848', '#FFA878'],
  ['#B85C30', '#E08860'],
  ['#FF8C6B', '#FFB89A'],
];

function getGradientPair(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WARM_GRADIENT_PAIRS[Math.abs(hash) % WARM_GRADIENT_PAIRS.length];
}

function getTripEmoji(destinations: string): string {
  const lower = destinations.toLowerCase();
  if (lower.includes('bali') || lower.includes('beach') || lower.includes('island')) return '🏖️';
  if (lower.includes('paris') || lower.includes('europe') || lower.includes('france')) return '🗼';
  if (lower.includes('japan') || lower.includes('tokyo')) return '🗾';
  if (lower.includes('mountain') || lower.includes('hike')) return '🏔️';
  if (lower.includes('new york') || lower.includes('nyc')) return '🗽';
  return '✈️';
}

const STATUS_TO_BADGE: Record<string, BadgeVariant> = {
  Upcoming: 'upcoming',
  Ongoing: 'ongoing',
  Completed: 'completed',
};

interface TripCardProps {
  trip: TripWithDetails;
  onDelete: (tripId: string) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const router = useRouter();
  const [gradStart, gradEnd] = getGradientPair(trip.name);

  const destinations = [...trip.trip_destinations]
    .sort((a, b) => a.order - b.order)
    .map((d) => d.name)
    .join(' · ');

  const numDays = dayjs(trip.end_date).diff(dayjs(trip.start_date), 'day') + 1;
  const dateRange = `${dayjs(trip.start_date).format('MMM D')} – ${dayjs(trip.end_date).format('MMM D')} · ${numDays} day${numDays !== 1 ? 's' : ''}`;
  const status = getTripStatus(trip.start_date, trip.end_date);
  const badgeVariant: BadgeVariant = STATUS_TO_BADGE[status] ?? 'upcoming';
  const emoji = getTripEmoji(destinations);

  const handleLongPress = () => {
    Alert.alert('Remove trip', "Remove this trip from your app? Other members won't be affected.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(trip.id) },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/trip/${trip.id}`)}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      <LinearGradient
        colors={[gradStart, gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientTop}
      >
        <Text style={styles.destinationText} numberOfLines={1}>
          {destinations || 'No destinations yet'}
        </Text>
        <Text style={styles.emoji}>{emoji}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={styles.dates}>{dateRange}</Text>

        <View style={styles.footer}>
          <MemberAvatarStack members={trip.trip_members} size={26} />
          <Badge variant={badgeVariant} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  gradientTop: {
    height: 120,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  destinationText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  emoji: {
    fontSize: 28,
  },
  body: {
    padding: 16,
    gap: 6,
  },
  name: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[800],
  },
  dates: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
