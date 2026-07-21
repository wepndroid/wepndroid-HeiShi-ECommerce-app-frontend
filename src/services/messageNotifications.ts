import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { AppState, Platform } from 'react-native';
import { pushTokenApi } from '../api/endpoints/user';
import i18n from '../i18n';

export const CHAT_CHANNEL_ID = 'chat-messages';
export const ORDER_CHANNEL_ID = 'order-updates';
const PUSH_TOKEN_STORAGE_KEY = 'devicePushToken';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

type ExpoNotifications = typeof import('expo-notifications');
type NotificationResponse = import('expo-notifications').NotificationResponse;

let configured = false;
let notificationsUsable = true;
let notificationsModule: ExpoNotifications | null | undefined;
let cachedPushToken: string | null = null;
/** Conversation the user is actively viewing — suppress shade alerts only for this thread. */
let activeChatConversationId: string | null = null;

export function setActiveChatConversationIdForNotifications(conversationId: string | null): void {
  activeChatConversationId = conversationId;
}

function notificationsNativeAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return requireOptionalNativeModule('ExpoNotifications') != null;
}

export function areChatNotificationsSupported(): boolean {
  return notificationsNativeAvailable();
}

function loadNotifications(): ExpoNotifications | null {
  if (notificationsModule !== undefined) return notificationsModule;
  notificationsModule = null;

  if (!notificationsNativeAvailable()) {
    notificationsUsable = false;
    return null;
  }

  try {
    // Static require — Metro resolves this; dynamic import() breaks on RN.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as ExpoNotifications;
    return notificationsModule;
  } catch {
    notificationsUsable = false;
    return null;
  }
}

function notificationsDisabled(): boolean {
  return Platform.OS === 'web' || !notificationsUsable;
}

function getExpoProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

async function runNotificationTask<T>(
  task: (Notifications: ExpoNotifications) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (notificationsDisabled()) return fallback;
  const Notifications = loadNotifications();
  if (!Notifications) return fallback;
  try {
    return await task(Notifications);
  } catch {
    return fallback;
  }
}

export async function configureMessageNotifications(): Promise<void> {
  if (notificationsDisabled() || configured) return;

  await runNotificationTask(async (Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;
        const isChat = data && data.type === 'chat';
        const convId = data && typeof data.conversationId === 'string' ? data.conversationId : null;
        const viewingThisChat =
          isChat &&
          convId != null &&
          activeChatConversationId != null &&
          convId === activeChatConversationId;
        const suppressForeground = viewingThisChat && AppState.currentState === 'active';
        return {
          shouldShowAlert: !suppressForeground,
          shouldPlaySound: !suppressForeground,
          shouldSetBadge: true,
          shouldShowBanner: !suppressForeground,
          shouldShowList: !suppressForeground,
        };
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
        name: i18n.t('notifications.chatChannelName'),
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5C518',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      await Notifications.setNotificationChannelAsync(ORDER_CHANNEL_ID, {
        name: i18n.t('notifications.orderChannelName'),
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5C518',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    configured = true;
  }, undefined);
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  return runNotificationTask(async (Notifications) => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, 'denied');
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  if (!areChatNotificationsSupported()) return 'denied';
  await configureMessageNotifications();
  const current = await getNotificationPermissionStatus();
  if (current === 'granted') return 'granted';

  return runNotificationTask(async (Notifications) => {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
      android: {},
    });
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }, 'denied');
}

export function hasRegisteredPushToken(): boolean {
  return cachedPushToken != null;
}

async function obtainExpoPushToken(): Promise<string | null> {
  return runNotificationTask(async (Notifications) => {
    const projectId = getExpoProjectId();
    if (!projectId) return null;
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResult.data ?? null;
  }, null);
}

