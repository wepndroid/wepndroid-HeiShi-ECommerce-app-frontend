import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useCatalogStore } from '../store/catalogStore';
import { useChatStore } from '../store/chatStore';
import { nav, requireAuthNav } from '../store/navigation';
import { toast } from '../store/uiStore';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useConversations } from '../hooks/useConversations';
import { useNotificationGroups } from '../hooks/useNotificationGroups';
import {
  areChatNotificationsSupported,
  getNotificationPermissionStatus,
  registerDevicePushTokenWithBackend,
  requestNotificationPermissions,
  type NotificationPermissionStatus,
} from '../services/messageNotifications';
import { openMessageGroup } from './MessageGroupScreen';
import {
  conversationShowsUnread,
  inboxUnreadCount,
  setConversationMarkedUnread,
} from '../services/messagesService';
import { AppIcon } from '../components/AppIcon';
import { IconButton, EmptyHint, LoadingState, Notice, PillButton, SearchBar, TitleBar } from '../components/UI';
import { ListCard } from '../components/FormUI';
import { SellerAvatar } from '../components/SellerAvatar';
import { colors, fonts, iconTokens, messagesScreenTokens, spacing } from '../theme';
import { formatMessageTimeLabel } from '../utils/formatMessageTimeLabel';

const GROUP_TITLE_KEYS = {
  system: 'screens.messages.systemTitle',
  order: 'screens.messages.orderTitle',
  follow: 'screens.messages.followTitle',
} as const;

