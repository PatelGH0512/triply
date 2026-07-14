import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTripContext } from '@/lib/context/TripContext';
import { useAuthStore } from '@/store/authStore';
import {
  useExpenses,
  useBalances,
  useTripSummary,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useSettleUp,
} from '@/hooks/useExpenses';
import { TripStatus } from '@/constants/enums';
import ExpenseSummaryCard from '@/components/expenses/ExpenseSummaryCard';
import BalanceCard from '@/components/expenses/BalanceCard';
import ExpenseItem from '@/components/expenses/ExpenseItem';
import { ExpenseSheet } from '@/components/expenses/ExpenseSheet';
import { SettleUpSheet } from '@/components/expenses/SettleUpSheet';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Expense, User } from '@/types';
import { CreateExpenseInput, UpdateExpenseInput } from '@/lib/api/expenses';
import { colors, radius, shadows, spacing, typography } from '@/constants/tokens';
import Colors from '@/constants/colors';

interface SettleTarget {
  creditorId: string;
  creditorName: string;
  creditorAvatar?: string | null;
  totalAmount: number;
}

export default function ExpensesScreen() {
  const { tripId, trip, isAdmin } = useTripContext();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? '';

  const expenseSheetRef = useRef<BottomSheet>(null);
  const settleSheetRef = useRef<BottomSheet>(null);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(tripId);
  const { data: balanceData, isLoading: balancesLoading } = useBalances(tripId);

  const isCompleted = trip.status === TripStatus.Completed;
  const { data: summary } = useTripSummary(tripId, isCompleted);

  const createExpenseMutation = useCreateExpense(tripId);
  const updateExpenseMutation = useUpdateExpense(tripId);
  const deleteExpenseMutation = useDeleteExpense(tripId);
  const settleUpMutation = useSettleUp(tripId);

  const members: Pick<User, 'id' | 'full_name' | 'avatar_url'>[] =
    trip.trip_members?.map((m) => ({
      id: m.user_id,
      full_name: (m as any).users?.full_name ?? 'Member',
      avatar_url: (m as any).users?.avatar_url ?? null,
    })) ?? [];

  const memberCount = members.length;
  const currency = expenses[0]?.currency ?? 'USD';

  function openAddExpense() {
    setEditingExpense(null);
    expenseSheetRef.current?.expand();
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    expenseSheetRef.current?.expand();
  }

  function openSettleUp(creditorId: string) {
    const creditor = members.find((m) => m.id === creditorId);
    const tx = balanceData?.transactions.find(
      (t) => t.from === currentUserId && t.to === creditorId,
    );
    if (!tx) return;
    setSettleTarget({
      creditorId,
      creditorName: creditor?.full_name ?? 'Member',
      creditorAvatar: creditor?.avatar_url,
      totalAmount: tx.amount,
    });
    settleSheetRef.current?.expand();
  }

  function handleCreateExpense(input: CreateExpenseInput) {
    createExpenseMutation.mutate(input, {
      onSuccess: () => expenseSheetRef.current?.close(),
    });
  }

  function handleUpdateExpense(input: UpdateExpenseInput) {
    updateExpenseMutation.mutate(input, {
      onSuccess: () => expenseSheetRef.current?.close(),
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteExpenseMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  function handleSettle(expenseIds: string[]) {
    settleUpMutation.mutate(
      { expenseIds, targetUserId: currentUserId },
      { onSuccess: () => settleSheetRef.current?.close() },
    );
  }

  const myTotalShare = expenses.reduce((sum, e) => {
    const split = e.splits?.find((s) => s.user_id === currentUserId);
    return sum + (split?.amount ?? 0);
  }, 0);

  const mySettled = expenses.reduce((sum, e) => {
    const split = e.splits?.find((s) => s.user_id === currentUserId && s.settled);
    return sum + (split?.amount ?? 0);
  }, 0);

  const stillOwed = Math.max(0, myTotalShare - mySettled);

  if (expensesLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Screen header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddExpense} activeOpacity={0.75}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post-trip summary */}
        {isCompleted && (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>Trip Complete 🎉</Text>
            <View style={styles.completedDivider} />
            <View style={styles.summaryGrid}>
              <SummaryRow
                label="Total Spent"
                value={`$${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}`}
              />
              <SummaryRow label="Your Total Share" value={`$${myTotalShare.toFixed(2)}`} />
              <SummaryRow label="You Settled" value={`$${mySettled.toFixed(2)}`} />
              <SummaryRow
                label="Still Owed"
                value={`$${stillOwed.toFixed(2)}`}
                valueColor={stillOwed > 0 ? colors.error : colors.success}
              />
            </View>
            {summary && summary.perCategoryBreakdown.length > 0 && (
              <>
                <View style={styles.completedDivider} />
                <Text style={styles.perCatTitle}>Per Category</Text>
                {summary.perCategoryBreakdown.map((row) => (
                  <View key={row.category} style={styles.catRow}>
                    <Text style={styles.catLabel}>
                      {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
                    </Text>
                    <Text style={styles.catAmount}>${row.amount.toFixed(2)}</Text>
                    <Text style={styles.catPct}>({row.percentage}%)</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Summary card */}
        {expenses.length > 0 && (
          <ExpenseSummaryCard expenses={expenses} memberCount={memberCount} currency={currency} />
        )}

        {/* Balance card */}
        {balanceData && (
          <BalanceCard
            transactions={balanceData.transactions}
            netBalance={balanceData.netBalance}
            currentUserId={currentUserId}
            members={members}
            currency={currency}
            isLoading={balancesLoading}
            onSettleUp={openSettleUp}
          />
        )}

        {/* All expenses list */}
        <Text style={styles.sectionHeader}>All Expenses</Text>

        {expenses.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses yet"
            subtitle="Log your first expense when the trip starts."
          />
        ) : (
          <View style={styles.list}>
            {expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onEdit={openEditExpense}
                onDelete={setDeleteTarget}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add / Edit expense sheet */}
      <ExpenseSheet
        ref={expenseSheetRef}
        members={members}
        currentUserId={currentUserId}
        tripId={tripId}
        defaultCurrency={currency}
        editingExpense={editingExpense}
        onSubmitCreate={handleCreateExpense}
        onSubmitUpdate={handleUpdateExpense}
        onClose={() => expenseSheetRef.current?.close()}
        isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      {/* Settle up sheet */}
      {settleTarget && (
        <SettleUpSheet
          ref={settleSheetRef}
          creditorId={settleTarget.creditorId}
          creditorName={settleTarget.creditorName}
          creditorAvatar={settleTarget.creditorAvatar}
          totalAmount={settleTarget.totalAmount}
          currency={currency}
          expenses={expenses}
          currentUserId={currentUserId}
          onSettle={handleSettle}
          onClose={() => settleSheetRef.current?.close()}
          isLoading={settleUpMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete expense?"
        message="This will affect everyone's balance and cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: Colors.neutral.background,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  addBtnText: {
    fontSize: 22,
    color: colors.neutral[0],
    lineHeight: 28,
    fontFamily: typography.fonts.regular,
    marginTop: -2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[3],
  },
  completedCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[5],
    ...shadows.md,
  },
  completedTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[800],
    marginBottom: spacing[3],
  },
  completedDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing[3],
  },
  summaryGrid: {
    gap: spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  perCatTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing[2],
  },
  catLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
  },
  catAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  catPct: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    minWidth: 40,
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[700],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  list: {
    paddingHorizontal: spacing[4],
  },
});
