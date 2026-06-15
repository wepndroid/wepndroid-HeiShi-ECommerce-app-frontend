import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { PrivacySettingsDto } from '../api/types';
import { fetchPrivacySettings, patchPrivacySettings } from '../services/settingsService';

export function usePrivacySettings(isLoggedIn: boolean, authReady: boolean) {
  const [settings, setSettings] = React.useState<PrivacySettingsDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchPrivacySettings(isLoggedIn)
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
    async (key: keyof PrivacySettingsDto) => {
      if (!settings) return;
      const nextValue = !settings[key];
      setSettings({ ...settings, [key]: nextValue });
      try {
        const next = await patchPrivacySettings(isLoggedIn, { [key]: nextValue });
        setSettings(next);
      } catch {
        setSettings(settings);
      }
    },
    [isLoggedIn, settings],
  );

  return { settings, loading, toggle };
}