export function MessagesScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const openChat = useChatStore((s) => s.openChat);
  const openSellerProfile = useCatalogStore((s) => s.openSellerProfile);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { conversations, loading: conversationsLoading, loadError: conversationsLoadError, refresh: refreshConversations } = useConversations(isLoggedIn, authReady);
  const { groups, loading: groupsLoading } = useNotificationGroups(isLoggedIn, authReady);
  const [query, setQuery] = useState('');
  const [rebuildNoticeDismissed, setRebuildNoticeDismissed] = useState(false);
  const [permissionNoticeDismissed, setPermissionNoticeDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionStatus>('undetermined');
  const notificationsSupported = areChatNotificationsSupported();

  const refreshNotificationPermission = useCallback(() => {
    void getNotificationPermissionStatus().then(setNotificationPermission);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNotificationPermission();
    }, [refreshNotificationPermission]),
  );

  const enableNotifications = useCallback(async () => {
    if (!notificationsSupported) {
      toast(t('toast.notificationsRebuildRequired'));
      return;
    }
    const status = await requestNotificationPermissions();
    setNotificationPermission(status);
    if (status === 'granted') {
      await registerDevicePushTokenWithBackend(isLoggedIn);
      toast(t('toast.notificationsEnabled'));
    } else if (status === 'denied') toast(t('toast.notificationsDenied'));
  }, [isLoggedIn, notificationsSupported, t, toast]);

  const markUnread = useCallback(
    async (conversationId: string) => {
      try {
        await setConversationMarkedUnread(conversationId, isLoggedIn, true);
        toast(t('screens.messages.markedUnread'));
      } catch {
        toast(t('toast.markUnreadFailed'));
      }
    },
    [isLoggedIn, t, toast],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return groups.filter((row) => {
      const title = t(GROUP_TITLE_KEYS[row.category]).toLowerCase();
      const preview = `${row.previewTitle ?? ''} ${row.previewBody ?? ''}`.toLowerCase();
      return title.includes(normalizedQuery) || preview.includes(normalizedQuery);
    });
  }, [groups, normalizedQuery, t]);

  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) return conversations;
    return conversations.filter(
      (row) =>
        row.counterpartName.toLowerCase().includes(normalizedQuery) ||
        row.lastMessage.toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, normalizedQuery]);

  const headerUnreadCount = useMemo(() => {
    const conversationUnread = inboxUnreadCount(conversations);
    const groupUnread = groups.reduce((sum, group) => sum + group.unreadCount, 0);
    return conversationUnread + groupUnread;
  }, [conversations, groups]);

  const hasResults = filteredGroups.length > 0 || filteredConversations.length > 0;
  const inboxLoading = authReady && (conversationsLoading || groupsLoading);

  const notificationNotice =
    !notificationsSupported && !rebuildNoticeDismissed ? (
      <Notice
        text={t('screens.messages.noticeRebuild')}
        dismissible
        dismissHint={t('screens.messages.dismissNoticeHint')}
        onDismiss={() => setRebuildNoticeDismissed(true)}
      />
    ) : notificationPermission !== 'granted' && !permissionNoticeDismissed ? (
      <Notice
        text={t('screens.messages.notice')}
        action={t('common.enable')}
        onAction={() => void enableNotifications()}
        whiteAction
        dismissible
        dismissHint={t('screens.messages.dismissNoticeHint')}
        onDismiss={() => setPermissionNoticeDismissed(true)}
      />
    ) : null;

  return (
    <View style={styles.screenRoot}>
      <View style={styles.screenHeader}>
        <TitleBar
          title={t('screens.messages.title')}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton
                icon="bell"
                badgeCount={headerUnreadCount}
                onPress={() => void enableNotifications()}
              />
              <IconButton icon="settings" onPress={() => requireAuthNav('settings')} />
            </View>
          }
        />
        {notificationNotice}
      </View>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <SearchBar
        placeholder={t('screens.messages.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />
      {!hasResults && normalizedQuery ? (
        <EmptyHint text={t('screens.messages.noSearchResults')} />
      ) : null}
      {inboxLoading ? (
        <LoadingState compact />
      ) : conversationsLoadError && !hasResults ? (
        <>
          <EmptyHint text={t('screens.messages.loadError')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refreshConversations} />
        </>
      ) : null}
      {!inboxLoading && !hasResults && !normalizedQuery && !conversationsLoadError ? (
        <EmptyHint text={t('screens.messages.emptyInbox')} />
      ) : null}
      {!inboxLoading && filteredGroups.length ? (
      <ListCard compact>
        {filteredGroups.map((row, index) => (
          <Pressable
            key={row.category}
            style={[styles.messageRow, index < filteredGroups.length - 1 && styles.messageBorder]}
            onPress={() => openMessageGroup(row.category)}
          >
            <View style={styles.messageAvatar}>
              <AppIcon name={row.icon} size={iconTokens.sizes.lg} color={iconTokens.accent} />
              {conversationShowsUnread(row) ? (
                <View style={styles.unread}>
                  {row.unreadCount > 0 ? (
                    <Text style={styles.unreadText}>{row.unreadCount}</Text>
                  ) : (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              ) : null}
            </View>
            <View style={styles.messageInfo}>
              <View style={styles.messageHeader}>
                <Text style={[styles.messageTitle, styles.messageTitleFlex]} numberOfLines={1}>
                  {t(GROUP_TITLE_KEYS[row.category])}
                </Text>
                <Text style={styles.time}>
                  {formatMessageTimeLabel(row.timeLabel, t, i18n.language)}
                </Text>
              </View>
              <Text style={styles.messageMsg} numberOfLines={1}>
                {row.previewBody || row.previewTitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </ListCard>
      ) : null}
      {!inboxLoading && filteredConversations.length ? (
      <ListCard compact>
        {filteredConversations.map((row, index) => (
          <Pressable
            key={row.id}
            style={[
              styles.messageRow,
              index < filteredConversations.length - 1 && styles.messageBorder,
            ]}
            onPress={() =>
              openChat({
                conversationId: row.id,
                counterpartName: row.counterpartName,
                listingId: row.listingId,
              })
            }
            onLongPress={() => void markUnread(row.id)}
            accessibilityHint={t('screens.messages.markUnread')}
          >
            <Pressable
              style={styles.messageAvatar}
              onPress={() => openSellerProfile(row.counterpartKey)}
            >
              <SellerAvatar
                sellerKey={row.counterpartKey}
                seller={row.counterpartName}
                avatarUrl={row.counterpartAvatarUrl}
                sellerUserId={row.counterpartKey}
                size={messagesScreenTokens.avatarSize}
              />
              {conversationShowsUnread(row) ? (
                <View style={styles.unread}>
                  {row.unreadCount > 0 ? (
                    <Text style={styles.unreadText}>{row.unreadCount}</Text>
                  ) : (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              ) : null}
            </Pressable>
            <View style={styles.messageInfo}>
              <View style={styles.messageHeader}>
                <Text style={[styles.messageTitle, styles.messageTitleFlex]} numberOfLines={1}>
                  {row.counterpartName}
                  {row.verified ? ` ${t('common.verifiedBadge')}` : ''}
                </Text>
                <Text style={styles.time}>
                  {formatMessageTimeLabel(row.timeLabel, t, i18n.language)}
                </Text>
              </View>
              <Text style={styles.messageMsg} numberOfLines={1}>
                {row.lastMessage}
              </Text>
            </View>
          </Pressable>
        ))}
      </ListCard>
      ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenHeader: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.screenPadding,
  },
  screenScroll: {
    flex: 1,
  },
  screenScrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenBottomNav,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: messagesScreenTokens.rowGap,
    paddingVertical: messagesScreenTokens.rowPaddingVertical,
  },
  messageBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  messageAvatar: {
    width: messagesScreenTokens.avatarSize,
    height: messagesScreenTokens.avatarSize,
    borderRadius: messagesScreenTokens.avatarSize / 2,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unread: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    fontWeight: fonts.weights.bold,
    fontSize: messagesScreenTokens.unreadSize,
    color: colors.phoneBorder,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.phoneBorder,
  },
  messageInfo: {
    flex: 1,
    minWidth: 0,
    gap: messagesScreenTokens.previewGap,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  messageTitle: {
    fontWeight: fonts.weights.medium,
    fontSize: messagesScreenTokens.titleSize,
    color: colors.text,
  },
  messageTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    fontSize: messagesScreenTokens.timeSize,
    color: colors.muted,
    flexShrink: 0,
  },
  messageMsg: {
    fontSize: messagesScreenTokens.previewSize,
    color: colors.muted,
  },
});
