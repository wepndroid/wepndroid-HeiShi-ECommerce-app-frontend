import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { NotificationSettingsDto } from '../api/types';
import {
  fetchNotificationSettings,
  patchNotificationSettings,
} from '../services/settingsService';
import { notifyInboxRefresh } from '../services/messagesService';

export function useNotificationSettings(
  isLoggedIn: boolean,
  authReady: boolean,
  onSaveFailed?: () => void,
) {
  const [settings, setSettings] = React.useState<NotificationSettingsDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchNotificationSettings(isLoggedIn)
      .then(setSettings)
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

  const toggle = React.useCallback(
    async (key: keyof NotificationSettingsDto) => {
      if (!settings) return;
      const nextValue = !settings[key];
      setSettings({ ...settings, [key]: nextValue });
      try {
        const next = await patchNotificationSettings(isLoggedIn, { [key]: nextValue });
        setSettings(next);
        notifyInboxRefresh();
      } catch {
        setSettings(settings);
        onSaveFailed?.();
      }
    },
    [isLoggedIn, onSaveFailed, settings],
  );

  return { settings, loading, toggle };
}
