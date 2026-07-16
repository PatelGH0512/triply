import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { IChipGrid } from './types';
import { colors, typography, radius } from '@/constants/tokens';

export const EmptyChipGrid: React.FC<IChipGrid> = ({
  options,
  columns = 2,
  gap = 12,
  containerStyle,
  chipStyle,
  labelStyle,
  iconStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {chunkArray(options, columns).map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.row, { marginTop: rowIdx === 0 ? 0 : gap }]}>
          {row.map((item, colIdx) => (
            <TouchableOpacity
              key={`${rowIdx}-${colIdx}`}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={[
                styles.chip,
                chipStyle,
                {
                  marginLeft: colIdx === 0 ? 0 : gap,
                },
              ]}
            >
              <View style={[styles.iconWrapper, iconStyle]}>{item.icon}</View>
              <Text style={[styles.label, labelStyle]} numberOfLines={1}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={{ flex: 1, marginLeft: gap }} />
            ))}
        </View>
      ))}
    </View>
  );
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  iconWrapper: {
    marginRight: 8,
  },
  label: {
    color: colors.neutral[700],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
});
