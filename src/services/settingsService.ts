import { settingsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { NotificationSettingsDto, PrivacySettingsDto } from '../api/types';
import {
  formatCacheSize,
  loadLocalNotificationSettings,
  loadLocalPrivacySettings,
  saveLocalNotificationSettings,
  saveLocalPrivacySettings,
} from '../data/settingsLocal';

export async function fetchNotificationSettings(
  isLoggedIn: boolean,
): Promise<NotificationSettingsDto> {
  if (isLoggedIn) {
    try {
      return await settingsApi.getNotificationSettings();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return loadLocalNotificationSettings();
    }
  }
  return loadLocalNotificationSettings();
}

export async function patchNotificationSettings(
  isLoggedIn: boolean,
  patch: Partial<NotificationSettingsDto>,
): Promise<NotificationSettingsDto> {
  if (isLoggedIn) {
    try {
      return await settingsApi.updateNotificationSettings(patch);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('settings_update_failed');
    }
  }
  return saveLocalNotificationSettings(patch);
}

export async function fetchPrivacySettings(isLoggedIn: boolean): Promise<PrivacySettingsDto> {
  if (isLoggedIn) {
    try {
      return await settingsApi.getPrivacySettings();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return loadLocalPrivacySettings();
    }
  }
  return loadLocalPrivacySettings();
}

export async function patchPrivacySettings(
  isLoggedIn: boolean,
  patch: Partial<PrivacySettingsDto>,
): Promise<PrivacySettingsDto> {
  if (isLoggedIn) {
    try {
      return await settingsApi.updatePrivacySettings(patch);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('settings_update_failed');
    }
  }
  return saveLocalPrivacySettings(patch);
}

export async function clearAppCache(isLoggedIn: boolean): Promise<string> {
  if (isLoggedIn) {
    try {
      const result = await settingsApi.clearCache();
      return formatCacheSize(result.freedBytes);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('cache_clear_failed');
    }
  }
  return '0 MB';
}
