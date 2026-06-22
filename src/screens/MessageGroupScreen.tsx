import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/typography';
import { useApp } from '../context/AppContext';
import { useGroupNotifications } from '../hooks/useGroupNotifications';
import { AppIcon } from '../components/AppIcon';
import { BackButton, ScreenScroll, TitleBar } from '../components/UI';
import { ListCard } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import type { NotificationCategory } from '../types';
import { colors, fonts } from '../theme';
import { formatMessageTimeLabel } from '../utils/formatMessageTimeLabel';

const GROUP_TITLE_KEYS: Record<NotificationCategory, string> = {
  system: 'screens.messages.systemTitle',
  order: 'screens.messages.orderTitle',
  follow: 'screens.messages.followTitle',
};

function parseCategory(raw: string | string[] | undefined): NotificationCategory | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'system' || value === 'order' || value === 'follow') return value;
  return null;
}

export function MessageGroupScreen() {
  const { t, i18n } = useTranslation();
  const { category: rawCategory } = useLocalSearchParams<{ category: string }>();
  const category = parseCategory(rawCategory);
  const { nav, toast, isLoggedIn, authReady } = useApp();
  const { items, loading, remove } = useGroupNotifications(category, isLoggedIn, authReady);

  const handleOpen = (item: (typeof items)[number]) => {
    if (item.actionType === 'orders') {
      nav('orders');
      return;
    }
    if (item.actionType === 'following') {
      nav('following');
      return;
    }
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(t('screens.messageGroup.deleteTitle'), t('screens.messageGroup.deleteBody', { title }), [
      { text: t('screens.messageGroup.cancel'), style: 'cancel' },
      {
        text: t('screens.messageGroup.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void remove(id).then(() => toast(t('toast.notificationDeleted')));
        },
      },
    ]);
  };

  if (!category) {
    return null;
  }

  return (
    <ScreenScroll screenId="messageGroup">
      <TitleBar
        center={t(GROUP_TITLE_KEYS[category])}
        left={<BackButton />}
      />
      {loading ? (
        <AmazingSurface style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('screens.messageGroup.loading')}</Text>
        </AmazingSurface>
      ) : items.length ? (
        <ListCard>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.row, index < items.length - 1 && styles.rowBorder]}
            >
              <Pressable style={styles.rowMain} onPress={() => handleOpen(item)}>
                <View style={styles.rowText}>
                  <Text style={[styles.title, item.unread && styles.titleUnread]}>{item.title}</Text>
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body}
                  </Text>
                  <Text style={styles.time}>
                    {formatMessageTimeLabel(item.timeLabel, t, i18n.language)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item.id, item.title)}
                accessibilityRole="button"
                accessibilityLabel={t('screens.messageGroup.deleteA11y')}
              >
                <AppIcon name="trash" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </ListCard>
      ) : (
        <AmazingSurface style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('screens.messageGroup.empty')}</Text>
        </AmazingSurface>
      )}
    </ScreenScroll>
  );
}

export function openMessageGroup(category: NotificationCategory) {
  router.push(`/messages/group/${category}` as Href);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowMain: {
    flex: 1,
  },
  rowText: {
    gap: 4,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  titleUnread: {
    fontFamily: fonts.bold,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  deleteBtn: {
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 4,
  },
  emptyState: {
    marginTop: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
