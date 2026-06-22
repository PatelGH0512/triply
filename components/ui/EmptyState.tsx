import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, typography } from '@/constants/tokens';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({
  icon = '🗺️',
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <Button variant="primary" onPress={onCta} style={styles.cta}>
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 4,
  },
  title: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base - 1,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  cta: {
    marginTop: 8,
    minWidth: 160,
  },
});
