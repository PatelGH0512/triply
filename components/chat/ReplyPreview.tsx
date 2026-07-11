import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types';
import { colors, typography, spacing, radius } from '@/constants/tokens';

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const senderName = message.sender?.full_name ?? 'Unknown';
  const preview = message.is_deleted
    ? 'This message was deleted'
    : message.body
      ? message.body.length > 80
        ? message.body.slice(0, 80) + '…'
        : message.body
      : '📷 Image';

  return (
    <View style={styles.container}>
      <View style={styles.strip} />
      <View style={styles.content}>
        <Text style={styles.name}>{senderName}</Text>
        <Text style={styles.body} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} hitSlop={12} style={styles.close}>
        <Ionicons name="close" size={16} color={colors.neutral[500]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  strip: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: radius.full,
    backgroundColor: colors.primary[400],
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primary[400],
  },
  body: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
  },
  close: {
    padding: spacing[1],
  },
});
