import { useState } from 'react';
import {
  Modal,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityMedia } from '@/types';
import MediaThumbnail from '@/components/ui/MediaThumbnail';
import Colors from '@/constants/colors';

interface ActivityMediaViewerProps {
  media: ActivityMedia[];
}

export default function ActivityMediaViewer({ media }: ActivityMediaViewerProps) {
  const insets = useSafeAreaInsets();
  const [viewingUri, setViewingUri] = useState<string | null>(null);

  if (!media.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No media added yet.</Text>
      </View>
    );
  }

  const handlePress = (item: ActivityMedia) => {
    if (item.type === 'pdf') {
      Linking.openURL(item.url);
    } else {
      setViewingUri(item.url);
    }
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {media.map((item) => (
          <MediaThumbnail
            key={item.id}
            uri={item.url}
            type={item.type === 'video' ? 'image' : item.type}
            size={80}
            onPress={() => handlePress(item)}
          />
        ))}
      </ScrollView>

      <Modal
        visible={!!viewingUri}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingUri(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 12 }]}
            onPress={() => setViewingUri(null)}
          >
            <Ionicons name="close" size={26} color={Colors.neutral.white} />
          </TouchableOpacity>
          {viewingUri && (
            <Image
              source={{ uri: viewingUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 12, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.text.tertiary },
  row: { gap: 8, paddingVertical: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
