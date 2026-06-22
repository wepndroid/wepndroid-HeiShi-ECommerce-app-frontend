import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useConversations } from '../hooks/useConversations';
import { useNotificationGroups } from '../hooks/useNotificationGroups';
import { openMessageGroup } from './MessageGroupScreen';
import { AppIcon } from '../components/AppIcon';
import { IconButton, EmptyHint, Notice, ScreenScroll, SearchBar, TitleBar } from '../components/UI';
import { ListCard } from '../components/FormUI';
import { SellerAvatar } from '../components/SellerAvatar';
import { colors, fonts, iconTokens } from '../theme';
import { formatMessageTimeLabel } from '../utils/formatMessageTimeLabel';

const GROUP_TITLE_KEYS = {
  system: 'screens.messages.systemTitle',
  order: 'screens.messages.orderTitle',
  follow: 'screens.messages.followTitle',
} as const;

export function MessagesScreen() {
  const { t, i18n } = useTranslation();
  const { nav, toast, openChat, openSellerProfile, isLoggedIn, authReady } = useApp();
  const { conversations } = useConversations(isLoggedIn, authReady);
  const { groups } = useNotificationGroups(isLoggedIn, authReady);
  const [query, setQuery] = useState('');

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

  const hasResults = filteredGroups.length > 0 || filteredConversations.length > 0;

  return (
    <ScreenScroll screenId="messages">
      <TitleBar
        title={t('screens.messages.title')}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon="bell" onPress={() => toast(t('toast.notificationsEnabled'))} />
            <IconButton icon="settings" onPress={() => nav('settings')} />
          </View>
        }
      />
      <Notice
        text={t('screens.messages.notice')}
        action={t('common.enable')}
        onAction={() => toast(t('toast.notificationsEnabled'))}
      />
      <SearchBar
        placeholder={t('screens.messages.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />
      {!hasResults && normalizedQuery ? (
        <EmptyHint text={t('screens.messages.noSearchResults')} />
      ) : null}
      {filteredGroups.length ? (
      <ListCard>
        {filteredGroups.map((row, index) => (
          <Pressable
            key={row.category}
            style={[styles.messageRow, index < filteredGroups.length - 1 && styles.messageBorder]}
            onPress={() => openMessageGroup(row.category)}
          >
            <View style={styles.messageAvatar}>
              <AppIcon name={row.icon} size={iconTokens.sizes.lg} color={iconTokens.accent} />
              {row.unreadCount > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{row.unreadCount}</Text>
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
      {filteredConversations.length ? (
      <ListCard>
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
          >
            <Pressable
              style={styles.messageAvatar}
              onPress={() => openSellerProfile(row.counterpartKey)}
            >
              <SellerAvatar
                sellerKey={row.counterpartKey}
                seller={row.counterpartName}
                avatarUrl={row.counterpartAvatarUrl}
                size={44}
              />
              {row.unreadCount > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{row.unreadCount}</Text>
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
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  messageBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  messageAvatar: {
    width: 44,
    height: 44,
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
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.phoneBorder,
  },
  messageInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  messageTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  messageTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    flexShrink: 0,
  },
  messageMsg: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
});
