import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface MediaThumbnailProps {
  uri: string;
  type: 'image' | 'video' | 'pdf';
  size?: number;
  onPress?: () => void;
  onRemove?: () => void;
}

export default function MediaThumbnail({
  uri,
  type,
  size = 72,
  onPress,
  onRemove,
}: MediaThumbnailProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {type === 'image' ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.pdfBox}>
          <Ionicons name="document-text" size={size * 0.42} color={Colors.status.error} />
          <Text style={styles.pdfLabel}>PDF</Text>
        </View>
      )}
      {onRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdfBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pdfLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.status.error,
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: Colors.neutral.white,
    borderRadius: 9,
  },
});
