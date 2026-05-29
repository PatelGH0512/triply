import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholder}>Your trips will appear here</Text>
        <Text style={styles.placeholderSub}>Phase 3 coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text.primary },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholder: { fontSize: 16, color: Colors.text.secondary, fontWeight: '600' },
  placeholderSub: { fontSize: 14, color: Colors.text.tertiary },
});
