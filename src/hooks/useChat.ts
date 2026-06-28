import React from 'react';
import { AppState, type AppStateStatus, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError } from '../api/client';
import {
  fetchMessages,
  markConversationRead,
  sendMessage,
  sortChatMessagesAsc,
} from '../services/messagesService';
import type { UiChatMessage } from '../types';

const CHAT_ACK_POLL_MS = 3000;

function latestIncomingMessageId(
  messages: UiChatMessage[],
  currentUserId?: string,
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (currentUserId && msg.senderId) {
      if (msg.senderId !== currentUserId) return msg.id;
      continue;
    }
    if (msg.side === 'left') return msg.id;
  }
  return undefined;
}

export function useChat(
  conversationId: string | null,
  isLoggedIn: boolean,
  currentUserId?: string,
) {
  const [messages, setMessages] = React.useState<UiChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const messagesRef = React.useRef(messages);
  const chatFocusedRef = React.useRef(false);
  const markReadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  messagesRef.current = messages;

  const refreshMessages = React.useCallback(async () => {
    if (!conversationId) return;
    try {
      const items = await fetchMessages(conversationId, isLoggedIn, currentUserId);
      setMessages(sortChatMessagesAsc(items));
      setLoadError(false);
    } catch {
      if (!messagesRef.current.length) setLoadError(true);
    }
  }, [conversationId, isLoggedIn, currentUserId]);

  const markReadLatest = React.useCallback(async () => {
    if (!conversationId || !isLoggedIn || !chatFocusedRef.current) return;
    try {
      const maxMessageId = latestIncomingMessageId(messagesRef.current, currentUserId);
      await markConversationRead(conversationId, isLoggedIn, maxMessageId);
    } catch {
      // Retry on next poll tick.
    }
  }, [conversationId, isLoggedIn, currentUserId]);

  const flushMarkRead = React.useCallback(async () => {
    if (!conversationId || !isLoggedIn) return;
    try {
      const maxMessageId = latestIncomingMessageId(messagesRef.current, currentUserId);
      await markConversationRead(conversationId, isLoggedIn, maxMessageId);
    } catch {
      // Best-effort on blur.
    }
  }, [conversationId, isLoggedIn, currentUserId]);

  const scheduleMarkRead = React.useCallback(() => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      void markReadLatest();
    }, 200);
  }, [markReadLatest]);

  const handleChatScroll = React.useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (chatFocusedRef.current) scheduleMarkRead();
    },
    [scheduleMarkRead],
  );

  const handleChatContentSizeChange = React.useCallback(() => {
    if (chatFocusedRef.current) scheduleMarkRead();
  }, [scheduleMarkRead]);

  React.useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchMessages(conversationId, isLoggedIn, currentUserId)
      .then((items) => {
        if (!cancelled) {
          setMessages(sortChatMessagesAsc(items));
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, isLoggedIn, currentUserId]);

  React.useEffect(() => {
    if (loading || !messages.length || !chatFocusedRef.current) return;
    scheduleMarkRead();
  }, [loading, messages, scheduleMarkRead]);

  useFocusEffect(
    React.useCallback(() => {
      chatFocusedRef.current = true;
      scheduleMarkRead();
      void refreshMessages();
      return () => {
        chatFocusedRef.current = false;
        if (markReadTimerRef.current) {
          clearTimeout(markReadTimerRef.current);
          markReadTimerRef.current = null;
        }
        void flushMarkRead();
      };
    }, [refreshMessages, scheduleMarkRead, flushMarkRead]),
  );

  React.useEffect(() => {
    if (!conversationId || !isLoggedIn) return;
    const timer = setInterval(() => {
      if (chatFocusedRef.current) scheduleMarkRead();
      void refreshMessages();
    }, CHAT_ACK_POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, isLoggedIn, refreshMessages, scheduleMarkRead]);

  React.useEffect(() => {
    if (!conversationId || !isLoggedIn) return;
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') return;
      void refreshMessages();
      if (chatFocusedRef.current) scheduleMarkRead();
    });
    return () => subscription.remove();
  }, [conversationId, isLoggedIn, refreshMessages, scheduleMarkRead]);

  const send = React.useCallback(
    async (text: string): Promise<'ok' | 'blocked' | 'user_blocked' | 'failed'> => {
      if (!conversationId) return 'failed';
      setSending(true);
      try {
        const message = await sendMessage(conversationId, text, isLoggedIn, currentUserId);
        setMessages((prev) => sortChatMessagesAsc([...prev, message]));
        scheduleMarkRead();
        return 'ok';
      } catch (err) {
        if (err instanceof ApiError && err.code === 'USER_BLOCKED') return 'user_blocked';
        if (err instanceof ApiError && err.code === 'INVALID_STATE') return 'blocked';
        return 'failed';
      } finally {
        setSending(false);
      }
    },
    [conversationId, isLoggedIn, currentUserId, scheduleMarkRead],
  );

  return {
    messages,
    loading,
    loadError,
    sending,
    send,
    reload: refreshMessages,
    handleChatScroll,
    handleChatContentSizeChange,
  };
}
