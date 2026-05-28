import { supabase } from '../supabase';
import { Expense, ExpenseSplit } from '@/types';

export async function getExpensesByTrip(tripId: string): Promise<Expense[]> {
  return [];
}

export async function createExpense(data: Partial<Expense>): Promise<Expense | null> {
  return null;
}

export async function updateExpense(
  expenseId: string,
  data: Partial<Expense>,
): Promise<Expense | null> {
  return null;
}

export async function deleteExpense(expenseId: string): Promise<void> {}

export async function settleExpenseSplit(splitId: string): Promise<void> {}

export async function getExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
  return [];
}
