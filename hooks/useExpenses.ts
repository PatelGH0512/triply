import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  getExpenses,
  getBalances,
  getTripSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  settleUp,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '@/lib/api/expenses';
import { Expense } from '@/types';

function expensesKey(tripId: string) {
  return ['expenses', tripId];
}

function balancesKey(tripId: string, userId: string) {
  return ['balances', tripId, userId];
}

function summaryKey(tripId: string) {
  return ['tripSummary', tripId];
}

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: expensesKey(tripId),
    queryFn: () => getExpenses(tripId),
    enabled: !!tripId,
  });
}

export function useBalances(tripId: string) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: balancesKey(tripId, userId),
    queryFn: () => getBalances(tripId, userId),
    enabled: !!tripId && !!userId,
  });
}

export function useTripSummary(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: summaryKey(tripId),
    queryFn: () => getTripSummary(tripId),
    enabled: enabled && !!tripId,
  });
}

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: expensesKey(tripId) });
      const prev = queryClient.getQueryData(expensesKey(tripId));

      const optimistic: Partial<Expense> = {
        id: `optimistic_${Date.now()}`,
        trip_id: tripId,
        paid_by: input.paidBy,
        title: input.title,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        receipt_url: input.receiptUrl ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: [],
      };

      queryClient.setQueryData<Expense[]>(expensesKey(tripId), (old) =>
        old ? [optimistic as Expense, ...old] : [optimistic as Expense],
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(expensesKey(tripId), ctx.prev);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey(tripId) });
      queryClient.invalidateQueries({ queryKey: balancesKey(tripId, userId) });
    },
  });
}

export function useUpdateExpense(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => updateExpense(input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey(tripId) });
      queryClient.invalidateQueries({ queryKey: balancesKey(tripId, userId) });
    },
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),

    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: expensesKey(tripId) });
      const prev = queryClient.getQueryData(expensesKey(tripId));

      queryClient.setQueryData<Expense[]>(expensesKey(tripId), (old) =>
        old ? old.filter((e) => e.id !== expenseId) : [],
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(expensesKey(tripId), ctx.prev);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey(tripId) });
      queryClient.invalidateQueries({ queryKey: balancesKey(tripId, userId) });
    },
  });
}

export function useSettleUp(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: ({ expenseIds, targetUserId }: { expenseIds: string[]; targetUserId: string }) =>
      settleUp(expenseIds, targetUserId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey(tripId) });
      queryClient.invalidateQueries({ queryKey: balancesKey(tripId, userId) });
    },
  });
}
