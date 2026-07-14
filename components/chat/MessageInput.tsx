import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types';
import ReplyPreview from './ReplyPreview';
import { colors, typography, spacing, radius, shadows } from '@/constants/tokens';

interface MessageInputProps {
  replyTo: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSend: (text: string) => void;
  onSendImage: (uri: string, filename: string) => void;
  isSending: boolean;
  uploadProgress?: number;
}

export default function MessageInput({
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSend,
  onSendImage,
  isSending,
  uploadProgress,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<{ uri: string; filename: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const isEditing = !!editingMessage;
  const isUploading = uploadProgress !== undefined && uploadProgress < 1;

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.body ?? '');
      inputRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (isSending || isUploading) return;

    if (pendingImage) {
      onSendImage(pendingImage.uri, pendingImage.filename);
      setPendingImage(null);
      setText('');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName ?? `chat_${Date.now()}.jpg`;
      const sizeBytes = asset.fileSize ?? 0;

      if (sizeBytes > 10 * 1024 * 1024) {
        console.warn('[ImagePicker] file too large:', sizeBytes);
        return;
      }

      console.log('[ImagePicker] picked:', asset.uri, filename, sizeBytes);

      setPendingImage({ uri: asset.uri, filename });
    }
  };

  const canSend = (text.trim().length > 0 || !!pendingImage) && !isSending && !isUploading;

  return (
    <View style={styles.wrapper}>
      {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}

      {isEditing && (
        <View style={styles.editBanner}>
          <View style={styles.editStrip} />
          <Text style={styles.editLabel}>Editing message</Text>
          <TouchableOpacity onPress={onCancelEdit} hitSlop={12}>
            <Ionicons name="close" size={16} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>
      )}

      {pendingImage && (
        <View style={styles.imagePreviewRow}>
          <Image source={{ uri: pendingImage.uri }} style={styles.imageThumb} />
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color={colors.neutral[0]} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => setPendingImage(null)}
            style={styles.imageRemove}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bar}>
        <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn} disabled={isEditing}>
          <Ionicons
            name="camera-outline"
            size={22}
            color={isEditing ? colors.neutral[300] : colors.neutral[500]}
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={isEditing ? 'Edit message…' : 'Type a message…'}
          placeholderTextColor={colors.neutral[400]}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />

        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, canSend && styles.sendBtnActive]}
          disabled={!canSend}
        >
          {isSending || isUploading ? (
            <ActivityIndicator size="small" color={colors.neutral[0]} />
          ) : (
            <Ionicons
              name={isEditing ? 'checkmark' : 'arrow-up'}
              size={18}
              color={canSend ? colors.neutral[0] : colors.neutral[400]}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[800],
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[200],
  },
  sendBtnActive: {
    backgroundColor: colors.primary[400],
    ...shadows.sm,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  editStrip: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary[400],
  },
  editLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary[400],
  },
  imagePreviewRow: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  imageThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[200],
  },
  uploadOverlay: {
    position: 'absolute',
    left: spacing[4],
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemove: {
    marginLeft: spacing[2],
    marginBottom: 2,
  },
});
