import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon } from '@/constants/enums';
import { ActivityIconMap, ActivityIconLabel } from '@/constants/icons';
import Colors from '@/constants/colors';

interface ActivityIconPickerProps {
  selected: ActivityIcon;
  onSelect: (icon: ActivityIcon) => void;
}

const ICON_ORDER: ActivityIcon[] = [
  ActivityIcon.Flight,
  ActivityIcon.Transport,
  ActivityIcon.Hotel,
  ActivityIcon.Restaurant,
  ActivityIcon.Hiking,
  ActivityIcon.Beach,
  ActivityIcon.Museum,
  ActivityIcon.Entertainment,
  ActivityIcon.Coffee,
  ActivityIcon.Bar,
  ActivityIcon.Shopping,
  ActivityIcon.Health,
  ActivityIcon.Meeting,
  ActivityIcon.Activity,
  ActivityIcon.Other,
];

export default function ActivityIconPicker({ selected, onSelect }: ActivityIconPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ICON_ORDER.map((icon) => {
        const isSelected = selected === icon;
        return (
          <TouchableOpacity
            key={icon}
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => onSelect(icon)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ActivityIconMap[icon] as keyof typeof Ionicons.glyphMap}
              size={20}
              color={isSelected ? Colors.neutral.white : Colors.text.secondary}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {ActivityIconLabel[icon]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
    minWidth: 64,
  },
  itemSelected: {
    backgroundColor: Colors.primary.coral,
    borderColor: Colors.primary.coral,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  labelSelected: {
    color: Colors.neutral.white,
  },
});
