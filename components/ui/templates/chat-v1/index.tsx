import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { GiftedChat, IMessage, Bubble } from 'react-native-gifted-chat';
import { StreamingText } from './streaming-text';
import { InputBar } from './input-bar';
import { IChipOption } from './types';
import { Ionicons } from '@expo/vector-icons';
import { EmptyChipGrid } from './empty-chat-options';
import { ChatHeader } from './header';
import { colors, typography, spacing, radius } from '@/constants/tokens';

const LOADING_MSG_ID = '__loading__';

interface ChatV1Props {
  destination: string;
  dateRange: string;
  memberCount: number;
  totalDays: number;
  onPressPlus: () => void;
  messages: IMessage[];
  isLoading: boolean;
  streamingId: string | null;
  rateLimitHit: boolean;
  sendMessage: (text: string) => Promise<void>;
  onStreamComplete: () => void;
}

export default function ChatV1({
  destination,
  dateRange,
  memberCount,
  totalDays,
  onPressPlus,
  messages,
  isLoading,
  streamingId,
  rateLimitHit,
  sendMessage,
  onStreamComplete,
}: ChatV1Props) {
  const { height } = useWindowDimensions();

  const [inputValue, setInputValue] = useState('');

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendMessage(text.trim());
      setInputValue('');
    },
    [sendMessage],
  );

  const displayMessages = useMemo((): IMessage[] => {
    if (isLoading) {
      const loadingMsg: IMessage = {
        _id: LOADING_MSG_ID,
        text: '',
        createdAt: new Date(),
        user: { _id: 2, name: 'AI Assistant' },
      };
      return [loadingMsg, ...messages];
    }
    return messages;
  }, [messages, isLoading]);

  const CHIP_OPTIONS: IChipOption[] = useMemo(
    () => [
      {
        text: `Day 1 activities`,
        icon: <Text style={styles.chipEmoji}>🗺️</Text>,
        onPress: () => handleSend(`Suggest Day 1 activities for our trip to ${destination}`),
      },
      {
        text: `Best restaurants`,
        icon: <Text style={styles.chipEmoji}>🍽️</Text>,
        onPress: () => handleSend(`What are the best restaurants in ${destination} for a group?`),
      },
      {
        text: `Visa & travel tips`,
        icon: <Text style={styles.chipEmoji}>✈️</Text>,
        onPress: () => handleSend(`What are the visa and travel requirements for ${destination}?`),
      },
      {
        text: `Budget breakdown`,
        icon: <Text style={styles.chipEmoji}>💰</Text>,
        onPress: () =>
          handleSend(
            `Give us a budget breakdown for ${memberCount} people in ${destination} for ${totalDays} days`,
          ),
      },
    ],
    [destination, memberCount, totalDays, handleSend],
  );

  return (
    <View style={styles.container}>
      <ChatHeader destination={destination} dateRange={dateRange} />
      <GiftedChat
        messages={displayMessages}
        renderMessageText={(props) => {
          const msg = props.currentMessage;
          if (!msg) return null;

          if (msg._id === LOADING_MSG_ID) {
            return (
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.neutral[400]} />
                <Text style={styles.typingText}>Thinking…</Text>
              </View>
            );
          }

          if (msg.system) {
            return null;
          }

          if (msg.user._id === 2 && streamingId === String(msg._id)) {
            return (
              <View style={styles.msgPad}>
                <StreamingText
                  text={msg.text ?? ''}
                  style={styles.aiMsgText}
                  onComplete={onStreamComplete}
                />
              </View>
            );
          }

          return (
            <View style={styles.msgPad}>
              <Text style={msg.user._id === 1 ? styles.userMsgText : styles.aiMsgText}>
                {msg.text}
              </Text>
            </View>
          );
        }}
        renderTime={() => <></>}
        isAvatarVisibleForEveryMessage={false}
        isUserAvatarVisible={false}
        renderAvatar={() => <></>}
        renderSystemMessage={(props) => {
          const msg = props.currentMessage;
          if (!msg) return null;
          return (
            <View style={styles.systemMsgContainer}>
              <Text style={styles.systemMsgText}>{msg.text}</Text>
            </View>
          );
        }}
        renderBubble={(bubbleProps) => (
          <Bubble
            {...bubbleProps}
            containerStyle={{
              right: { paddingRight: 16 },
              left: { paddingLeft: 0 },
            }}
            wrapperStyle={{
              right: {
                backgroundColor: colors.primary[400],
                borderRadius: radius.lg,
              },
              left: {
                backgroundColor: colors.neutral[0],
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.neutral[200],
              },
            }}
          />
        )}
        onSend={() => {}}
        user={{ _id: 1 }}
        renderInputToolbar={() => (
          <InputBar
            onSend={handleSend}
            onPressPlus={onPressPlus}
            disabled={rateLimitHit}
            disabledPlaceholder="Daily limit reached · resets tomorrow"
            value={inputValue}
            onChangeValue={setInputValue}
          />
        )}
        renderChatEmpty={() => (
          <View style={[styles.emptyContainer, { minHeight: height * 0.65 }]}>
            <View style={styles.emptyGreeting}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="sparkles" size={28} color={colors.primary[400]} />
              </View>
              <Text style={styles.emptyTitle}>AI Travel Assistant</Text>
              <Text style={styles.emptySub}>Ask me anything about {destination}</Text>
            </View>
            {!rateLimitHit && (
              <View style={styles.chipsWrapper}>
                <EmptyChipGrid
                  options={CHIP_OPTIONS}
                  columns={2}
                  gap={10}
                  containerStyle={styles.chipsContainer}
                />
              </View>
            )}
          </View>
        )}
        listProps={{
          inverted: displayMessages.length > 0,
          contentContainerStyle: styles.listContent,
          style: { backgroundColor: colors.neutral[50] },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  msgPad: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userMsgText: {
    color: colors.neutral[0],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * 1.5,
  },
  aiMsgText: {
    color: colors.neutral[800],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * 1.5,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typingText: {
    color: colors.neutral[400],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  systemMsgContainer: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  systemMsgText: {
    color: colors.neutral[600],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyGreeting: {
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[8],
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[800],
  },
  emptySub: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  chipsWrapper: {
    width: '100%',
  },
  chipsContainer: {
    paddingHorizontal: 0,
  },
  chipEmoji: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: spacing[4],
  },
});
