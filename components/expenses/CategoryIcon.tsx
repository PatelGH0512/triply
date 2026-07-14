import { View, Text, StyleSheet } from 'react-native';
import { ExpenseCategory } from '@/constants/enums';
import { radius } from '@/constants/tokens';

export const CATEGORY_META: Record<
  ExpenseCategory,
  { emoji: string; bg: string; color: string }
> = {
  [ExpenseCategory.Food]:          { emoji: '🍽️', bg: '#FFF1EE', color: '#FF6B4A' },
  [ExpenseCategory.Transport]:     { emoji: '🚗', bg: '#FFF8E8', color: '#F5A623' },
  [ExpenseCategory.Accommodation]: { emoji: '🏨', bg: '#F3EEF9', color: '#9B59B6' },
  [ExpenseCategory.Entertainment]: { emoji: '🎭', bg: '#E8F9F5', color: '#06D6A0' },
  [ExpenseCategory.Shopping]:      { emoji: '🛍️', bg: '#FEE8F4', color: '#E91E8C' },
  [ExpenseCategory.Health]:        { emoji: '💊', bg: '#E8F5EA', color: '#2ECC71' },
  [ExpenseCategory.Other]:         { emoji: '📦', bg: '#F3F1EE', color: '#827C74' },
};

interface CategoryIconProps {
  category: ExpenseCategory;
  size?: number;
}

export default function CategoryIcon({ category, size = 40 }: CategoryIconProps) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META[ExpenseCategory.Other];
  const fontSize = size * 0.44;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor: meta.bg,
        },
      ]}
    >
      <Text style={{ fontSize }}>{meta.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
