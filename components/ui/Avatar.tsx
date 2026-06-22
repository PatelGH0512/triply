import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, shadows, typography } from '@/constants/tokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

const WARM_COLORS = [
  '#FF6B4A',
  '#F5A623',
  '#E8845A',
  '#D4713E',
  '#C4623A',
  '#E07848',
  '#F08C5A',
  '#B85C30',
];

function getWarmColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WARM_COLORS[Math.abs(hash) % WARM_COLORS.length];
}

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize | number;
}

export default function Avatar({ uri, name = '', size = 'md' }: AvatarProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size];
  const initials = (name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const bg = getWarmColor(name ?? '');
  const fontSize = px * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: px, height: px, borderRadius: px / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: px, height: px, borderRadius: px / 2, backgroundColor: bg },
        shadows.sm,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.neutral[0],
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: {
    color: colors.neutral[0],
    fontFamily: typography.fonts.semibold,
  },
});
