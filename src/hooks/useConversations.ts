import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { listConversations, subscribeInboxPoll, subscribeInboxRefresh } from '../services/messagesService';
import type { UiConversation } from '../types';

export function useConversations(isLoggedIn: boolean, authReady: boolean) {
  const [conversations, setConversations] = React.useState<UiConversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setLoadError(false);
    listConversations(isLoggedIn)
      .then((rows) => {
        setConversations(rows);
        setLoadError(false);
      })
      .catch(() => {
        setConversations((prev) => {
          if (prev.length === 0) setLoadError(true);
          return prev;
        });
      })
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, i18n.language]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  React.useEffect(() => subscribeInboxRefresh(refresh), [refresh]);

  React.useEffect(() => {
    if (!authReady) return;
    return subscribeInboxPoll((rows) => {
      setConversations(rows);
      setLoading(false);
      setLoadError(false);
    });
  }, [authReady]);

  return { conversations, loading, loadError, refresh };
}
