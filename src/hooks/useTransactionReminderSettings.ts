import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { TransactionReminderSettingsDto } from '../api/types';
import {
  fetchTransactionReminderSettings,
  patchTransactionReminderSettings,
} from '../services/settingsService';

export function useTransactionReminderSettings(
  isLoggedIn: boolean,
  authReady: boolean,
  onSaveFailed?: () => void,
) {
  const [settings, setSettings] = React.useState<TransactionReminderSettingsDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchTransactionReminderSettings(isLoggedIn)
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
    async (key: keyof TransactionReminderSettingsDto) => {
      if (!settings) return;
      const nextValue = !settings[key];
      setSettings({ ...settings, [key]: nextValue });
      try {
        const next = await patchTransactionReminderSettings(isLoggedIn, { [key]: nextValue });
        setSettings(next);
      } catch {
        setSettings(settings);
        onSaveFailed?.();
      }
    },
    [isLoggedIn, onSaveFailed, settings],
  );

  return { settings, loading, toggle };
}
