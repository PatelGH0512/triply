import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export type TabName = 'overview' | 'map' | 'chat' | 'ai' | 'expenses';

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

export default function TripBottomNav({ activeTab, onTabPress }: TripBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? Colors.primary.coral : Colors.neutral.placeholder}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
