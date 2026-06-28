import { messagesApi } from '../api';
import {
  mapInboxNotificationDtoToUi,
  mapNotificationGroupDtoToUi,
} from '../api/notificationMappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { notifyInboxRefresh } from './messagesService';
import {
  deleteLocalNotification,
  listLocalGroupNotifications,
  listLocalNotificationGroups,
  markLocalGroupRead,
} from '../data/notificationsLocal';
import type { NotificationCategory, UiInboxNotification, UiNotificationGroup } from '../types';
import type { NotificationSettingsDto } from '../api/types';

const CATEGORY_SETTING: Record<NotificationCategory, keyof NotificationSettingsDto> = {
  system: 'intentAlerts',
  order: 'reviewResults',
  follow: 'marketing',
};

export function filterNotificationGroupsBySettings(
  groups: UiNotificationGroup[],
  settings: NotificationSettingsDto | null | undefined,
): UiNotificationGroup[] {
  if (!settings) return groups;
  return groups.filter((group) => settings[CATEGORY_SETTING[group.category]] !== false);
}

export async function listNotificationGroups(
  isLoggedIn: boolean,
  settings?: NotificationSettingsDto | null,
): Promise<UiNotificationGroup[]> {
  if (isLoggedIn) {
    try {
      const groups = await messagesApi.listNotificationGroups();
      return filterNotificationGroupsBySettings(groups.map(mapNotificationGroupDtoToUi), settings);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  return filterNotificationGroupsBySettings(await listLocalNotificationGroups(), settings);
}

export async function listGroupNotifications(
  category: NotificationCategory,
  isLoggedIn: boolean,
): Promise<UiInboxNotification[]> {
  if (isLoggedIn) {
    try {
      const items: UiInboxNotification[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await messagesApi.listGroupNotifications(category, { page, pageSize: 50 });
        items.push(...result.items.map(mapInboxNotificationDtoToUi));
        hasMore = result.hasMore;
        page += 1;
      }
      return items;
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  return listLocalGroupNotifications(category);
}

export async function deleteNotification(notificationId: string, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await messagesApi.deleteNotification(notificationId);
      notifyInboxRefresh();
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('delete_notification_failed');
    }
  }
  await deleteLocalNotification(notificationId);
  notifyInboxRefresh();
}

export async function markNotificationGroupRead(
  category: NotificationCategory,
  isLoggedIn: boolean,
): Promise<void> {
  if (isLoggedIn) {
    try {
      await messagesApi.markGroupRead(category);
      notifyInboxRefresh();
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('mark_group_read_failed');
    }
  }
  await markLocalGroupRead(category);
  notifyInboxRefresh();
}
