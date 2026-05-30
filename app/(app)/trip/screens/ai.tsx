import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function AiScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="sparkles-outline" size={48} color={Colors.neutral.placeholder} />
      <Text style={styles.title}>AI Assistant</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.background,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text.secondary },
  sub: { fontSize: 14, color: Colors.text.tertiary },
});
