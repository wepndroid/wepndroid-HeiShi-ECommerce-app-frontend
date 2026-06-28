import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePathname } from 'expo-router';
import { fetchNotificationSettings } from '../services/settingsService';
import {
  areChatNotificationsSupported,
  configureMessageNotifications,
  getNotificationPermissionStatus,
  hasRegisteredPushToken,
  registerDevicePushTokenWithBackend,
  requestNotificationPermissions,
  setActiveChatConversationIdForNotifications,
  showChatMessageNotification,
  syncAppIconBadgeCount,
} from '../services/messageNotifications';
import {
  inboxUnreadCount,
  setInboxPollAppState,
  startInboxPolling,
  subscribeInboxPoll,
  subscribeInboxRefresh,
  listConversations,
} from '../services/messagesService';
import { listNotificationGroups } from '../services/notificationsService';
import type { UiConversation } from '../types';

type ConvSnapshot = { lastMessage: string; unreadCount: number };

const ALERT_DEDUPE_MS = 15_000;

function detectNewMessages(
  conversations: UiConversation[],
  snapshot: Map<string, ConvSnapshot>,
  initialized: boolean,
): { isFirst: boolean; alerts: UiConversation[] } {
  if (!initialized) {
    conversations.forEach((c) =>
      snapshot.set(c.id, { lastMessage: c.lastMessage, unreadCount: c.unreadCount }),
    );
    return { isFirst: true, alerts: [] };
  }

  const alerts: UiConversation[] = [];
  for (const conv of conversations) {
    const prev = snapshot.get(conv.id);
    const hasNew =
      conv.unreadCount > 0 &&
      (!prev ||
        conv.unreadCount > prev.unreadCount ||
        (conv.lastMessage !== prev.lastMessage &&
          conv.unreadCount >= (prev?.unreadCount ?? 0)));
    if (hasNew) alerts.push(conv);
    snapshot.set(conv.id, { lastMessage: conv.lastMessage, unreadCount: conv.unreadCount });
  }
  return { isFirst: false, alerts };
}

function chatIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/?]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function shouldSkipAlert(
  conv: UiConversation,
  pathname: string,
  chatConversationId: string | null,
): boolean {
  const routeChatId = chatIdFromPathname(pathname);
  if (routeChatId && conv.id === routeChatId) return true;
  if (pathname.includes('/chat') && chatConversationId && conv.id === chatConversationId) return true;
  return false;
}

export function useMessageNotifications(
  isLoggedIn: boolean,
  authReady: boolean,
  chatConversationId: string | null,
  onForegroundMessage?: (conv: UiConversation) => void,
) {
  const pathname = usePathname();
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const snapshotRef = React.useRef(new Map<string, ConvSnapshot>());
  const initializedRef = React.useRef(false);
  const recentAlertsRef = React.useRef(new Map<string, number>());
  const chatConversationIdRef = React.useRef(chatConversationId);
  const chatMessagesEnabledRef = React.useRef(true);
  const pathnameRef = React.useRef(pathname);
  const onForegroundMessageRef = React.useRef(onForegroundMessage);
  chatConversationIdRef.current = chatConversationId;
  pathnameRef.current = pathname;
  onForegroundMessageRef.current = onForegroundMessage;

  React.useEffect(() => {
    setActiveChatConversationIdForNotifications(chatIdFromPathname(pathname));
  }, [pathname]);

  React.useEffect(() => {
    if (!authReady || !isLoggedIn) {
      initializedRef.current = false;
      snapshotRef.current.clear();
      recentAlertsRef.current.clear();
      void syncAppIconBadgeCount(0);
      return;
    }

    void (async () => {
      await configureMessageNotifications();
      const settings = await fetchNotificationSettings(true);
      chatMessagesEnabledRef.current = settings.chatMessages;

      const permission = await getNotificationPermissionStatus();
      if (permission === 'undetermined') {
        await requestNotificationPermissions();
      }
      await registerDevicePushTokenWithBackend(true);
    })();
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    if (!authReady || !isLoggedIn) return;

    const stopPolling = startInboxPolling(true);

    const syncBadge = (conversations: Parameters<typeof inboxUnreadCount>[0]) => {
      void (async () => {
        const groups = await listNotificationGroups(true);
        await syncAppIconBadgeCount(inboxUnreadCount([...conversations, ...groups]));
      })();
    };

    const unsubscribePoll = subscribeInboxPoll((conversations) => {
      syncBadge(conversations);
      void (async () => {
        try {
          const settings = await fetchNotificationSettings(true);
          chatMessagesEnabledRef.current = settings.chatMessages;
          if (!settings.chatMessages) return;

          const { isFirst, alerts } = detectNewMessages(
            conversations,
            snapshotRef.current,
            initializedRef.current,
          );
          if (isFirst) {
            initializedRef.current = true;
            return;
          }
          if (!alerts.length) return;

          const permission = await getNotificationPermissionStatus();
          const nativeOk = areChatNotificationsSupported();
          const inForeground = appStateRef.current === 'active';

          for (const conv of alerts) {
            if (shouldSkipAlert(conv, pathnameRef.current, chatConversationIdRef.current)) continue;

            const dedupeKey = `${conv.id}:${conv.lastMessage}`;
            const now = Date.now();
            if ((recentAlertsRef.current.get(dedupeKey) ?? 0) > now - ALERT_DEDUPE_MS) continue;
            recentAlertsRef.current.set(dedupeKey, now);

            if (permission === 'granted' && nativeOk) {
              const relyOnServerPush = hasRegisteredPushToken();
              if (!relyOnServerPush) {
                await showChatMessageNotification({
                  conversationId: conv.id,
                  senderName: conv.counterpartName,
                  messagePreview: conv.lastMessage,
                });
              }
            } else if (inForeground) {
              onForegroundMessageRef.current?.(conv);
            }
          }
        } catch {
          // Retry on the next poll tick.
        }
      })();
    });

    const subscription = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      setInboxPollAppState(next);
      if (next === 'active') {
        void registerDevicePushTokenWithBackend(true);
      }
    });
    setInboxPollAppState(AppState.currentState);

    const unsubscribeRefresh = subscribeInboxRefresh(() => {
      void (async () => {
        const conversations = await listConversations(true);
        syncBadge(conversations);
      })();
    });

    return () => {
      stopPolling();
      unsubscribePoll();
      unsubscribeRefresh();
      subscription.remove();
    };
  }, [authReady, isLoggedIn]);
}
