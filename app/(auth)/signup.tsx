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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { signupSchema, SignupForm, mapAuthError } from '@/lib/validations/auth';
import Colors from '@/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    });
    if (error) {
      setAuthError(mapAuthError(error.message));
      setLoading(false);
      return;
    }
    router.push({
      pathname: '/(auth)/verify',
      params: { email: data.email, full_name: data.full_name },
    });
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#E8635A', '#F07878', '#FFADA8']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>triply</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Plan trips with friends</Text>
          </View>

          <View style={styles.form}>
            {authError ? <Text style={styles.authError}>{authError}</Text> : null}

            <View style={styles.field}>
              <Text style={[styles.label, styles.labelLight]}>Full name</Text>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.full_name && styles.inputError]}
                    placeholder="Jane Smith"
                    placeholderTextColor={Colors.neutral.placeholder}
                    autoCapitalize="words"
                    autoComplete="name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.full_name && <Text style={styles.error}>{errors.full_name.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, styles.labelLight]}>Email</Text>
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
              <Text style={[styles.label, styles.labelLight]}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={Colors.neutral.placeholder}
                    secureTextEntry
                    autoComplete="new-password"
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
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  labelLight: { color: '#fff' },
  input: {
    height: 52,
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  inputError: { borderWidth: 1.5, borderColor: '#fff' },
  error: { fontSize: 12, color: '#fff', marginTop: 2, fontWeight: '600' },
  authError: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.primary.coral, fontSize: 16, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  linkBold: { color: '#fff', fontWeight: '700' },
});
