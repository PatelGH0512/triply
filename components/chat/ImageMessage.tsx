import { useState } from 'react';
import {
  TouchableOpacity,
  Image,
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/tokens';

interface ImageMessageProps {
  uri: string;
  isOwn: boolean;
  uploadProgress?: number;
}

export default function ImageMessage({ uri, isOwn, uploadProgress }: ImageMessageProps) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const insets = useSafeAreaInsets();
  const isUploading = uploadProgress !== undefined && uploadProgress < 1;

  return (
    <>
      <TouchableOpacity
        onPress={() => !isUploading && setVisible(true)}
        activeOpacity={0.9}
        style={[styles.bubble, isOwn && styles.bubbleOwn]}
      >
        <Image
          source={{ uri }}
          style={styles.image}
          onLoad={() => setLoaded(true)}
          resizeMode="cover"
        />
        {(!loaded || isUploading) && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.neutral[0]} />
          </View>
        )}
        {isUploading && (
          <View style={[styles.progressBar, { width: `${(uploadProgress ?? 0) * 100}%` }]} />
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalBg}>
            <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={[styles.closeBtn, { top: insets.top + spacing[2] }]}
            >
              <Ionicons name="close" size={22} color={colors.neutral[0]} />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 160,
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.primary[400],
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
