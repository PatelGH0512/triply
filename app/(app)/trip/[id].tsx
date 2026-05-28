import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Trip {id} — Phase 3</Text>
    </View>
  );
}
