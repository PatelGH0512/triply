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
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, LoginForm, mapAuthError } from '@/lib/validations/auth';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setAuthError('');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setAuthError(mapAuthError(error.message));
      setLoading(false);
      return;
    }
    if (authData.session) {
      setSession(authData.session);
      const profile = await getProfile(authData.session.user.id);
      if (profile) {
        setUser(profile);
        router.replace('/(app)/home');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    }
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          {authError ? <Text style={styles.authError}>{authError}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.neutral.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Your password"
                  placeholderTextColor={Colors.neutral.placeholder}
                  secureTextEntry
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.neutral.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary.coral,
    letterSpacing: -1,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.text.secondary },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
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
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: Colors.text.secondary },
  linkBold: { color: Colors.primary.coral, fontWeight: '700' },
});
