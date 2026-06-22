import { Platform, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '@/constants/tokens';

interface GlassViewProps {
  children: React.ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export function GlassView({
  children,
  intensity = 55,
  style,
  borderRadius = radius.xl,
}: GlassViewProps) {
  const container: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.glass.border,
    ...shadows.md,
  };

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="light" style={[container, style]}>
        <LinearGradient
          colors={[colors.glass.light, colors.glass.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[container, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {children}
    </View>
  );
}
