import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { regionProducts } from '../hooks/useProductFilters';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { IconButton, Logo, Notice, PillButton, ScreenScroll, SearchBar, SectionHead, TitleBar } from '../components/UI';
import { Banner } from '../components/ProductUI';
import { ListCard, ShortcutGrid } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { colors, fonts } from '../theme';

export { MessagesScreen } from './MessagesScreen';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { nav, favCount, user, isLoggedIn } = useApp();

  const stats = [
    { labelKey: 'screens.profile.favorites', value: String(favCount), screen: 'favorites' as const },
    { labelKey: 'screens.profile.views', value: '13', screen: 'history' as const },
    { labelKey: 'screens.profile.following', value: '2', screen: 'following' as const },
    { labelKey: 'screens.profile.coupons', value: '3', screen: 'coupons' as const },
  ];

  return (
    <ScreenScroll screenId="profile">
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View style={styles.logoSlot}>
            <Logo />
          </View>
          <View style={styles.topRight}>
            <IconButton icon="messages" dot onPress={() => nav('messages')} />
            <IconButton icon="settings" onPress={() => nav('settings')} />
          </View>
        </View>
      </View>
      <AmazingSurface style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileMain}>
            <View style={styles.profileAvatar}>
              <AppIcon name="person" size={34} color={colors.text} />
            </View>
            <View style={styles.profileInfo}>
              {isLoggedIn && user ? (
                <>
                  <Text style={styles.profileName}>
                    {user.nickname}{' '}
                    <Text style={styles.profileBadge}>{t('screens.profile.badge')}</Text>
                  </Text>
                  <Text style={styles.profileSub}>
                    {t('screens.profile.idLineLoggedIn', { id: user.heishiId })}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>{t('screens.profile.guestTitle')}</Text>
                  <Text style={styles.profileSub}>{t('screens.profile.guestSub')}</Text>
                </>
              )}
            </View>
          </View>
          {isLoggedIn ? (
            <PillButton
              label={t('common.edit')}
              variant="light"
              onPress={() => nav('editProfile')}
              full
              style={styles.profileEditBtn}
            />
          ) : (
            <View style={styles.authActions}>
              <PillButton
                label={t('screens.login.submit')}
                variant="brand"
                onPress={() => nav('login')}
                style={styles.authBtn}
              />
              <PillButton
                label={t('screens.register.submit')}
                variant="light"
                onPress={() => nav('register')}
                style={styles.authBtn}
              />
            </View>
          )}
        </View>
        <View style={styles.stats}>
          {stats.map((stat, i) => (
            <Pressable
              key={stat.labelKey}
              style={[styles.stat, i < stats.length - 1 && styles.statBorder]}
              onPress={() => nav(stat.screen)}
            >
              <Text style={styles.statStrong} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={styles.statSmall} numberOfLines={2}>
                {t(stat.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </AmazingSurface>
      <SectionHead
        title={t('screens.profile.myTrade')}
        action={t('screens.profile.allOrders')}
        onAction={() => nav('orders')}
      />
      <ShortcutGrid
        compact
        items={[
          { icon: 'upload', label: t('screens.profile.myListings'), onPress: () => nav('myListings') },
          { icon: 'sold', label: t('screens.profile.sold'), onPress: () => nav('sold') },
          { icon: 'orders', label: t('screens.profile.orders'), onPress: () => nav('orders') },
          { icon: 'service', label: t('screens.profile.myServices'), onPress: () => nav('myServices') },
        ]}
      />
      <Banner
        title={t('screens.profile.bannerTitle')}
        subtitle={t('screens.profile.bannerSubtitle')}
        icon="shield"
      />
      <SectionHead title={t('screens.profile.tools')} />
      <ShortcutGrid
        compact
        items={[
          { icon: 'id', label: t('screens.profile.authCenter'), onPress: () => nav('authCenter') },
          { icon: 'badge', label: t('screens.profile.creditProfile'), onPress: () => nav('creditProfile') },
          { icon: 'review', label: t('screens.profile.reviewManage'), onPress: () => nav('reviewManage') },
          { icon: 'shield', label: t('screens.profile.safetyCenter'), onPress: () => nav('safetyCenter') },
        ]}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
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
  top: {
    marginTop: 2,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  logoSlot: {
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  profileCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  profileTop: {
    gap: 12,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileEditBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
  },
  authActions: {
    flexDirection: 'row',
    gap: 8,
  },
  authBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffefbd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  profileBadge: {
    fontSize: 10,
    fontWeight: fonts.weights.bold,
    backgroundColor: '#fff1d6',
    color: '#b65d00',
  },
  profileSub: {
    marginTop: 4,
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  statStrong: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  statSmall: {
    marginTop: 3,
    color: '#777777',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
});
