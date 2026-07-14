import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import CategoryIcon from './CategoryIcon';
import Avatar from '@/components/ui/Avatar';
import { Expense } from '@/types';
import { colors, radius, shadows, spacing, typography } from '@/constants/tokens';

interface ExpenseItemProps {
  expense: Expense;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ExpenseItem({
  expense,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: ExpenseItemProps) {
  const [expanded, setExpanded] = useState(false);

  const myUserSplit = expense.splits?.find((s) => s.user_id === currentUserId);
  const myShare = myUserSplit?.amount ?? 0;
  const splitCount = expense.splits?.filter((s) => s.amount > 0 || s.user_id === expense.paid_by).length ?? 0;
  const payerName = expense.payer?.full_name ?? 'Someone';
  const isMyExpense = expense.paid_by === currentUserId;
  const canEdit = isMyExpense;
  const canDelete = isMyExpense || isAdmin;

  function handleLongPress() {
    if (!canEdit && !canDelete) return;

    const options: string[] = [];
    if (canEdit) options.push('Edit');
    if (canDelete) options.push('Delete');
    options.push('Cancel');

    const destructiveIndex = options.indexOf('Delete');
    const cancelIndex = options.indexOf('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        (idx) => {
          if (options[idx] === 'Edit') onEdit(expense);
          if (options[idx] === 'Delete') onDelete(expense);
        },
      );
    } else {
      Alert.alert(expense.title, undefined, [
        ...(canEdit ? [{ text: 'Edit', onPress: () => onEdit(expense) }] : []),
        ...(canDelete
          ? [{ text: 'Delete', style: 'destructive' as const, onPress: () => onDelete(expense) }]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((v) => !v)}
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={0.8}
    >
      <View style={styles.main}>
        <CategoryIcon category={expense.category} size={44} />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {expense.title}
          </Text>
          <Text style={styles.meta}>
            {payerName === expense.payer?.full_name && expense.paid_by === currentUserId
              ? 'You paid'
              : `${payerName} paid`}{' '}
            · {splitCount > 0 ? `Split ${splitCount} ways` : 'No split'}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.total}>{fmt(expense.amount, expense.currency)}</Text>
          {myShare > 0 && !myUserSplit?.settled ? (
            <Text style={styles.yourShare}>you owe {fmt(myShare, expense.currency)}</Text>
          ) : myUserSplit?.settled && expense.paid_by !== currentUserId ? (
            <Text style={styles.settled}>settled ✓</Text>
          ) : expense.paid_by === currentUserId ? (
            <Text style={styles.youPaid}>you paid</Text>
          ) : null}
        </View>
      </View>

      {expanded && (
        <View style={styles.breakdown}>
          <View style={styles.divider} />
          <View style={styles.payerRow}>
            <Avatar
              uri={expense.payer?.avatar_url}
              name={expense.payer?.full_name}
              size="sm"
            />
            <Text style={styles.breakdownName}>
              {expense.paid_by === currentUserId ? 'You' : payerName}
            </Text>
            <Text style={styles.breakdownNote}>paid {fmt(expense.amount, expense.currency)}</Text>
          </View>
          <View style={styles.divider} />
          {expense.splits
            ?.slice()
            .sort((a, b) => {
              if (a.user_id === expense.paid_by) return -1;
              if (b.user_id === expense.paid_by) return 1;
              return 0;
            })
            .map((split) => {
              const isPayer = split.user_id === expense.paid_by;
              const isMe = split.user_id === currentUserId;
              const displayName = isPayer
                ? isMe
                  ? 'You'
                  : split.user?.full_name ?? 'Member'
                : isMe
                  ? 'You'
                  : split.user?.full_name ?? 'Member';

              return (
                <View key={split.id} style={styles.splitRow}>
                  <Avatar uri={split.user?.avatar_url} name={split.user?.full_name} size="sm" />
                  <Text style={styles.breakdownName}>{displayName}</Text>
                  <View style={styles.splitRight}>
                    {isPayer ? (
                      <Text style={styles.splitPaid}>$0 (paid)</Text>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.splitAmount,
                            split.settled && styles.splitAmountSettled,
                          ]}
                        >
                          {fmt(split.amount, expense.currency)}
                        </Text>
                        {split.settled && <Text style={styles.settledBadge}>✓</Text>}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[4],
    ...shadows.sm,
    marginBottom: spacing[3],
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  meta: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  total: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[800],
  },
  yourShare: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.error,
  },
  settled: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.success,
  },
  youPaid: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  breakdown: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 2,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  breakdownName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[700],
  },
  breakdownNote: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[600],
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  splitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splitAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.error,
  },
  splitAmountSettled: {
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  splitPaid: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  settledBadge: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontFamily: typography.fonts.bold,
  },
});
