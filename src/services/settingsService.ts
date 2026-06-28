import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Share } from 'react-native';
import { ApiError, settingsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { refreshAuthSession } from './authService';
import type { DataExportDto, NotificationSettingsDto, PrivacySettingsDto, TransactionReminderSettingsDto } from '../api/types';
import { BROWSE_HISTORY_KEY, clearLocalBrowseHistory } from '../data/history';
import { clearLocalInboxCache } from '../data/notificationsLocal';
import {
  formatCacheSize,
  loadLocalNotificationSettings,
  loadLocalPrivacySettings,
  loadLocalTransactionReminderSettings,
  saveLocalNotificationSettings,
  saveLocalPrivacySettings,
  saveLocalTransactionReminderSettings,
} from '../data/settingsLocal';

/**
 * Clear cache removes disposable data only:
 * - Browse history (local + server when logged in)
 * - Mock inbox notification overrides
 * - Image/temp files in the app cache directory
 * Does not remove auth, favorites, follows, settings, messages, or drafts.
 */
const LOCAL_INBOX_KEY = 'localInboxNotifications';

const cacheClearListeners = new Set<() => void>();

export function subscribeCacheClear(listener: () => void): () => void {
  cacheClearListeners.add(listener);
  return () => cacheClearListeners.delete(listener);
}

function notifyCacheClear(): void {
  cacheClearListeners.forEach((listener) => listener());
}

function stringByteLength(value: string): number {
  return unescape(encodeURIComponent(value)).length;
}

async function measureFileCacheBytes(): Promise<number> {
  const dir = FileSystem.cacheDirectory;
  if (!dir) return 0;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists && 'size' in info && typeof info.size === 'number') {
      return info.size;
    }
    const names = await FileSystem.readDirectoryAsync(dir);
    let total = 0;
    for (const name of names) {
      const entry = await FileSystem.getInfoAsync(`${dir}${name}`);
      if (entry.exists && 'size' in entry && typeof entry.size === 'number') {
        total += entry.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function measureLocalCacheStorageBytes(): Promise<number> {
  let total = 0;
  const historyRaw = await AsyncStorage.getItem(BROWSE_HISTORY_KEY);
  if (historyRaw) total += stringByteLength(historyRaw);
  const inboxRaw = await AsyncStorage.getItem(LOCAL_INBOX_KEY);
  if (inboxRaw) total += stringByteLength(inboxRaw);
  return total;
}

export async function measureLocalCacheBytes(): Promise<number> {
  return (await measureLocalCacheStorageBytes()) + (await measureFileCacheBytes());
}

export async function getAppCacheSizeLabel(): Promise<string> {
  return formatCacheSize(await measureLocalCacheBytes());
}

async function clearLocalAppCache(): Promise<number> {
  const before = await measureLocalCacheBytes();
  await clearLocalBrowseHistory();
  await clearLocalInboxCache();
  const dir = FileSystem.cacheDirectory;
  if (dir) {
    try {
      const names = await FileSystem.readDirectoryAsync(dir);
      await Promise.all(
        names.map((name) =>
          FileSystem.deleteAsync(`${dir}${name}`, { idempotent: true }),
        ),
      );
    } catch {
      // non-fatal
    }
  }
  const after = await measureLocalCacheBytes();
  return Math.max(0, before - after);
}

async function fetchAuthedSettings<T>(
  request: () => Promise<T>,
  loadLocal: () => Promise<T>,
  saveLocal: (value: T) => Promise<T>,
): Promise<T> {
  const loadCached = () => loadLocal();

  try {
    const remote = await request();
    await saveLocal(remote);
    return remote;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        try {
          const remote = await request();
          await saveLocal(remote);
          return remote;
        } catch {
          // fall through to cached local settings
        }
      }
    }
    return loadCached();
  }
}

async function patchAuthedSettings<T>(
  request: () => Promise<T>,
  saveLocal: (value: T) => Promise<T>,
  localFallback: () => Promise<T>,
): Promise<T> {
  try {
    const remote = await request();
    await saveLocal(remote);
    return remote;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        try {
          const remote = await request();
          await saveLocal(remote);
          return remote;
        } catch {
          // fall through
        }
      }
    }
    if (!API_USE_MOCK_FALLBACK) throw new Error('settings_update_failed');
    return localFallback();
  }
}

