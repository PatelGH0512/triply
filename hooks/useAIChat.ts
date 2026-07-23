import { useState, useCallback, useRef } from 'react';
import { IMessage } from 'react-native-gifted-chat';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

const AI_USER_ID = 2;
const CURRENT_USER_ID = 1;
const MAX_CLAUDE_HISTORY = 40;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

function makeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function makeUserIMessage(text: string): IMessage {
  return {
    _id: makeId(),
    text,
    createdAt: new Date(),
    user: { _id: CURRENT_USER_ID },
  };
}

function makeAIIMessage(text: string): IMessage {
  return {
    _id: makeId(),
    text,
    createdAt: new Date(),
    user: { _id: AI_USER_ID, name: 'AI Assistant' },
  };
}

function makeSystemIMessage(text: string): IMessage {
  return {
    _id: makeId(),
    text,
    createdAt: new Date(),
    user: { _id: 0 },
    system: true,
  };
}

interface UseAIChatReturn {
  messages: IMessage[];
  isLoading: boolean;
  streamingId: string | null;
  rateLimitHit: boolean;
  sendMessage: (text: string) => Promise<void>;
  cancelMessage: () => void;
  clearChat: () => void;
  onStreamComplete: () => void;
}

export function useAIChat(tripContext: string): UseAIChatReturn {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const claudeHistory = useRef<ClaudeMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || rateLimitHit) return;

      const userMsg = makeUserIMessage(text.trim());
      setMessages((prev) => [userMsg, ...prev]);

      claudeHistory.current = [
        ...claudeHistory.current,
        { role: 'user', content: text.trim() },
      ];

      if (claudeHistory.current.length > MAX_CLAUDE_HISTORY) {
        claudeHistory.current = claudeHistory.current.slice(2);
      }

      setIsLoading(true);

      abortControllerRef.current = new AbortController();

      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: claudeHistory.current,
            tripContext,
          },
          signal: abortControllerRef.current.signal,
        });

        if (error) {
          throw error;
        }

        if (!data) {
          showToast({ message: 'Something went wrong. Please try again.', variant: 'error' });
          claudeHistory.current = claudeHistory.current.slice(0, -1);
          return;
        }

        if (data.error === 'rate_limit_exceeded') {
          setRateLimitHit(true);
          const limitMsg = makeSystemIMessage(
            '🤖 You\'ve reached today\'s AI limit of 20 messages. Come back tomorrow to keep planning!',
          );
          setMessages((prev) => [limitMsg, ...prev]);
          claudeHistory.current = claudeHistory.current.slice(0, -1);
          return;
        }

        const responseText: string = data.content;
        if (!responseText) {
          showToast({ message: 'Something went wrong. Please try again.', variant: 'error' });
          claudeHistory.current = claudeHistory.current.slice(0, -1);
          return;
        }

        const aiMsg = makeAIIMessage(responseText);
        setStreamingId(String(aiMsg._id));
        setMessages((prev) => [aiMsg, ...prev]);

        claudeHistory.current = [
          ...claudeHistory.current,
          { role: 'assistant', content: responseText },
        ];

        if (claudeHistory.current.length > MAX_CLAUDE_HISTORY) {
          claudeHistory.current = claudeHistory.current.slice(2);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          return;
        }
        const status = err?.status ?? err?.context?.status;
        if (status === 429) {
          setRateLimitHit(true);
          const limitMsg = makeSystemIMessage(
            '🤖 You\'ve reached today\'s AI limit of 20 messages. Come back tomorrow to keep planning!',
          );
          setMessages((prev) => [limitMsg, ...prev]);
          claudeHistory.current = claudeHistory.current.slice(0, -1);
        } else if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
          showToast({
            message: "Couldn't reach AI assistant. Check your connection.",
            variant: 'error',
          });
          claudeHistory.current = claudeHistory.current.slice(0, -1);
        } else {
          console.error('[useAIChat] Claude API error:', err);
          showToast({
            message: 'AI assistant is unavailable. Try again shortly.',
            variant: 'error',
          });
          claudeHistory.current = claudeHistory.current.slice(0, -1);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, rateLimitHit, tripContext, showToast],
  );

  const cancelMessage = useCallback(() => {
    if (isLoading) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
      setMessages((prev) => prev.slice(1));
      claudeHistory.current = claudeHistory.current.slice(0, -1);
    }
    if (streamingId) {
      setStreamingId(null);
    }
  }, [isLoading, streamingId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setStreamingId(null);
    setRateLimitHit(false);
    claudeHistory.current = [];
  }, []);

  const onStreamComplete = useCallback(() => {
    setStreamingId(null);
  }, []);

  return {
    messages,
    isLoading,
    streamingId,
    rateLimitHit,
    sendMessage,
    cancelMessage,
    clearChat,
    onStreamComplete,
  };
}
