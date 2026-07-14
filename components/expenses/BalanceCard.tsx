import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import DebtRow from './DebtRow';
import { Transaction } from '@/lib/utils/splitCalculator';
import { colors, radius, shadows, spacing, typography } from '@/constants/tokens';
import { User } from '@/types';

interface BalanceCardProps {
  transactions: Transaction[];
  netBalance: number;
  currentUserId: string;
  members: Pick<User, 'id' | 'full_name' | 'avatar_url'>[];
  currency?: string;
  isLoading?: boolean;
  onSettleUp: (creditorId: string) => void;
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function findMember(
  members: Pick<User, 'id' | 'full_name' | 'avatar_url'>[],
  userId: string,
) {
  return members.find((m) => m.id === userId);
}

export default function BalanceCard({
  transactions,
  netBalance,
  currentUserId,
  members,
  currency = 'USD',
  isLoading = false,
  onSettleUp,
}: BalanceCardProps) {
  const EPSILON = 0.01;
  const isSettled = Math.abs(netBalance) < EPSILON && transactions.length === 0;
  const isOwed = netBalance > EPSILON;
  const isOwe = netBalance < -EPSILON;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Your Balance</Text>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.neutral[300]} />
          <Text style={styles.loadingText}>Recalculating…</Text>
        </View>
      ) : (
        <>
          <View style={styles.netRow}>
            {isSettled ? (
              <View style={styles.settledRow}>
                <Text style={styles.settledCheck}>✓</Text>
                <Text style={styles.settledText}>You are all settled up</Text>
              </View>
            ) : isOwed ? (
              <Text style={styles.netLabel}>
                You are owed{' '}
                <Text style={styles.netAmountGreen}>{fmt(netBalance, currency)}</Text>
              </Text>
            ) : (
              <Text style={styles.netLabel}>
                You owe{' '}
                <Text style={styles.netAmountRed}>{fmt(Math.abs(netBalance), currency)}</Text>{' '}
                net
              </Text>
            )}
          </View>

          {transactions.length > 0 && (
            <>
              <View style={styles.divider} />
              {transactions.map((t, idx) => {
                const isOweTransaction = t.from === currentUserId;
                const counterpartId = isOweTransaction ? t.to : t.from;
                const counterpart = findMember(members, counterpartId);
                return (
                  <DebtRow
                    key={`${t.from}-${t.to}-${idx}`}
                    name={counterpart?.full_name ?? 'Member'}
                    avatarUrl={counterpart?.avatar_url}
                    amount={t.amount}
                    currency={currency}
                    direction={isOweTransaction ? 'owe' : 'owed'}
                    onSettleUp={isOweTransaction ? () => onSettleUp(t.to) : undefined}
                  />
                );
              })}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[2],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  netRow: {
    paddingVertical: spacing[1],
  },
  settledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  settledCheck: {
    fontSize: 18,
    color: colors.success,
  },
  settledText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.success,
  },
  netLabel: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[700],
  },
  netAmountRed: {
    fontFamily: typography.fonts.bold,
    color: colors.error,
  },
  netAmountGreen: {
    fontFamily: typography.fonts.bold,
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing[2],
  },
});
