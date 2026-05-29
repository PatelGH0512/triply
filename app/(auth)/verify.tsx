import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { mapAuthError } from '@/lib/validations/auth';
import Colors from '@/constants/colors';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyScreen() {
  const router = useRouter();
  const { email, full_name } = useLocalSearchParams<{ email: string; full_name: string }>();
  const { setSession, setUser } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (text: string, index: number) => {
    const char = text.slice(-1);
    const updated = [...otp];
    updated[index] = char;
    setOtp(updated);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (updated.every((d) => d !== '') && char) {
      handleVerify(updated.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    if (verifyError) {
      setError(mapAuthError(verifyError.message));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setLoading(false);
      return;
    }
    if (data.session) {
      setSession(data.session);
      const profile = await getProfile(data.session.user.id);
      if (profile) {
        setUser(profile);
        router.replace('/(app)/home');
      } else {
        router.replace({ pathname: '/(auth)/profile-setup', params: { full_name } });
      }
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await supabase.auth.resend({ type: 'signup', email });
    setCooldown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>triply</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.otpBox,
                error ? styles.otpBoxError : digit ? styles.otpBoxFilled : null,
              ]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (loading || otp.some((d) => !d)) && styles.buttonDisabled]}
          onPress={() => handleVerify(otp.join(''))}
          disabled={loading || otp.some((d) => !d)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resend, cooldown > 0 && styles.resendDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0}
        >
          <Text style={styles.resendText}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.neutral.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary.coral,
    letterSpacing: -1,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  emailText: { fontWeight: '700', color: Colors.text.primary },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  otpBoxFilled: { borderColor: Colors.primary.coral },
  otpBoxError: { borderColor: Colors.status.error },
  error: { fontSize: 13, color: Colors.status.error, marginBottom: 16, textAlign: 'center' },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resend: { alignItems: 'center' },
  resendDisabled: { opacity: 0.4 },
  resendText: { fontSize: 14, color: Colors.primary.coral, fontWeight: '600' },
});
