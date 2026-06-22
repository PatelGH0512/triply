import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { GlassView } from './GlassView';
import { colors, radius, shadows, typography } from '@/constants/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isDisabled = disabled || loading;

  const tap = Gesture.Tap()
    .runOnJS(true)
    .enabled(!isDisabled)
    .onBegin(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.9, { duration: 80 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 100 });
      if (onPress && !isDisabled) onPress();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.4 : opacity.value,
  }));

  const height = variant === 'ghost' ? 44 : 52;

  if (variant === 'secondary') {
    return (
      <GestureDetector gesture={tap}>
        <Animated.View style={[animStyle, style]}>
          <GlassView
            borderRadius={radius.full}
            style={[styles.base, { height }]}
          >
            {leftIcon && <>{leftIcon}</>}
            <Text style={styles.secondaryText}>{children}</Text>
          </GlassView>
        </Animated.View>
      </GestureDetector>
    );
  }

  if (variant === 'ghost') {
    return (
      <GestureDetector gesture={tap}>
        <Animated.View style={[styles.base, styles.ghost, { height }, animStyle, style]}>
          {leftIcon && <>{leftIcon}</>}
          <Text style={styles.ghostText}>{children}</Text>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.base, styles.primary, { height }, animStyle, style]}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {leftIcon && <>{leftIcon}</>}
            <Text style={styles.primaryText}>{children}</Text>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary[400],
    borderRadius: radius.full,
    ...shadows.glow,
  },
  primaryText: {
    color: colors.neutral[0],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
  },
  secondaryText: {
    color: colors.neutral[700],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.full,
  },
  ghostText: {
    color: colors.primary[400],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
  },
});