export async function fetchNotificationSettings(
  isLoggedIn: boolean,
): Promise<NotificationSettingsDto> {
  if (isLoggedIn) {
    return fetchAuthedSettings(
      () => settingsApi.getNotificationSettings(),
      loadLocalNotificationSettings,
      saveLocalNotificationSettings,
    );
  }
  return loadLocalNotificationSettings();
}

export async function patchNotificationSettings(
  isLoggedIn: boolean,
  patch: Partial<NotificationSettingsDto>,
): Promise<NotificationSettingsDto> {
  if (isLoggedIn) {
    return patchAuthedSettings(
      () => settingsApi.updateNotificationSettings(patch),
      saveLocalNotificationSettings,
      () => saveLocalNotificationSettings(patch),
    );
  }
  return saveLocalNotificationSettings(patch);
}

export async function fetchPrivacySettings(isLoggedIn: boolean): Promise<PrivacySettingsDto> {
  if (isLoggedIn) {
    return fetchAuthedSettings(
      () => settingsApi.getPrivacySettings(),
      loadLocalPrivacySettings,
      saveLocalPrivacySettings,
    );
  }
  return loadLocalPrivacySettings();
}

export async function patchPrivacySettings(
  isLoggedIn: boolean,
  patch: Partial<PrivacySettingsDto>,
): Promise<PrivacySettingsDto> {
  if (isLoggedIn) {
    return patchAuthedSettings(
      () => settingsApi.updatePrivacySettings(patch),
      saveLocalPrivacySettings,
      () => saveLocalPrivacySettings(patch),
    );
  }
  return saveLocalPrivacySettings(patch);
}

export async function fetchTransactionReminderSettings(
  isLoggedIn: boolean,
): Promise<TransactionReminderSettingsDto> {
  if (isLoggedIn) {
    return fetchAuthedSettings(
      () => settingsApi.getTransactionReminderSettings(),
      loadLocalTransactionReminderSettings,
      saveLocalTransactionReminderSettings,
    );
  }
  return loadLocalTransactionReminderSettings();
}

export async function patchTransactionReminderSettings(
  isLoggedIn: boolean,
  patch: Partial<TransactionReminderSettingsDto>,
): Promise<TransactionReminderSettingsDto> {
  if (isLoggedIn) {
    return patchAuthedSettings(
      () => settingsApi.updateTransactionReminderSettings(patch),
      saveLocalTransactionReminderSettings,
      () => saveLocalTransactionReminderSettings(patch),
    );
  }
  return saveLocalTransactionReminderSettings(patch);
}

export async function clearAppCache(isLoggedIn: boolean): Promise<number> {
  const freedBytes = await clearLocalAppCache();
  if (isLoggedIn) {
    try {
      await settingsApi.clearCache();
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('cache_clear_failed');
    }
  }
  notifyCacheClear();
  return freedBytes;
}

export async function exportUserData(isLoggedIn: boolean): Promise<DataExportDto> {
  if (isLoggedIn) {
    try {
      return await settingsApi.exportData();
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('data_export_failed');
    }
  }
  throw new Error('data_export_failed');
}

export async function shareUserDataExport(isLoggedIn: boolean): Promise<void> {
  const data = await exportUserData(isLoggedIn);
  const json = JSON.stringify(data, null, 2);
  const filename = `heymarket-data-${Date.now()}.json`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (cacheDir) {
    const fileUri = `${cacheDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
    await Share.share({ url: fileUri, title: filename, message: json });
    return;
  }

  await Share.share({ message: json, title: filename });
}
