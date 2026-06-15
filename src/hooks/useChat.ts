import React from 'react';
import { fetchMessages, sendMessage } from '../services/messagesService';
import type { UiChatMessage } from '../types';

export function useChat(
  conversationId: string | null,
  isLoggedIn: boolean,
  currentUserId?: string,
) {
  const [messages, setMessages] = React.useState<UiChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMessages(conversationId, isLoggedIn, currentUserId)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, isLoggedIn, currentUserId]);

  const send = React.useCallback(
    async (text: string) => {
      if (!conversationId) return false;
      setSending(true);
      try {
        const message = await sendMessage(conversationId, text, isLoggedIn, currentUserId);
        setMessages((prev) => [...prev, message]);
        return true;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, isLoggedIn, currentUserId],
  );

  return { messages, loading, sending, send };
}
