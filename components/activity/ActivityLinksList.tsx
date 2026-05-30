import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLink } from '@/types';
import Colors from '@/constants/colors';

interface ActivityLinksListProps {
  links: ActivityLink[];
}

export default function ActivityLinksList({ links }: ActivityLinksListProps) {
  if (!links.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No links added yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {links.map((link) => (
        <TouchableOpacity
          key={link.id}
          style={styles.row}
          onPress={() => Linking.openURL(link.url)}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="link-outline" size={16} color={Colors.primary.coral} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {link.title}
            </Text>
            <Text style={styles.url} numberOfLines={1}>
              {link.url}
            </Text>
          </View>
          <Ionicons name="open-outline" size={14} color={Colors.neutral.placeholder} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  empty: { paddingVertical: 12, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.text.tertiary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.neutral.background,
    borderRadius: 10,
    padding: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary.coralFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  url: {
    fontSize: 11,
    color: Colors.primary.coral,
    marginTop: 1,
  },
});
