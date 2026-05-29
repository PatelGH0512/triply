import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrip } from '@/hooks/useTrip';
import Colors from '@/constants/colors';

export default function TripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(app)/home')}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary.coral} />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.tripName}>{trip?.name ?? 'Trip'}</Text>
          <Text style={styles.placeholder}>Activities coming in Phase 4</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  backText: { fontSize: 15, color: Colors.primary.coral, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 24, gap: 12 },
  tripName: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  placeholder: { fontSize: 15, color: Colors.text.secondary },
});
