import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { VoteType } from '@/constants/enums';
import { useVotes, useCastVote } from '@/hooks/useVotes';
import Colors from '@/constants/colors';

const YAY_COLOR = Colors.status.success;
const YAY_BG = Colors.status.successLight;
const NAY_COLOR = Colors.status.error;
const NAY_BG = Colors.status.errorLight;
const MUTED = Colors.neutral.placeholder;

interface VoteButtonProps {
  type: VoteType;
  count: number;
  isActive: boolean;
  onPress: () => void;
}

function VoteButton({ type, count, isActive, onPress }: VoteButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isYay = type === VoteType.Yay;
  const activeColor = isYay ? YAY_COLOR : NAY_COLOR;
  const activeBg = isYay ? YAY_BG : NAY_BG;
  const iconName: keyof typeof Ionicons.glyphMap = isYay
    ? isActive
      ? 'thumbs-up'
      : 'thumbs-up-outline'
    : isActive
      ? 'thumbs-down'
      : 'thumbs-down-outline';

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.25, { duration: 120 }),
      withTiming(1, { duration: 150 }),
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} hitSlop={6}>
      <Animated.View
        style={[styles.voteBtn, isActive && { backgroundColor: activeBg }, animatedStyle]}
      >
        <Ionicons name={iconName} size={15} color={isActive ? activeColor : MUTED} />
        <Text style={[styles.voteCount, { color: isActive ? activeColor : MUTED }]}>{count}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface VoteStripProps {
  activityId: string;
}

export default function VoteStrip({ activityId }: VoteStripProps) {
  const { data } = useVotes(activityId);
  const { mutate: cast } = useCastVote(activityId);

  const yayCount = data?.yayCount ?? 0;
  const nayCount = data?.nayCount ?? 0;
  const userVote = data?.userVote ?? null;

  return (
    <View style={styles.strip}>
      <View style={styles.divider} />
      <View style={styles.row}>
        <VoteButton
          type={VoteType.Yay}
          count={yayCount}
          isActive={userVote === VoteType.Yay}
          onPress={() => cast(VoteType.Yay)}
        />
        <VoteButton
          type={VoteType.Nay}
          count={nayCount}
          isActive={userVote === VoteType.Nay}
          onPress={() => cast(VoteType.Nay)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.borderLight,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.neutral.background,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
