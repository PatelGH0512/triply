import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { colors, radius, spacing, typography } from '@/constants/tokens';
import { User } from '@/types';

interface SplitSelectorProps {
  members: Pick<User, 'id' | 'full_name' | 'avatar_url'>[];
  selected: string[];
  onToggle: (userId: string) => void;
}

export default function SplitSelector({ members, selected, onToggle }: SplitSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Split between</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {members.map((member) => {
          const isSelected = selected.includes(member.id);
          return (
            <TouchableOpacity
              key={member.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(member.id)}
              activeOpacity={0.75}
            >
              <Avatar uri={member.avatar_url} name={member.full_name} size="sm" />
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {member.full_name.split(' ')[0]}
              </Text>
              {isSelected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[600],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
    maxWidth: 64,
  },
  chipTextSelected: {
    color: colors.primary[500],
  },
  check: {
    fontSize: 10,
    color: colors.primary[400],
    fontFamily: typography.fonts.bold,
  },
});
