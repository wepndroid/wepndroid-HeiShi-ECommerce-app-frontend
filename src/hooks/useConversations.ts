import React from 'react';
import { useFocusEffect } from 'expo-router';
import { listConversations } from '../services/messagesService';
import type { UiConversation } from '../types';

export function useConversations(isLoggedIn: boolean, authReady: boolean) {
  const [conversations, setConversations] = React.useState<UiConversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listConversations(isLoggedIn)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { conversations, loading, refresh };
}
