import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { createProfile, uploadAvatar } from '@/lib/api/auth';
import { resolveInvite, INVITE_TOKEN_KEY } from '@/lib/api/invites';
import { useAuthStore } from '@/store/authStore';
import { profileSetupSchema, ProfileSetupForm, mapAuthError } from '@/lib/validations/auth';
import Colors from '@/constants/colors';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { full_name } = useLocalSearchParams<{ full_name?: string }>();
  const { setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { full_name: full_name ?? '', phone: '' },
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProfileSetupForm) => {
    setLoading(true);
    setSubmitError('');

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setSubmitError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    let avatar_url: string | null = null;

    if (avatarUri) {
      avatar_url = await uploadAvatar(userId, avatarUri);
    }

    const profile = await createProfile({
      id: userId,
      email: authData.user.email ?? '',
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url,
    });

    if (!profile) {
      setSubmitError('Failed to save profile. Please try again.');
      setLoading(false);
      return;
    }

    setUser(profile);

    const pendingToken = await SecureStore.getItemAsync(INVITE_TOKEN_KEY);
    if (pendingToken) {
      const result = await resolveInvite(pendingToken, userId);
      await SecureStore.deleteItemAsync(INVITE_TOKEN_KEY);
      if (result.success && result.tripId) {
        router.replace(`/trip/${result.tripId}` as any);
        setLoading(false);
        return;
      }
    }

    router.replace('/(app)/home');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>triply</Text>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>This only takes a moment</Text>
        </View>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>+</Text>
            </View>
          )}
          <Text style={styles.avatarLabel}>Add photo</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          {submitError ? <Text style={styles.authError}>{submitError}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.full_name && styles.inputError]}
                  placeholder="Jane Smith"
                  placeholderTextColor={Colors.neutral.placeholder}
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.full_name && <Text style={styles.error}>{errors.full_name.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Phone number <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="+12025551234"
                  placeholderTextColor={Colors.neutral.placeholder}
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}
            <Text style={styles.hint}>International format required for SMS invites</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.neutral.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary.coral,
    letterSpacing: -1,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.text.secondary },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary.coralFaded,
    borderWidth: 2,
    borderColor: Colors.primary.coral,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarPlaceholderText: { fontSize: 32, color: Colors.primary.coral, lineHeight: 36 },
  avatarLabel: { fontSize: 14, color: Colors.primary.coral, fontWeight: '600' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  optional: { fontWeight: '400', color: Colors.text.tertiary },
  hint: { fontSize: 12, color: Colors.text.tertiary },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  inputError: { borderColor: Colors.status.error },
  error: { fontSize: 12, color: Colors.status.error, marginTop: 2 },
  authError: {
    backgroundColor: Colors.status.errorLight,
    color: Colors.status.error,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
