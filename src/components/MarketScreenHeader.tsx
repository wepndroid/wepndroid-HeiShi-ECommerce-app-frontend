import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { IconButton, Logo } from './UI';
import { useConversations } from '../hooks/useConversations';
import { useNotificationGroups } from '../hooks/useNotificationGroups';
import { inboxUnreadCount } from '../services/messagesService';
import { amazingStylePill, colors, fonts, headerTopBleedStyle } from '../theme';

export function useInboxUnreadCount(isLoggedIn: boolean, authReady: boolean): number {
  const { conversations } = useConversations(isLoggedIn, authReady);
  const { groups } = useNotificationGroups(isLoggedIn, authReady);

  return useMemo(() => {
    if (!isLoggedIn) return 0;
    return inboxUnreadCount([...conversations, ...groups]);
  }, [conversations, groups, isLoggedIn]);
}

export function MarketScreenHeader({
  showRegion = true,
  regionLabelText,
  unreadCount = 0,
  onRegionPress,
  onMessagesPress,
  onSettingsPress,
}: {
  showRegion?: boolean;
  regionLabelText?: string;
  unreadCount?: number;
  onRegionPress?: () => void;
  onMessagesPress?: () => void;
  onSettingsPress?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.top}>
      <View style={styles.topRow}>
        <View style={styles.logoSlot}>
          <Logo />
        </View>
        {showRegion ? (
          onRegionPress ? (
            <Pressable style={styles.city} onPress={onRegionPress}>
              <AppIcon name="mapPin" size={14} color={colors.sub} />
              <Text style={styles.cityText} numberOfLines={1}>
                {regionLabelText} ▾
              </Text>
            </Pressable>
          ) : (
            <View style={styles.city}>
              <AppIcon name="mapPin" size={14} color={colors.sub} />
              <Text style={styles.cityText} numberOfLines={1}>
                {regionLabelText}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.regionSpacer} />
        )}
        <View style={styles.topRight}>
          <IconButton
            icon="messages"
            label={t('common.a11y.messages')}
            badgeCount={unreadCount}
            onPress={onMessagesPress}
          />
          <IconButton
            icon="settings"
            label={t('common.a11y.settings')}
            onPress={onSettingsPress}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 2,
    marginBottom: 12,
    ...headerTopBleedStyle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSlot: {
    flexShrink: 0,
  },
  regionSpacer: {
    flex: 1,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  city: {
    ...amazingStylePill,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
});
