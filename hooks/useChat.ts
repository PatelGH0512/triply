import { useEffect, useCallback, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  getMessages,
  sendMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  uploadChatImage,
} from '@/lib/api/messages';
import { Message } from '@/types';
import { useAuthStore } from '@/store/authStore';

type MessagesPage = { messages: Message[]; nextCursor: string | undefined };

function queryKey(tripId: string) {
  return ['messages', tripId];
}

export function useMessages(tripId: string) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: queryKey(tripId),
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const messages = await getMessages(tripId, cursor);
      const nextCursor =
        messages.length === 50 ? messages[messages.length - 1].created_at : undefined;
      return { messages, nextCursor };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!tripId,
  });
}

export function useSendMessage(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      body,
      replyToId,
    }: {
      body: string;
      replyToId?: string;
    }) => sendMessage(tripId, user!.id, body, replyToId),

    onMutate: async ({ body, replyToId }) => {
      await queryClient.cancelQueries({ queryKey: queryKey(tripId) });
      const prev = queryClient.getQueryData<InfiniteData<MessagesPage>>(queryKey(tripId));

      const optimistic: Message = {
        id: `optimistic_${Date.now()}`,
        trip_id: tripId,
        user_id: user!.id,
        body,
        image_url: null,
        reply_to_id: replyToId ?? null,
        is_deleted: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: user!.id,
          full_name: user!.full_name,
          avatar_url: user!.avatar_url,
        },
      };

      queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey(tripId), (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        pages[0] = { ...pages[0], messages: [optimistic, ...pages[0].messages] };
        return { ...old, pages };
      });

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKey(tripId), ctx.prev);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(tripId) });
    },
  });
}

export function useSendImageMessage(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      uri,
      filename,
      replyToId,
      onProgress,
    }: {
      uri: string;
      filename: string;
      replyToId?: string;
      onProgress?: (p: number) => void;
    }) => {
      const imageUrl = await uploadChatImage(tripId, uri, filename, onProgress);
      if (!imageUrl) throw new Error('Image upload failed');
      return sendImageMessage(tripId, user!.id, imageUrl, replyToId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(tripId) });
    },
  });
}

export function useEditMessage(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, newBody }: { messageId: string; newBody: string }) =>
      editMessage(messageId, newBody),

    onMutate: async ({ messageId, newBody }) => {
      await queryClient.cancelQueries({ queryKey: queryKey(tripId) });
      const prev = queryClient.getQueryData<InfiniteData<MessagesPage>>(queryKey(tripId));

      queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey(tripId), (old) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === messageId ? { ...m, body: newBody, is_edited: true } : m,
          ),
        }));
        return { ...old, pages };
      });

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey(tripId), ctx.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(tripId) });
    },
  });
}

export function useDeleteMessage(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),

    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: queryKey(tripId) });
      const prev = queryClient.getQueryData<InfiniteData<MessagesPage>>(queryKey(tripId));

      queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey(tripId), (old) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === messageId
              ? { ...m, is_deleted: true, body: null, image_url: null }
              : m,
          ),
        }));
        return { ...old, pages };
      });

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey(tripId), ctx.prev);
    },
  });
}

export function useChatRealtime(tripId: string) {
  const queryClient = useQueryClient();
  const stableKey = useRef(queryKey(tripId));

  const handleInsert = useCallback(
    (payload: any) => {
      const newMsg = payload.new as Message;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(stableKey.current, (old) => {
        if (!old) return old;
        const alreadyExists = old.pages[0]?.messages.some((m) => m.id === newMsg.id);
        if (alreadyExists) return old;
        const pages = [...old.pages];
        pages[0] = { ...pages[0], messages: [newMsg, ...pages[0].messages] };
        return { ...old, pages };
      });
    },
    [queryClient],
  );

  const handleUpdate = useCallback(
    (payload: any) => {
      const updated = payload.new as Message;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(stableKey.current, (old) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
        }));
        return { ...old, pages };
      });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`chat-${tripId}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        handleInsert,
      )
      .on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        handleUpdate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, handleInsert, handleUpdate]);
}
