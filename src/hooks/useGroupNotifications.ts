import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import {
  deleteNotification,
  listGroupNotifications,
  markNotificationGroupRead,
} from '../services/notificationsService';
import type { NotificationCategory, UiInboxNotification } from '../types';

export function useGroupNotifications(
  category: NotificationCategory | null,
  isLoggedIn: boolean,
  authReady: boolean,
) {
  const [items, setItems] = React.useState<UiInboxNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady || !category) return;
    setLoading(true);
    listGroupNotifications(category, isLoggedIn)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [authReady, category, isLoggedIn, i18n.language]);

  React.useEffect(() => {
    if (!category || !authReady) return;
    void markNotificationGroupRead(category, isLoggedIn)
      .then(refresh)
      .catch(() => refresh());
  }, [authReady, category, isLoggedIn, refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const remove = React.useCallback(
    async (notificationId: string) => {
      await deleteNotification(notificationId, isLoggedIn);
      setItems((prev) => prev.filter((item) => item.id !== notificationId));
    },
    [isLoggedIn],
  );

  return { items, loading, refresh, remove };
}