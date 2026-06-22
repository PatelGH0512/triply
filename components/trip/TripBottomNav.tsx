import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '@/components/ui/GlassView';
import { colors, radius, shadows } from '@/constants/tokens';

export type TabName = 'overview' | 'map' | 'chat' | 'ai' | 'expenses';

export const NAV_PILL_HEIGHT = 64;
export const NAV_MARGIN_BOTTOM = 16;
export const NAV_TOTAL_HEIGHT = NAV_PILL_HEIGHT + NAV_MARGIN_BOTTOM;

interface TabConfig {
  name: TabName;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { name: 'overview', icon: 'home-outline', activeIcon: 'home' },
  { name: 'map', icon: 'map-outline', activeIcon: 'map' },
  { name: 'chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { name: 'ai', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { name: 'expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
];

interface TripBottomNavProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

function NavTab({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .runOnJS(true)
    .onBegin(() => {
      scale.value = withSpring(0.82, { damping: 10, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      onPress();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.tab, animStyle]}>
        <Ionicons
          name={isActive ? tab.activeIcon : tab.icon}
          size={24}
          color={isActive ? colors.primary[400] : colors.neutral[400]}
        />
        {isActive && <Animated.View entering={FadeIn.duration(150)} style={styles.activeDot} />}
      </Animated.View>
    </GestureDetector>
  );
}

export default function TripBottomNav({ activeTab, onTabPress }: TripBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 16 }]}>
      <GlassView intensity={70} borderRadius={radius.full} style={styles.pill}>
        {TABS.map((tab) => (
          <NavTab
            key={tab.name}
            tab={tab}
            isActive={tab.name === activeTab}
            onPress={() => onTabPress(tab.name)}
          />
        ))}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'stretch',
    ...shadows.lg,
  },
  pill: {
    height: 64,
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[400],
  },
});
