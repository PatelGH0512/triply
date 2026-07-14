export type Split = {
  userId: string;
  amount: number;
};

export type Transaction = {
  from: string;
  to: string;
  amount: number;
};

export type SplitType = 'equal' | 'percentage' | 'custom';

/**
 * Calculates how much each member owes for an expense.
 *
 * Rules:
 * - The payer's split is always $0 (they already paid).
 * - Raw amounts for all members (including payer) are calculated first and
 *   must sum exactly to totalAmount (assertion enforced).
 * - The first non-payer member absorbs any rounding remainder so the total
 *   of non-payer splits is always a precise integer number of cents.
 *
 * @param totalAmount  The total expense in dollars.
 * @param paidBy       userId of the person who paid.
 * @param members      All userIds to split between (must include paidBy).
 * @param splitType    'equal' | 'percentage' | 'custom'
 * @param values       For 'percentage': { userId: pct (0-100) }
 *                     For 'custom':     { userId: dollarAmount }
 *                     Unused for 'equal'.
 */
export function calculateSplits(
  totalAmount: number,
  paidBy: string,
  members: string[],
  splitType: SplitType,
  values: Record<string, number> = {},
): Split[] {
  if (members.length === 0) throw new Error('[splitCalculator] members array is empty');

  const totalCents = Math.round(totalAmount * 100);
  let rawCents: number[];

  if (splitType === 'equal') {
    const n = members.length;
    const baseCents = Math.floor(totalCents / n);
    const remainder = totalCents - baseCents * n;
    rawCents = members.map((_, i) => baseCents + (i < remainder ? 1 : 0));
  } else if (splitType === 'percentage') {
    rawCents = members.map((uid) => Math.round(((values[uid] ?? 0) / 100) * totalCents));
    const drift = totalCents - rawCents.reduce((a, b) => a + b, 0);
    rawCents[0] += drift;
  } else {
    rawCents = members.map((uid) => Math.round((values[uid] ?? 0) * 100));
    const drift = totalCents - rawCents.reduce((a, b) => a + b, 0);
    rawCents[0] += drift;
  }

  const rawSum = rawCents.reduce((a, b) => a + b, 0);
  if (rawSum !== totalCents) {
    throw new Error(
      `[splitCalculator] Raw split sum (${rawSum / 100}) ≠ totalAmount (${totalAmount}). Bug in rounding logic.`,
    );
  }

  return members.map((userId, i) => ({
    userId,
    amount: userId === paidBy ? 0 : rawCents[i] / 100,
  }));
}

/**
 * Simplifies a set of debts into the minimum number of transactions using
 * the greedy creditor/debtor matching algorithm.
 *
 * Input: net balance per userId.
 *   Positive balance = this person is owed money (creditor).
 *   Negative balance = this person owes money (debtor).
 *
 * Algorithm:
 *   1. Separate into creditors and debtors, sorted by absolute value desc.
 *   2. Match the largest debtor to the largest creditor.
 *   3. Settle min(|debt|, |credit|), carry remainder forward.
 *   4. Repeat until all balances are zero.
 */
export function simplifyDebts(balances: Record<string, number>): Transaction[] {
  const EPSILON = 0.005;

  const creditors = Object.entries(balances)
    .filter(([, v]) => v > EPSILON)
    .map(([userId, amount]) => ({ userId, amount: Math.round(amount * 100) }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -EPSILON)
    .map(([userId, amount]) => ({ userId, amount: Math.round(Math.abs(amount) * 100) }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amount, debtors[di].amount);

    if (settle > 0) {
      transactions.push({
        from: debtors[di].userId,
        to: creditors[ci].userId,
        amount: Math.round(settle) / 100,
      });
    }

    creditors[ci].amount -= settle;
    debtors[di].amount -= settle;

    if (creditors[ci].amount < 1) ci++;
    if (debtors[di].amount < 1) di++;
  }

  return transactions;
}

/**
 * Computes net balances for all users given a list of expenses + splits.
 *
 * For each unsettled split:
 *   - Payer's net += split.amount  (they are owed)
 *   - Member's net -= split.amount (they owe)
 *
 * Settled splits are excluded — they are already resolved.
 */
export function computeNetBalances(
  expenses: Array<{
    paid_by: string;
    splits?: Array<{ user_id: string; amount: number; settled: boolean }>;
  }>,
): Record<string, number> {
  const net: Record<string, number> = {};

  for (const expense of expenses) {
    const payer = expense.paid_by;
    for (const split of expense.splits ?? []) {
      if (split.user_id === payer || split.amount === 0 || split.settled) continue;
      net[payer] = (net[payer] ?? 0) + split.amount;
      net[split.user_id] = (net[split.user_id] ?? 0) - split.amount;
    }
  }

  return net;
}
