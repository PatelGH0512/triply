import { supabase } from '../supabase';
import { Expense, ExpenseSplit } from '@/types';
import { ExpenseCategory } from '@/constants/enums';
import { calculateSplits, computeNetBalances, simplifyDebts, SplitType, Transaction } from '@/lib/utils/splitCalculator';

export interface CreateExpenseInput {
  tripId: string;
  activityId?: string | null;
  paidBy: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  receiptUrl?: string | null;
  members: string[];
  splitType: SplitType;
  values: Record<string, number>;
}

export interface UpdateExpenseInput extends Omit<CreateExpenseInput, 'tripId'> {
  expenseId: string;
}

const EXPENSE_SELECT = `
  id,
  trip_id,
  activity_id,
  paid_by,
  title,
  amount,
  currency,
  category,
  receipt_url,
  created_at,
  updated_at,
  payer:users!paid_by(id, full_name, avatar_url),
  splits:expense_splits(
    id,
    expense_id,
    user_id,
    amount,
    settled,
    settled_at,
    user:users(id, full_name, avatar_url)
  )
`.trim();

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getExpenses]', error.message);
    return [];
  }

  return (data ?? []) as unknown as Expense[];
}

export async function getExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
  const { data, error } = await supabase
    .from('expense_splits')
    .select('id, expense_id, user_id, amount, settled, settled_at, user:users(id, full_name, avatar_url)')
    .eq('expense_id', expenseId);

  if (error) {
    console.error('[getExpenseSplits]', error.message);
    return [];
  }

  return (data ?? []) as unknown as ExpenseSplit[];
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense | null> {
  const splits = calculateSplits(input.amount, input.paidBy, input.members, input.splitType, input.values);

  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      trip_id: input.tripId,
      activity_id: input.activityId ?? null,
      paid_by: input.paidBy,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      receipt_url: input.receiptUrl ?? null,
    })
    .select('id')
    .single();

  if (expenseError || !expenseData) {
    console.error('[createExpense]', expenseError?.message);
    return null;
  }

  const expenseId = expenseData.id;
  const splitRows = splits.map((s) => ({
    expense_id: expenseId,
    user_id: s.userId,
    amount: s.amount,
    settled: s.userId === input.paidBy,
    settled_at: s.userId === input.paidBy ? new Date().toISOString() : null,
  }));

  const { error: splitError } = await supabase.from('expense_splits').insert(splitRows);
  if (splitError) {
    console.error('[createExpense] splits insert failed:', splitError.message);
    await supabase.from('expenses').delete().eq('id', expenseId);
    return null;
  }

  const { data: full } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('id', expenseId)
    .single();

  return (full ?? null) as unknown as Expense;
}

export async function updateExpense(input: UpdateExpenseInput): Promise<Expense | null> {
  const splits = calculateSplits(input.amount, input.paidBy, input.members, input.splitType, input.values);

  const { error: updateError } = await supabase
    .from('expenses')
    .update({
      activity_id: input.activityId ?? null,
      paid_by: input.paidBy,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      receipt_url: input.receiptUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.expenseId);

  if (updateError) {
    console.error('[updateExpense]', updateError.message);
    return null;
  }

  const { error: deleteError } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', input.expenseId);

  if (deleteError) {
    console.error('[updateExpense] splits delete failed:', deleteError.message);
    return null;
  }

  const splitRows = splits.map((s) => ({
    expense_id: input.expenseId,
    user_id: s.userId,
    amount: s.amount,
    settled: s.userId === input.paidBy,
    settled_at: s.userId === input.paidBy ? new Date().toISOString() : null,
  }));

  const { error: insertError } = await supabase.from('expense_splits').insert(splitRows);
  if (insertError) {
    console.error('[updateExpense] splits insert failed:', insertError.message);
    return null;
  }

  const { data: full } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('id', input.expenseId)
    .single();

  return (full ?? null) as unknown as Expense;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) console.error('[deleteExpense]', error.message);
}

export async function settleUp(expenseIds: string[], userId: string): Promise<void> {
  const { error } = await supabase
    .from('expense_splits')
    .update({ settled: true, settled_at: new Date().toISOString() })
    .in('expense_id', expenseIds)
    .eq('user_id', userId);

  if (error) console.error('[settleUp]', error.message);
}

export interface BalanceResult {
  transactions: Transaction[];
  netBalance: number;
}

export async function getBalances(tripId: string, userId: string): Promise<BalanceResult> {
  const expenses = await getExpenses(tripId);
  const net = computeNetBalances(expenses as any);
  const allTransactions = simplifyDebts(net);

  const transactions = allTransactions.filter((t) => t.from === userId || t.to === userId);
  const netBalance = net[userId] ?? 0;

  return { transactions, netBalance };
}

export interface TripSummary {
  totalSpent: number;
  perCategoryBreakdown: Array<{ category: ExpenseCategory; amount: number; percentage: number }>;
}

export async function getTripSummary(tripId: string): Promise<TripSummary> {
  const expenses = await getExpenses(tripId);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap: Partial<Record<ExpenseCategory, number>> = {};
  for (const expense of expenses) {
    categoryMap[expense.category] = (categoryMap[expense.category] ?? 0) + expense.amount;
  }

  const perCategoryBreakdown = Object.entries(categoryMap).map(([cat, amount]) => ({
    category: cat as ExpenseCategory,
    amount: amount!,
    percentage: totalSpent > 0 ? Math.round((amount! / totalSpent) * 100) : 0,
  }));

  return { totalSpent, perCategoryBreakdown };
}
