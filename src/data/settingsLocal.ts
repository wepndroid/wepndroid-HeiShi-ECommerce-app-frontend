import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import type { NotificationSettingsDto, PrivacySettingsDto } from '../api/types';

const NOTIFICATION_KEY = 'notificationSettings';
const PRIVACY_KEY = 'privacySettings';

const DEFAULT_NOTIFICATIONS: NotificationSettingsDto = {
  intentAlerts: true,
  chatMessages: true,
  reviewResults: true,
  marketing: false,
};

const DEFAULT_PRIVACY: PrivacySettingsDto = {
  findByPhone: false,
  showWechatBadge: true,
  personalization: true,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadLocalNotificationSettings(): Promise<NotificationSettingsDto> {
  return readJson(NOTIFICATION_KEY, DEFAULT_NOTIFICATIONS);
}

export async function saveLocalNotificationSettings(
  patch: Partial<NotificationSettingsDto>,
): Promise<NotificationSettingsDto> {
  const current = await loadLocalNotificationSettings();
  const next = { ...current, ...patch };
  await writeJson(NOTIFICATION_KEY, next);
  return next;
}

export async function loadLocalPrivacySettings(): Promise<PrivacySettingsDto> {
  return readJson(PRIVACY_KEY, DEFAULT_PRIVACY);
}

export async function saveLocalPrivacySettings(
  patch: Partial<PrivacySettingsDto>,
): Promise<PrivacySettingsDto> {
  const current = await loadLocalPrivacySettings();
  const next = { ...current, ...patch };
  await writeJson(PRIVACY_KEY, next);
  return next;
}

export function formatCacheSize(bytes: number): string {
  if (bytes <= 0) return i18n.t('common.cacheSizeZero');
  const mb = bytes / (1024 * 1024);
  return mb >= 0.1 ? i18n.t('common.cacheSizeMb', { size: mb.toFixed(1) }) : i18n.t('common.cacheSizeTiny');
}
