import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';
import DateSeparator from './DateSeparator';

type ListItem =
  | {
      type: 'message';
      message: Message;
      showAvatar: boolean;
      showName: boolean;
      uploadProgress?: number;
    }
  | { type: 'date'; date: string };

/**
 * Messages arrive in DESC order (newest first, index 0 = newest).
 * FlatList is inverted so index 0 renders at the bottom.
 *
 * Grouping rules (inverted perspective):
 *   - showAvatar/showName = true on the OLDEST message of a consecutive group
 *     (highest DESC index) = the one that renders at the TOP of the group.
 *   - Date separator is inserted AFTER the oldest message of each day
 *     so it renders visually ABOVE the day's group.
 */
function buildListItems(messages: Message[], uploadProgress?: Record<string, number>): ListItem[] {
  const items: ListItem[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const next = messages[i + 1]; // next in DESC = older

    const msgDate = dayjs(msg.created_at).format('YYYY-MM-DD');
    const nextDate = next ? dayjs(next.created_at).format('YYYY-MM-DD') : null;

    // oldest in group = appears at top in inverted = should show avatar + name
    const minutesFromNext = next
      ? dayjs(msg.created_at).diff(dayjs(next.created_at), 'minute')
      : Infinity;
    const isOldestInGroup = !next || next.user_id !== msg.user_id || minutesFromNext > 2;

    items.push({
      type: 'message',
      message: msg,
      showAvatar: isOldestInGroup,
      showName: isOldestInGroup,
      uploadProgress: uploadProgress?.[msg.id],
    });

    // Separator goes after the last (oldest) message of a day group
    if (!next || msgDate !== nextDate) {
      items.push({ type: 'date', date: msg.created_at });
    }
  }

  return items;
}

export interface MessageListHandle {
  scrollToId: (id: string) => void;
  scrollToBottom: () => void;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onScrolledAwayFromBottom: (away: boolean) => void;
  onLoadMore: () => void;
  uploadProgress?: Record<string, number>;
}

const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  (
    {
      messages,
      currentUserId,
      onReply,
      onEdit,
      onDelete,
      onScrolledAwayFromBottom,
      onLoadMore,
      uploadProgress,
    },
    ref,
  ) => {
    const listRef = useRef<FlatList<ListItem>>(null);
    const indexMap = useRef<Map<string, number>>(new Map());

    const items = buildListItems(messages, uploadProgress);

    items.forEach((item, idx) => {
      if (item.type === 'message') {
        indexMap.current.set(item.message.id, idx);
      }
    });

    useImperativeHandle(ref, () => ({
      scrollToId: (id: string) => {
        const idx = indexMap.current.get(id);
        if (idx !== undefined) {
          listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
        }
      },
      scrollToBottom: () => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }));

    const handleScroll = useCallback(
      (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        onScrolledAwayFromBottom(offsetY > 100);
      },
      [onScrolledAwayFromBottom],
    );

    const renderItem = useCallback(
      ({ item }: { item: ListItem }) => {
        if (item.type === 'date') {
          return <DateSeparator date={item.date} />;
        }
        return (
          <MessageBubble
            message={item.message}
            isOwn={item.message.user_id === currentUserId}
            showAvatar={item.showAvatar}
            showName={item.showName}
            uploadProgress={item.uploadProgress}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuoteTap={(id) => {
              const handle = ref as React.RefObject<MessageListHandle>;
              handle?.current?.scrollToId(id);
            }}
          />
        );
      },
      [currentUserId, onReply, onEdit, onDelete, ref],
    );

    return (
      <View style={styles.container}>
        <FlatList<ListItem>
          ref={listRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => (item.type === 'message' ? item.message.id : `date-${item.date}`)}
          inverted
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  },
);

MessageList.displayName = 'MessageList';

export default MessageList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 8,
  },
});
