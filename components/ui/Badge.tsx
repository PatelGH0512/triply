import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, typography } from '@/constants/tokens';

export type BadgeVariant =
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'yay'
  | 'nay'
  | 'admin'
  | 'member';

interface BadgeConfig {
  bg: string;
  text: string;
  pulse?: boolean;
}

const BADGE_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  upcoming:  { bg: '#E8F0FF', text: '#3B6DD4' },
  ongoing:   { bg: '#E6F9F0', text: '#1D9E75', pulse: true },
  completed: { bg: colors.neutral[100], text: colors.neutral[500] },
  yay:       { bg: '#E6F9F0', text: '#1D9E75' },
  nay:       { bg: '#FDECEA', text: colors.error },
  admin:     { bg: colors.primary[50], text: colors.primary[600] },
  member:    { bg: colors.neutral[100], text: colors.neutral[600] },
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  style?: ViewStyle;
}

function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.dot, { opacity: anim }]} />
  );
}

const DEFAULT_LABELS: Record<BadgeVariant, string> = {
  upcoming:  'Upcoming',
  ongoing:   'Ongoing',
  completed: 'Completed',
  yay:       'Yay',
  nay:       'Nay',
  admin:     'Admin',
  member:    'Member',
};

export function Badge({ variant, label, style }: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  const displayLabel = label ?? DEFAULT_LABELS[variant];

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }, style]}>
      {config.pulse && <PulseDot />}
      <Text style={[styles.label, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1D9E75',
  },
  label: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
  },
});
