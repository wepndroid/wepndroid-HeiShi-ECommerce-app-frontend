import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useConversations } from '../hooks/useConversations';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { IconButton, Notice, PillButton, ScreenScroll, SearchBar, SectionHead, TitleBar } from '../components/UI';
import { ListCard } from '../components/FormUI';
import { colors, fonts } from '../theme';

export function MessagesScreen() {
  const { t } = useTranslation();
  const { nav, toast, openChat, isLoggedIn, authReady } = useApp();
  const { conversations } = useConversations(isLoggedIn, authReady);

  const systemRows = [
    { icon: 'bell' as AppIconName, titleKey: 'screens.messages.systemTitle', msgKey: 'screens.messages.systemMsg', timeKey: 'screens.messages.yesterday', unread: '2', onPress: () => toast(t('toast.systemNotice')) },
    { icon: 'package' as AppIconName, titleKey: 'screens.messages.orderTitle', msgKey: 'screens.messages.orderMsg', time: '09:24', unread: '1', onPress: () => nav('orders') },
    { icon: 'star' as AppIconName, titleKey: 'screens.messages.followTitle', msgKey: 'screens.messages.followMsg', timeKey: 'screens.messages.yesterday', onPress: () => toast(t('toast.followNew')) },
  ];

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
      <SearchBar placeholder={t('screens.messages.searchPlaceholder')} readonly />
      <ListCard>
        {systemRows.map((row, index) => (
          <Pressable
            key={row.titleKey}
            style={[styles.messageRow, index < systemRows.length - 1 && styles.messageBorder]}
            onPress={row.onPress}
          >
            <View style={styles.messageAvatar}>
              <AppIcon name={row.icon} size={22} color="#b87000" />
              {'unread' in row && row.unread ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{row.unread}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.messageInfo}>
              <Text style={styles.messageTitle}>{t(row.titleKey)}</Text>
              <Text style={styles.messageMsg} numberOfLines={1}>
                {t(row.msgKey)}
              </Text>
            </View>
            <Text style={styles.time}>{'timeKey' in row && row.timeKey ? t(row.timeKey) : row.time}</Text>
          </Pressable>
        ))}
      </ListCard>
      <ListCard>
        {conversations.map((row, index) => (
          <Pressable
            key={row.id}
            style={[styles.messageRow, index < conversations.length - 1 && styles.messageBorder]}
            onPress={() =>
              openChat({
                conversationId: row.id,
                counterpartName: row.counterpartName,
                listingId: row.listingId,
              })
            }
          >
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>{row.counterpartName.slice(0, 1)}</Text>
              {row.unreadCount > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{row.unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.messageInfo}>
              <Text style={styles.messageTitle}>
                {row.counterpartName}
                {row.verified ? ` ${t('common.verifiedBadge')}` : ''}
              </Text>
              <Text style={styles.messageMsg} numberOfLines={1}>
                {row.lastMessage}
              </Text>
            </View>
            <Text style={styles.time}>{row.timeLabel}</Text>
          </Pressable>
        ))}
      </ListCard>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  messageBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff1c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  unread: {
    position: 'absolute',
    right: -2,
    top: -3,
    backgroundColor: colors.brand2,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: fonts.weights.bold,
  },
  messageInfo: {
    flex: 1,
    minWidth: 0,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  messageMsg: {
    marginTop: 5,
    color: '#888888',
    fontSize: 12,
  },
  time: {
    fontSize: 11,
    color: '#aaaaaa',
    flexShrink: 0,
  },
});
