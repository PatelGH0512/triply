import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const firstName = user?.full_name?.split(' ')[0] ?? '';

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.avatarSection}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.contact}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.contact}>{user.phone}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: Colors.primary.coral, false: Colors.neutral.border }}
              thumbColor={Colors.neutral.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: Colors.primary.coral, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 32 },
  avatarSection: { alignItems: 'center', gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 4 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 32 },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  contact: { fontSize: 14, color: Colors.text.secondary },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  rowLabel: { fontSize: 15, color: Colors.text.primary },
  logoutBtn: {
    backgroundColor: Colors.status.errorLight,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { fontSize: 15, color: Colors.status.error, fontWeight: '700' },
});
