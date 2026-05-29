import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = '🗺️', title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
});
