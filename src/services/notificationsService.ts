import { messagesApi } from '../api';
import {
  mapInboxNotificationDtoToUi,
  mapNotificationGroupDtoToUi,
} from '../api/notificationMappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import {
  deleteLocalNotification,
  listLocalGroupNotifications,
  listLocalNotificationGroups,
  markLocalGroupRead,
} from '../data/notificationsLocal';
import type { NotificationCategory, UiInboxNotification, UiNotificationGroup } from '../types';

export async function listNotificationGroups(isLoggedIn: boolean): Promise<UiNotificationGroup[]> {
  if (isLoggedIn) {
    try {
      const groups = await messagesApi.listNotificationGroups();
      return groups.map(mapNotificationGroupDtoToUi);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  return listLocalNotificationGroups();
}

export async function listGroupNotifications(
  category: NotificationCategory,
  isLoggedIn: boolean,
): Promise<UiInboxNotification[]> {
  if (isLoggedIn) {
    try {
      const result = await messagesApi.listGroupNotifications(category, { pageSize: 50 });
      return result.items.map(mapInboxNotificationDtoToUi);
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
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('delete_notification_failed');
    }
  }
  await deleteLocalNotification(notificationId);
}

export async function markNotificationGroupRead(
  category: NotificationCategory,
  isLoggedIn: boolean,
): Promise<void> {
  if (isLoggedIn) {
    try {
      await messagesApi.markGroupRead(category);
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) return;
    }
  }
  await markLocalGroupRead(category);
}
