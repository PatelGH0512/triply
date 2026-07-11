import { View, Text, TouchableOpacity, ActionSheetIOS, Alert, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { Message } from '@/types';
import Avatar from '@/components/ui/Avatar';
import ImageMessage from './ImageMessage';
import { colors, typography, spacing, radius } from '@/constants/tokens';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  uploadProgress?: number;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onQuoteTap: (messageId: string) => void;
}

function QuotedReply({
  reply,
  onTap,
  isOwn,
}: {
  reply: NonNullable<Message['reply_to']>;
  onTap: () => void;
  isOwn: boolean;
}) {
  const senderName = reply.sender?.full_name ?? 'Unknown';
  const body = reply.is_deleted
    ? 'Original message was deleted'
    : reply.body
      ? reply.body.length > 60
        ? reply.body.slice(0, 60) + '…'
        : reply.body
      : '📷 Image';

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.75} style={[styles.quote, isOwn && styles.quoteOwn]}>
      <View style={[styles.quoteStrip, isOwn && styles.quoteStripOwn]} />
      <View style={styles.quoteBody}>
        <Text style={[styles.quoteName, isOwn && styles.quoteNameOwn]}>{senderName}</Text>
        <Text
          style={[styles.quoteText, isOwn && styles.quoteTextOwn, reply.is_deleted && styles.quoteDeleted]}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  uploadProgress,
  onReply,
  onEdit,
  onDelete,
  onQuoteTap,
}: MessageBubbleProps) {
  const time = dayjs(message.created_at).format('h:mm A');

  const handleLongPress = () => {
    if (message.is_deleted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isImage = !!message.image_url;

    if (Platform.OS === 'ios') {
      const options = isOwn
        ? isImage
          ? ['Reply', 'Delete', 'Cancel']
          : ['Reply', 'Edit', 'Delete', 'Cancel']
        : ['Reply', 'Cancel'];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: isOwn ? options.indexOf('Delete') : undefined,
          cancelButtonIndex: options.indexOf('Cancel'),
        },
        (idx) => {
          const chosen = options[idx];
          if (chosen === 'Reply') onReply(message);
          else if (chosen === 'Edit') onEdit(message);
          else if (chosen === 'Delete') confirmDelete();
        },
      );
    } else {
      Alert.alert(
        'Message',
        undefined,
        isOwn
          ? [
              { text: 'Reply', onPress: () => onReply(message) },
              ...(!isImage ? [{ text: 'Edit', onPress: () => onEdit(message) }] : []),
              { text: 'Delete', style: 'destructive' as const, onPress: confirmDelete },
              { text: 'Cancel', style: 'cancel' as const },
            ]
          : [
              { text: 'Reply', onPress: () => onReply(message) },
              { text: 'Cancel', style: 'cancel' as const },
            ],
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(message.id) },
    ]);
  };

  if (message.is_deleted) {
    return (
      <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
        {!isOwn && (
          <View style={styles.avatarSlot}>
            {showAvatar ? (
              <Avatar uri={message.sender?.avatar_url} name={message.sender?.full_name} size="sm" />
            ) : (
              <View style={styles.avatarGap} />
            )}
          </View>
        )}
        <View style={[styles.deletedBubble]}>
          <Text style={styles.deletedText}>🚫 This message was deleted</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <View style={styles.avatarSlot}>
          {showAvatar ? (
            <Avatar uri={message.sender?.avatar_url} name={message.sender?.full_name} size="sm" />
          ) : (
            <View style={styles.avatarGap} />
          )}
        </View>
      )}

      <View style={[styles.messageCol, isOwn && styles.messageColOwn]}>
        {!isOwn && showName && (
          <Text style={styles.senderName}>{message.sender?.full_name ?? 'Unknown'}</Text>
        )}

        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.85}
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          {message.reply_to && (
            <QuotedReply
              reply={message.reply_to}
              onTap={() => onQuoteTap(message.reply_to!.id)}
              isOwn={isOwn}
            />
          )}

          {message.image_url ? (
            <ImageMessage uri={message.image_url} isOwn={isOwn} uploadProgress={uploadProgress} />
          ) : (
            <Text style={[styles.bodyText, isOwn ? styles.bodyOwn : styles.bodyOther]}>
              {message.body}
            </Text>
          )}
        </TouchableOpacity>

        <View style={[styles.meta, isOwn && styles.metaOwn]}>
          <Text style={styles.time}>{time}</Text>
          {message.is_edited && <Text style={styles.edited}>· edited</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    marginBottom: 2,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatarSlot: {
    width: 28,
    marginRight: spacing[1],
    alignItems: 'center',
  },
  avatarGap: {
    width: 24,
    height: 24,
  },
  messageCol: {
    maxWidth: '72%',
    gap: 3,
  },
  messageColOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
    marginBottom: 2,
    marginLeft: spacing[1],
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    overflow: 'hidden',
  },
  bubbleOwn: {
    backgroundColor: colors.primary[400],
    borderBottomRightRadius: 4,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bubbleOther: {
    backgroundColor: colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  bodyText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  bodyOwn: {
    color: colors.neutral[0],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  bodyOther: {
    color: colors.neutral[800],
  },
  deletedBubble: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  deletedText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },
  meta: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: spacing[1],
  },
  metaOwn: {
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  edited: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  quote: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radius.md,
    marginBottom: spacing[1],
    overflow: 'hidden',
    marginHorizontal: spacing[3],
    marginTop: spacing[2],
  },
  quoteOwn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  quoteStrip: {
    width: 3,
    backgroundColor: colors.primary[400],
  },
  quoteStripOwn: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  quoteBody: {
    flex: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    gap: 2,
  },
  quoteName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primary[400],
  },
  quoteNameOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  quoteText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
  },
  quoteTextOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  quoteDeleted: {
    fontStyle: 'italic',
  },
});
