import { apiRequest } from '../api/client';

export type NotificationRoleContext = 'buyer' | 'seller' | 'both';

export interface NotificationPreference {
  id: string;
  userRoleContext: NotificationRoleContext;
  category: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  mandatory: boolean;
}

export function listNotificationPreferences(
  role?: NotificationRoleContext,
): Promise<NotificationPreference[]> {
  return apiRequest('/notification-preferences', { query: { role } });
}

export function updateNotificationPreference(input: {
  userRoleContext: NotificationRoleContext;
  category: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
}): Promise<NotificationPreference> {
  return apiRequest('/notification-preferences', { method: 'PUT', body: input });
}
