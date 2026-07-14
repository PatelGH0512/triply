import { View, Text, StyleSheet } from 'react-native';
import { GlassView } from '@/components/ui/GlassView';
import { CATEGORY_META } from './CategoryIcon';
import { Expense } from '@/types';
import { ExpenseCategory } from '@/constants/enums';
import { colors, radius, spacing, typography } from '@/constants/tokens';

interface ExpenseSummaryCardProps {
  expenses: Expense[];
  memberCount: number;
  currency?: string;
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const MIN_SEGMENT_WIDTH = 6;

export default function ExpenseSummaryCard({
  expenses,
  memberCount,
  currency = 'USD',
}: ExpenseSummaryCardProps) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = memberCount > 0 ? totalSpent / memberCount : 0;

  const categoryMap: Partial<Record<ExpenseCategory, number>> = {};
  for (const expense of expenses) {
    categoryMap[expense.category] = (categoryMap[expense.category] ?? 0) + expense.amount;
  }

  const presentCategories = Object.entries(categoryMap) as [ExpenseCategory, number][];
  const numCategories = presentCategories.length;

  return (
    <GlassView style={styles.card}>
      <Text style={styles.cardLabel}>Total Trip Spend</Text>
      <Text style={styles.total}>{fmt(totalSpent, currency)}</Text>
      <Text style={styles.sub}>
        {memberCount} {memberCount === 1 ? 'member' : 'members'} · {fmt(avg, currency)} avg
      </Text>

      {numCategories > 0 && (
        <>
          <CategoryBar
            categories={presentCategories}
            total={totalSpent}
            numCategories={numCategories}
          />
          <View style={styles.legend}>
            {presentCategories.map(([cat, amount]) => {
              const meta = CATEGORY_META[cat];
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              return (
                <View key={cat} style={styles.legendItem}>
                  <Text style={styles.legendEmoji}>{meta.emoji}</Text>
                  <Text style={styles.legendPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </GlassView>
  );
}

function CategoryBar({
  categories,
  total,
  numCategories,
}: {
  categories: [ExpenseCategory, number][];
  total: number;
  numCategories: number;
}) {
  const reservedWidth = MIN_SEGMENT_WIDTH * numCategories;

  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
        {categories.map(([cat, amount], idx) => {
          const rawPct = total > 0 ? (amount / total) * 100 : 0;
          const meta = CATEGORY_META[cat];
          const isLast = idx === categories.length - 1;

          return (
            <View
              key={cat}
              style={[
                styles.segment,
                {
                  flexGrow: Math.max(rawPct, 0),
                  minWidth: MIN_SEGMENT_WIDTH,
                  backgroundColor: meta.color,
                  borderTopRightRadius: isLast ? radius.full : 0,
                  borderBottomRightRadius: isLast ? radius.full : 0,
                  borderTopLeftRadius: idx === 0 ? radius.full : 0,
                  borderBottomLeftRadius: idx === 0 ? radius.full : 0,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  cardLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  total: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
    lineHeight: 40,
  },
  sub: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
  },
  barWrap: {
    marginTop: spacing[2],
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendEmoji: {
    fontSize: 13,
  },
  legendPct: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
  },
});
