import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripContext } from '@/lib/context/TripContext';
import { useAuthStore } from '@/store/authStore';
import {
  useMessages,
  useSendMessage,
  useSendImageMessage,
  useEditMessage,
  useDeleteMessage,
  useChatRealtime,
} from '@/hooks/useChat';
import { Message } from '@/types';
import MessageList, { MessageListHandle } from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import NewMessageButton from '@/components/chat/NewMessageButton';
import { colors, typography, spacing } from '@/constants/tokens';
import { NAV_TOTAL_HEIGHT as NAV_H } from '@/components/trip/TripBottomNav';

export default function ChatScreen() {
  const { tripId, trip } = useTripContext();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const listRef = useRef<MessageListHandle>(null);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(tripId);
  const sendMutation = useSendMessage(tripId);
  const sendImageMutation = useSendImageMessage(tripId);
  const editMutation = useEditMessage(tripId);
  const deleteMutation = useDeleteMessage(tripId);

  useChatRealtime(tripId);

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];
  const memberCount = trip.trip_members?.length ?? 0;

  const handleSend = useCallback(
    (text: string) => {
      if (editingMessage) {
        editMutation.mutate({ messageId: editingMessage.id, newBody: text });
        setEditingMessage(null);
        return;
      }
      sendMutation.mutate({ body: text, replyToId: replyTo?.id });
      setReplyTo(null);
      listRef.current?.scrollToBottom();
    },
    [editingMessage, replyTo, sendMutation, editMutation],
  );

  const handleSendImage = useCallback(
    (uri: string, filename: string) => {
      const tempKey = `upload_${Date.now()}`;
      sendImageMutation.mutate(
        {
          uri,
          filename,
          replyToId: replyTo?.id,
          onProgress: (p) => setUploadProgress((prev) => ({ ...prev, [tempKey]: p })),
        },
        {
          onSuccess: () => {
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[tempKey];
              return next;
            });
            listRef.current?.scrollToBottom();
          },
        },
      );
      setReplyTo(null);
    },
    [replyTo, sendImageMutation],
  );

  const handleReply = useCallback((msg: Message) => {
    setReplyTo(msg);
    setEditingMessage(null);
  }, []);

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage(msg);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMutation.mutate(messageId);
    },
    [deleteMutation],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary[400]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group Chat</Text>
        <Text style={styles.memberCount}>{memberCount} members</Text>
      </View>

      <View style={styles.listWrapper}>
        <MessageList
          ref={listRef}
          messages={messages}
          currentUserId={user!.id}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onScrolledAwayFromBottom={setIsAwayFromBottom}
          onLoadMore={handleLoadMore}
          uploadProgress={uploadProgress}
        />

        {isAwayFromBottom && <NewMessageButton onPress={() => listRef.current?.scrollToBottom()} />}
      </View>

      <MessageInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onSend={handleSend}
        onSendImage={handleSendImage}
        isSending={sendMutation.isPending || sendImageMutation.isPending}
        uploadProgress={
          Object.keys(uploadProgress).length > 0 ? Object.values(uploadProgress)[0] : undefined
        }
      />

      <View style={{ height: insets.bottom + NAV_H }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  memberCount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  listWrapper: {
    flex: 1,
  },
});
