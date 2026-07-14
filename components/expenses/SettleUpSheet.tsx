import { forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Expense, User } from '@/types';
import { colors, radius, shadows, spacing, typography } from '@/constants/tokens';

interface SettleUpSheetProps {
  creditorId: string;
  creditorName: string;
  creditorAvatar?: string | null;
  totalAmount: number;
  currency?: string;
  expenses: Expense[];
  currentUserId: string;
  onSettle: (expenseIds: string[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export const SettleUpSheet = forwardRef<BottomSheet, SettleUpSheetProps>(
  function SettleUpSheet(
    {
      creditorId,
      creditorName,
      creditorAvatar,
      totalAmount,
      currency = 'USD',
      expenses,
      currentUserId,
      onSettle,
      onClose,
      isLoading = false,
    },
    ref,
  ) {
    const contributingExpenses = expenses.filter((expense) => {
      if (expense.paid_by !== creditorId) return false;
      const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
      return mySplit && !mySplit.settled && mySplit.amount > 0;
    });

    const expenseIds = contributingExpenses.map((e) => e.id);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['60%', '85%']}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Avatar uri={creditorAvatar} name={creditorName} size="lg" />
            <View style={styles.headerText}>
              <Text style={styles.headerLabel}>You owe {creditorName}</Text>
              <Text style={styles.headerAmount}>{fmt(totalAmount, currency)}</Text>
            </View>
          </View>

          {/* Contributing expenses */}
          {contributingExpenses.length > 0 && (
            <View style={styles.breakdownCard}>
              {contributingExpenses.map((expense, idx) => {
                const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
                const isLast = idx === contributingExpenses.length - 1;
                return (
                  <View key={expense.id}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownTitle} numberOfLines={1}>
                        {expense.title}
                      </Text>
                      <Text style={styles.breakdownAmount}>
                        {fmt(mySplit?.amount ?? 0, currency)}
                      </Text>
                    </View>
                    {!isLast && <View style={styles.divider} />}
                  </View>
                );
              })}
              <View style={styles.totalDivider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{fmt(totalAmount, currency)}</Text>
              </View>
            </View>
          )}

          {/* Mark settled button */}
          <Button
            onPress={() => onSettle(expenseIds)}
            loading={isLoading}
            style={styles.settleBtn}
          >
            Mark as Settled
          </Button>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Settlement happens in person. Triply doesn't process any payments.
          </Text>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: 'rgba(250, 249, 247, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: radius.full,
  },
  content: {
    padding: spacing[5],
    gap: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingBottom: spacing[2],
  },
  headerText: {
    gap: 4,
  },
  headerLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
  },
  headerAmount: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.error,
  },
  breakdownCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  breakdownTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[700],
  },
  breakdownAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[1],
  },
  totalLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  totalAmount: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.error,
  },
  settleBtn: {
    marginTop: spacing[2],
  },
  disclaimer: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
});
