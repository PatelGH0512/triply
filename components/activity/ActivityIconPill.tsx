import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon } from '@/constants/enums';
import { radius } from '@/constants/tokens';

interface IconConfig {
  bg: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji?: string;
}

const ICON_CONFIG: Record<ActivityIcon, IconConfig> = {
  [ActivityIcon.Flight]:        { bg: '#E8F4FF', color: '#3B8FD4', icon: 'airplane' },
  [ActivityIcon.Transport]:     { bg: '#FFF4E0', color: '#D4863B', icon: 'bus' },
  [ActivityIcon.Beach]:         { bg: '#E0F7F4', color: '#1DA89E', icon: 'umbrella' },
  [ActivityIcon.Hiking]:        { bg: '#EBF5E6', color: '#4CAF50', icon: 'trail-sign' },
  [ActivityIcon.Hotel]:         { bg: '#F0EEFF', color: '#7B5CF0', icon: 'bed' },
  [ActivityIcon.Restaurant]:    { bg: '#FFF0ED', color: '#E8643A', icon: 'restaurant' },
  [ActivityIcon.Activity]:      { bg: '#F0EEFF', color: '#7B5CF0', icon: 'star' },
  [ActivityIcon.Shopping]:      { bg: '#FFF4E0', color: '#D4863B', icon: 'cart' },
  [ActivityIcon.Museum]:        { bg: '#FFF0F5', color: '#D45B8A', icon: 'business' },
  [ActivityIcon.Entertainment]: { bg: '#FFF0F5', color: '#D45B8A', icon: 'musical-notes' },
  [ActivityIcon.Coffee]:        { bg: '#FFF4E0', color: '#8B5E3C', icon: 'cafe' },
  [ActivityIcon.Bar]:           { bg: '#FFF4E0', color: '#8B5E3C', icon: 'wine' },
  [ActivityIcon.Health]:        { bg: '#EBF5E6', color: '#3DBD7D', icon: 'medkit' },
  [ActivityIcon.Meeting]:       { bg: '#E8F4FF', color: '#3B8FD4', icon: 'people' },
  [ActivityIcon.Other]:         { bg: '#F5F4F2', color: '#827C74', icon: 'ellipsis-horizontal' },
};

interface ActivityIconPillProps {
  icon: ActivityIcon;
  size?: number;
}

export function ActivityIconPill({ icon, size = 36 }: ActivityIconPillProps) {
  const config = ICON_CONFIG[icon] ?? ICON_CONFIG[ActivityIcon.Other];

  return (
    <View
      style={[
        styles.pill,
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Ionicons name={config.icon} size={18} color={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
