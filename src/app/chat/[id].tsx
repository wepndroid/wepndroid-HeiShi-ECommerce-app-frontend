import { useLayoutEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { ChatScreen } from '../../screens/PublishScreens';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hydrateChatFromConversationId, authReady, isLoggedIn } = useApp();

  const conversationId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    if (!raw?.trim()) return null;
    try {
      return decodeURIComponent(raw.trim());
    } catch {
      return raw.trim();
    }
  }, [id]);

  useLayoutEffect(() => {
    if (!authReady || !isLoggedIn || !conversationId) return;
    void hydrateChatFromConversationId(conversationId);
  }, [authReady, conversationId, hydrateChatFromConversationId, isLoggedIn]);

  if (!conversationId) return null;

  return <ChatScreen conversationId={conversationId} />;
}
