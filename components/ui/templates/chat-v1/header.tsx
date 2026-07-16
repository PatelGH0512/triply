import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants/tokens';
import type { AIHeaderProps } from './types';

export function ChatHeader({ destination, dateRange }: AIHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.iconBadge}>
          <Ionicons name="sparkles" size={16} color={colors.primary[400]} />
        </View>
        <View>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {destination} · {dateRange}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
    marginTop: 1,
  },
});