/** Register this device for server push (delivers when the app is closed). */
export async function registerDevicePushTokenWithBackend(isLoggedIn: boolean): Promise<boolean> {
  if (!isLoggedIn || notificationsDisabled()) return false;

  await configureMessageNotifications();
  const permission = await requestNotificationPermissions();
  if (permission !== 'granted') return false;

  const token = await obtainExpoPushToken();
  if (!token) return false;

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  try {
    await pushTokenApi.register({ token, platform });
    cachedPushToken = token;
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export async function unregisterDevicePushToken(): Promise<void> {
  const stored = cachedPushToken ?? (await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY));
  if (stored) {
    try {
      await pushTokenApi.remove({ token: stored });
    } catch {
      // Best-effort while auth may still be valid.
    }
  }
  cachedPushToken = null;
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}

export interface ChatNotificationPayload {
  conversationId: string;
  senderName: string;
  messagePreview: string;
}

export async function showChatMessageNotification(
  payload: ChatNotificationPayload,
): Promise<void> {
  if (notificationsDisabled()) return;
  await configureMessageNotifications();
  if ((await getNotificationPermissionStatus()) !== 'granted') return;

  await runNotificationTask(async (Notifications) => {
    const title = i18n.t('notifications.newMessageTitle', { name: payload.senderName });
    const body = payload.messagePreview || i18n.t('notifications.newMessageFallback');

    await Notifications.scheduleNotificationAsync({
      identifier: `chat-${payload.conversationId}`,
      content: {
        title,
        body,
        data: { conversationId: payload.conversationId, type: 'chat' },
        sound: true,
        ...(Platform.OS === 'android'
          ? {
              channelId: CHAT_CHANNEL_ID,
              priority: Notifications.AndroidNotificationPriority.MAX,
            }
          : {}),
      },
      trigger: null,
    });
  }, undefined);
}

export async function syncAppIconBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await runNotificationTask(async (Notifications) => {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  }, undefined);
}

export type NotificationOpenPayload =
  | { type: 'chat'; conversationId: string }
  | { type: 'order'; filter?: string; orderId?: number }
  | { type: 'deepLink'; path: string };

/** Convert only application-owned links into router paths. */
export function safeNotificationPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1000) return null;
  let path = value.trim();
  if (path.startsWith('heymarket://')) {
    path = path.slice('heymarket://'.length);
  } else if (path.startsWith('/')) {
    // Already an internal path.
  } else {
    return null;
  }
  path = `/${path.replace(/^\/+/, '')}`;
  if (path.includes('\\') || /[\u0000-\u001f]/.test(path) || path.startsWith('//')) return null;

  const listing = path.match(/^\/listing\/(\d+)(?:[/?#].*)?$/);
  if (listing) return `/detail/${listing[1]}`;
  if (/^\/order\/\d+(?:[/?#].*)?$/.test(path)) return '/profile/orders';
  if (/^\/chat\/[A-Za-z0-9-]+(?:[/?#].*)?$/.test(path)) return path;
  if (/^\/support(?:\/[A-Za-z0-9-]+)?(?:[/?#].*)?$/.test(path)) return '/support';
  if (path === '/home') return '/';
  if (path === '/settings/account-safety') return path;
  return null;
}

let lastNotificationOpenId: string | null = null;
let lastNotificationOpenAt = 0;

function payloadFromResponse(response: NotificationResponse): NotificationOpenPayload | null {
  const data = response.notification.request.content.data;
  const deepLinkPath = safeNotificationPath(data?.deepLink);
  if (deepLinkPath) return { type: 'deepLink', path: deepLinkPath };
  if (data && data.type === 'order') {
    const filter = typeof data.filter === 'string' ? data.filter : 'pendingShip';
    const orderId = typeof data.orderId === 'number' ? data.orderId : undefined;
    return { type: 'order', filter, orderId };
  }
  const conversationId =
    data && typeof data.conversationId === 'string' ? data.conversationId : null;
  if (conversationId) {
    return { type: 'chat', conversationId };
  }
  return null;
}

function openFromNotification(
  onOpen: (payload: NotificationOpenPayload) => void,
  response: NotificationResponse,
): void {
  const payload = payloadFromResponse(response);
  if (!payload) return;
  const responseId = response.notification.request.identifier;
  const now = Date.now();
  if (responseId === lastNotificationOpenId && now - lastNotificationOpenAt < 2000) return;
  lastNotificationOpenId = responseId;
  lastNotificationOpenAt = now;
  onOpen(payload);
}

/** Listen for notification taps; no-op when native module is unavailable. */
export function registerNotificationOpenHandler(
  onOpen: (payload: NotificationOpenPayload) => void,
): () => void {
  if (Platform.OS === 'web') return () => {};

  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  void (async () => {
    const Notifications = loadNotifications();
    if (!Notifications || cancelled) return;

    await configureMessageNotifications();
    if (cancelled) return;

    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(onOpen, response);
    });

    const last = await Notifications.getLastNotificationResponseAsync();
    if (cancelled || !last) return;
    openFromNotification(onOpen, last);
  })();

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
