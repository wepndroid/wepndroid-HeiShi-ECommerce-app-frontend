import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { listNotificationGroups } from '../services/notificationsService';
import type { UiNotificationGroup } from '../types';

export function useNotificationGroups(isLoggedIn: boolean, authReady: boolean) {
  const [groups, setGroups] = React.useState<UiNotificationGroup[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listNotificationGroups(isLoggedIn)
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

  return { groups, loading, refresh };
}
