import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { fetchNotificationSettings, subscribeCacheClear } from '../services/settingsService';
import { subscribeInboxPoll, subscribeInboxRefresh } from '../services/messagesService';
import { listNotificationGroups } from '../services/notificationsService';
import type { UiNotificationGroup } from '../types';

export function useNotificationGroups(isLoggedIn: boolean, authReady: boolean) {
  const [groups, setGroups] = React.useState<UiNotificationGroup[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchNotificationSettings(isLoggedIn)
      .then((settings) => listNotificationGroups(isLoggedIn, settings))
      .then(setGroups)
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

  React.useEffect(() => subscribeCacheClear(refresh), [refresh]);

  React.useEffect(() => subscribeInboxRefresh(refresh), [refresh]);

  React.useEffect(() => {
    if (!authReady) return;
    return subscribeInboxPoll(() => {
      void fetchNotificationSettings(isLoggedIn)
        .then((settings) => listNotificationGroups(isLoggedIn, settings))
        .then(setGroups);
    });
  }, [authReady, isLoggedIn, i18n.language]);

  return { groups, loading, refresh };
}
