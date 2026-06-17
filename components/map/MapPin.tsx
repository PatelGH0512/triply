import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon } from '@/constants/enums';
import { ActivityIconMap } from '@/constants/icons';
import Colors from '@/constants/colors';

interface MapPinProps {
  icon: ActivityIcon;
  /** Highlighted style for a freshly-selected search result. */
  highlighted?: boolean;
}

export default function MapPin({ icon, highlighted = false }: MapPinProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.pin, highlighted && styles.pinHighlighted]}>
        <Ionicons
          name={ActivityIconMap[icon] as keyof typeof Ionicons.glyphMap}
          size={16}
          color={Colors.neutral.white}
        />
      </View>
      <View style={[styles.tail, highlighted && styles.tailHighlighted]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinHighlighted: {
    backgroundColor: Colors.accent.teal,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary.coral,
  },
  tailHighlighted: {
    borderTopColor: Colors.accent.teal,
  },
});
