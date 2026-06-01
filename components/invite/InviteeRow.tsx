import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export type InviteeStatus = 'idle' | 'sending' | 'sent' | 'failed';

interface InviteeRowProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  status?: InviteeStatus;
  showRemove?: boolean;
}

export default function InviteeRow({
  value,
  onChange,
  onRemove,
  status = 'idle',
  showRemove = false,
}: InviteeRowProps) {
  const getInputType = (val: string) => {
    if (val.includes('@')) return 'email';
    if (/^\+?[\d\s\-()]{7,}$/.test(val)) return 'phone';
    return null;
  };

  const contactType = getInputType(value);

  return (
    <View style={styles.row}>
      <View style={[styles.inputWrap, status === 'failed' && styles.inputWrapError]}>
        <TextInput
          style={styles.input}
          placeholder="Phone or email"
          placeholderTextColor={Colors.neutral.placeholder}
          value={value}
          onChangeText={onChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={status !== 'sending' && status !== 'sent'}
        />
        {contactType && status === 'idle' && (
          <View style={styles.typeBadge}>
            <Ionicons
              name={contactType === 'email' ? 'mail-outline' : 'call-outline'}
              size={14}
              color={Colors.text.tertiary}
            />
          </View>
        )}
        {status === 'sent' && (
          <View style={[styles.statusBadge, styles.statusSent]}>
            <Text style={styles.statusTextSent}>✓ Sent</Text>
          </View>
        )}
        {status === 'failed' && (
          <View style={[styles.statusBadge, styles.statusFailed]}>
            <Text style={styles.statusTextFailed}>✕ Failed</Text>
          </View>
        )}
        {status === 'sending' && (
          <View style={styles.typeBadge}>
            <Text style={styles.sendingText}>…</Text>
          </View>
        )}
      </View>

      {showRemove && status !== 'sent' && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="close" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputWrap: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.neutral.white,
  },
  inputWrapError: { borderColor: Colors.status.error },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  typeBadge: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusSent: { backgroundColor: Colors.status.successLight },
  statusFailed: { backgroundColor: Colors.status.errorLight },
  statusTextSent: { fontSize: 12, fontWeight: '600', color: Colors.status.success },
  statusTextFailed: { fontSize: 12, fontWeight: '600', color: Colors.status.error },
  sendingText: { fontSize: 14, color: Colors.text.tertiary },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.neutral.borderLight,
  },
});
