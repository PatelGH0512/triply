import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '@/constants/tokens';

interface NewMessageButtonProps {
  onPress: () => void;
}

export default function NewMessageButton({ onPress }: NewMessageButtonProps) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(200)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrapper}
    >
      <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.85}>
        <Ionicons name="arrow-down" size={14} color={colors.neutral[0]} />
        <Text style={styles.label}>New messages</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: spacing[4],
    alignSelf: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primary[400],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    ...shadows.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[0],
  },
});
