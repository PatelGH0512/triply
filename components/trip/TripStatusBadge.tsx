import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import Colors from '@/constants/colors';

export type TripStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export function getTripStatus(startDate: string, endDate: string): TripStatus {
  const today = dayjs().format('YYYY-MM-DD');
  if (today < startDate) return 'Upcoming';
  if (today > endDate) return 'Completed';
  return 'Ongoing';
}

interface TripStatusBadgeProps {
  startDate: string;
  endDate: string;
}

const STATUS_STYLES: Record<TripStatus, { bg: string; text: string }> = {
  Upcoming: { bg: Colors.status.infoLight, text: Colors.status.info },
  Ongoing: { bg: Colors.status.successLight, text: Colors.status.success },
  Completed: { bg: '#EDEDF0', text: Colors.text.tertiary },
};

export default function TripStatusBadge({ startDate, endDate }: TripStatusBadgeProps) {
  const status = getTripStatus(startDate, endDate);
  const { bg, text } = STATUS_STYLES[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '700' },
});
