import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { colors, typography, spacing } from '@/constants/tokens';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

interface DateSeparatorProps {
  date: string;
}

function formatDate(dateStr: string): string {
  const d = dayjs(dateStr);
  if (d.isToday()) return 'Today';
  if (d.isYesterday()) return 'Yesterday';
  return d.format('MMMM D');
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{formatDate(date)}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  label: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
    paddingHorizontal: spacing[2],
  },
});
