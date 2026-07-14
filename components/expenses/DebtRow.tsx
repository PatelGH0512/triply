import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { colors, radius, spacing, typography } from '@/constants/tokens';

interface DebtRowProps {
  name: string;
  avatarUrl?: string | null;
  amount: number;
  currency?: string;
  direction: 'owe' | 'owed';
  onSettleUp?: () => void;
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function DebtRow({
  name,
  avatarUrl,
  amount,
  currency = 'USD',
  direction,
  onSettleUp,
}: DebtRowProps) {
  const isOwe = direction === 'owe';

  return (
    <View style={styles.row}>
      <Avatar uri={avatarUrl} name={name} size="sm" />

      <View style={styles.info}>
        <Text style={styles.label}>
          {isOwe ? (
            <>
              <Text style={styles.arrow}>→ </Text>
              {'You owe '}
              <Text style={styles.name}>{name}</Text>
            </>
          ) : (
            <>
              <Text style={styles.arrowGreen}>← </Text>
              <Text style={styles.name}>{name}</Text>
              {' owes you'}
            </>
          )}
        </Text>
        <Text style={[styles.amount, isOwe ? styles.amountOwe : styles.amountOwed]}>
          {fmt(amount, currency)}
        </Text>
      </View>

      {isOwe && onSettleUp ? (
        <TouchableOpacity style={styles.btn} onPress={onSettleUp} activeOpacity={0.75}>
          <Text style={styles.btnText}>Settle Up</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.btn, styles.btnDisabled]}>
          <Text style={[styles.btnText, styles.btnTextDisabled]}>Remind</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  name: {
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  arrow: {
    color: colors.error,
    fontFamily: typography.fonts.semibold,
  },
  arrowGreen: {
    color: colors.success,
    fontFamily: typography.fonts.semibold,
  },
  amount: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
  },
  amountOwe: {
    color: colors.error,
  },
  amountOwed: {
    color: colors.success,
  },
  btn: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary[400],
  },
  btnDisabled: {
    backgroundColor: colors.neutral[100],
  },
  btnText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[0],
  },
  btnTextDisabled: {
    color: colors.neutral[400],
  },
});
