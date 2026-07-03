import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/typography';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGroupNotifications } from '../hooks/useGroupNotifications';
import { useAuthStore } from '../store/authStore';
import { useCatalogStore } from '../store/catalogStore';
import { nav } from '../store/navigation';
import { toast } from '../store/uiStore';
import { AppIcon } from '../components/AppIcon';
import { BackButton, ScreenScroll, TitleBar } from '../components/UI';
import { ListCard } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import type { NotificationCategory } from '../types';
import { colors, fonts, messagesScreenTokens } from '../theme';
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
  useAuthGuard();
  const { category: rawCategory } = useLocalSearchParams<{ category: string }>();
  const category = parseCategory(rawCategory);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
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
    if (item.actionRef) {
      const listingId = Number(item.actionRef);
      if (Number.isFinite(listingId) && listingId > 0) {
        const fromCatalog = products.find((p) => p.id === listingId);
        openDetail(
          fromCatalog ?? {
            id: listingId,
            price: 0,
            catKey: 'misc',
            tagKey: 'lightlyUsed',
            sellerKey: '',
            seller: '',
            loc: '',
            height: '',
            imageUrl: '',
            apiTitle: item.title,
          },
        );
        return;
      }
    }
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(t('screens.messageGroup.deleteTitle'), t('screens.messageGroup.deleteBody', { title }), [
      { text: t('screens.messageGroup.cancel'), style: 'cancel' },
      {
        text: t('screens.messageGroup.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void remove(id)
            .then(() => toast(t('toast.notificationDeleted')))
            .catch(() => toast(t('toast.notificationDeleteFailed')));
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
        <ListCard compact>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.row, index < items.length - 1 && styles.rowBorder]}
            >
              <Pressable style={styles.rowMain} onPress={() => handleOpen(item)}>
                <View style={styles.rowHeader}>
                  <Text
                    style={[styles.title, item.unread && styles.titleUnread, styles.titleFlex]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.time}>
                    {formatMessageTimeLabel(item.timeLabel, t, i18n.language)}
                  </Text>
                </View>
                <Text style={styles.body} numberOfLines={messagesScreenTokens.groupBodyLines}>
                  {item.body}
                </Text>
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
    alignItems: 'center',
    paddingVertical: messagesScreenTokens.rowPaddingVertical,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    gap: messagesScreenTokens.previewGap,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontWeight: fonts.weights.medium,
    fontSize: messagesScreenTokens.titleSize,
    color: colors.text,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  titleUnread: {
    fontWeight: fonts.weights.bold,
  },
  body: {
    fontSize: messagesScreenTokens.groupBodySize,
    color: colors.muted,
    lineHeight: messagesScreenTokens.groupBodyLineHeight,
  },
  time: {
    fontSize: messagesScreenTokens.timeSize,
    color: colors.muted,
    flexShrink: 0,
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
    fontSize: messagesScreenTokens.emptySize,
    color: colors.muted,
    textAlign: 'center',
  },
});
