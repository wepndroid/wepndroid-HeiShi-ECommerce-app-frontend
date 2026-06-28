import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSessionAvatarUrl } from '../hooks/useCurrentUserAvatar';
import { normalizeAvatarUrl } from '../utils/sellerAvatar';
import { ApiError } from '../api/client';
import { useFeed } from '../hooks/useFeed';
import { useFavoriteProducts } from '../hooks/useFavoriteProducts';
import { useHistoryProducts } from '../hooks/useHistory';
import { useCoupons } from '../hooks/useCoupons';
import { feedTitleKey } from '../hooks/useProductFilters';
import { ALL_AREAS, formatAreaLabel } from '../data/region';
import { AppIcon } from '../components/AppIcon';
import { MarketScreenHeader, useInboxUnreadCount } from '../components/MarketScreenHeader';
import { PillButton, ScreenScroll, SectionHead, Badge } from '../components/UI';
import { Banner, ProductFeed } from '../components/ProductUI';
import { profilePageBannerForLanguage } from '../assets/profileBanner';
import { ShortcutGrid } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { colors, fonts, profileScreenTokens, radius } from '../theme';

export { MessagesScreen } from './MessagesScreen';

const PROFILE_RECOMMEND_LIMIT = 6;
const DEMO_PROFILE_STATS = {
  favorites: 4,
  history: 13,
  following: 2,
  coupons: 3,
} as const;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const {
    nav,
    requireAuthNav,
    user,
    isLoggedIn,
    authReady,
    toast,
    region,
    openDetail,
    openSearch,
    followCount,
    updateUser,
    favs,
  } = useApp();
  const inboxUnreadCount = useInboxUnreadCount(isLoggedIn, authReady);
  const { profile, save } = useUserProfile(user, authReady);
  const { pickAndUpload, uploading } = useAvatarUpload(isLoggedIn);
  const sessionAvatarUrl = useSessionAvatarUrl();
  const { items: favoriteItems } = useFavoriteProducts(isLoggedIn, favs);
  const { items: historyItems } = useHistoryProducts(region, isLoggedIn);
  const { coupons } = useCoupons(isLoggedIn, authReady);
  const availableCouponCount = useMemo(
    () => coupons.filter((c) => c.status === 'available').length,
    [coupons],
  );
  const { items: recommendedFeed } = useFeed(region, 'recommended', null);
  const recommendedProducts = useMemo(
    () => recommendedFeed.slice(0, PROFILE_RECOMMEND_LIMIT),
    [recommendedFeed],
  );

  const recommendTitleKey = feedTitleKey('recommended', region);
  const recommendTitle = t(
    recommendTitleKey,
    region.area === ALL_AREAS ? undefined : { area: formatAreaLabel(region.area) },
  );

  const displayAvatarUrl = normalizeAvatarUrl(profile?.avatarUrl) ?? sessionAvatarUrl;
  const hasCustomAvatar = Boolean(displayAvatarUrl);

  const profileStats = useMemo(
    () => [
      {
        key: 'favorites',
        value: isLoggedIn ? favoriteItems.length : DEMO_PROFILE_STATS.favorites,
        label: t('screens.profile.favorites'),
        screen: 'favorites' as const,
      },
      {
        key: 'history',
        value: isLoggedIn ? historyItems.length : DEMO_PROFILE_STATS.history,
        label: t('screens.profile.views'),
        screen: 'history' as const,
      },
      {
        key: 'following',
        value: isLoggedIn ? followCount : DEMO_PROFILE_STATS.following,
        label: t('screens.profile.following'),
        screen: 'following' as const,
      },
      {
        key: 'coupons',
        value: isLoggedIn ? availableCouponCount : DEMO_PROFILE_STATS.coupons,
        label: t('screens.profile.coupons'),
        screen: 'coupons' as const,
      },
    ],
    [availableCouponCount, followCount, favoriteItems.length, historyItems.length, isLoggedIn, t],
  );

  const profileSubline = isLoggedIn && user
    ? t('screens.profile.idLineLoggedIn', { id: user.heishiId })
    : t('screens.profile.idLine');

  const handlePickAvatar = async () => {
    if (!isLoggedIn) {
      nav('login');
      return;
    }
    try {
      const url = await pickAndUpload();
      if (!url) return;
      const next = await save({ avatarUrl: url });
      updateUser({ avatarUrl: next.avatarUrl ?? url });
      toast(t('toast.profileSaved'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof ApiError && error.status === 401) {
        toast(t('toast.loginRequired'));
      } else {
        toast(t('toast.avatarUploadFailed'));
      }
    }
  };

  return (
    <ScreenScroll screenId="profile">
      <MarketScreenHeader
        showRegion={false}
        unreadCount={inboxUnreadCount}
        onMessagesPress={() => requireAuthNav('messages')}
        onSettingsPress={() => requireAuthNav('settings')}
      />
      <AmazingSurface style={styles.profileCard} preserveShadow highlight={false}>
        <View style={styles.profileTop}>
          <Pressable
            style={[
              styles.profileAvatar,
              !hasCustomAvatar && styles.profileAvatarPlaceholder,
            ]}
            onPress={() => void handlePickAvatar()}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={t('screens.editProfile.changeAvatar')}
          >
            {isLoggedIn && user && hasCustomAvatar ? (
              <Image
                key={displayAvatarUrl}
                source={{ uri: displayAvatarUrl! }}
                style={styles.profileAvatarImage}
                resizeMode="cover"
              />
            ) : isLoggedIn && user ? (
              <AppIcon name="person" size={22} color={colors.text} />
            ) : (
              <AppIcon name="person" size={22} color={colors.text} />
            )}
            {isLoggedIn && uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : null}
          </Pressable>
          <View style={styles.profileInfo}>
            {isLoggedIn && user ? (
              <>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {user.nickname}
                  </Text>
                  <Badge text={t('screens.profile.badge')} compact />
                </View>
                <Text style={styles.profileSub} numberOfLines={1}>
                  {profileSubline}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.profileName}>{t('screens.profile.guestTitle')}</Text>
                <Text style={styles.profileSub} numberOfLines={1}>
                  {t('screens.profile.guestSub')}
                </Text>
              </>
            )}
          </View>
          {isLoggedIn ? (
            <PillButton
              label={t('common.edit')}
              variant="light"
              onPress={() => nav('editProfile')}
              style={styles.profileEditBtn}
            />
          ) : null}
        </View>
        <View style={styles.stats}>
          {profileStats.map((stat, index) => (
            <Pressable
              key={stat.key}
              style={[styles.stat, index < profileStats.length - 1 && styles.statBorder]}
              onPress={() => requireAuthNav(stat.screen)}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Pressable>
          ))}
        </View>
        {!isLoggedIn ? (
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
        ) : null}
      </AmazingSurface>
      <SectionHead
        title={t('screens.profile.myTrade')}
        action={t('screens.profile.allOrders')}
        onAction={() => nav('orders')}
        plain
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
      <View style={styles.profileBannerSlot}>
        <Banner
          variant="promo"
          artwork
          flushVertical
          title={t('screens.profile.bannerTitle')}
          subtitle={t('screens.profile.bannerSubtitle')}
          artworkSource={profilePageBannerForLanguage(i18n.language)}
          actionLabel={t('screens.profile.bannerAction')}
          onAction={() => nav('accountSafety')}
        />
      </View>
      <SectionHead title={t('screens.profile.tools')} plain connectTop />
      <ShortcutGrid
        compact
        items={[
          { icon: 'id', label: t('screens.profile.authCenter'), onPress: () => nav('authCenter') },
          { icon: 'badge', label: t('screens.profile.creditProfile'), onPress: () => nav('creditProfile') },
          { icon: 'review', label: t('screens.profile.reviewManage'), onPress: () => nav('reviewManage') },
          { icon: 'shield', label: t('screens.profile.safetyCenter'), onPress: () => nav('safetyCenter') },
        ]}
      />
      <SectionHead
        title={recommendTitle}
        action={t('home.moreRecommend')}
        onAction={openSearch}
        plain
        compact
      />
      <ProductFeed
        data={recommendedProducts}
        onPress={openDetail}
        emptyText={t('home.emptyFeed')}
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
    backgroundColor: colors.surfaceMuted,
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
  profileCard: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  profileEditBtn: {
    alignSelf: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: profileScreenTokens.editBtnHeight,
    height: profileScreenTokens.editBtnHeight,
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  authActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 10,
  },
  authBtn: {
    flex: 1,
  },
  profileAvatar: {
    width: profileScreenTokens.avatarSize,
    height: profileScreenTokens.avatarSize,
    borderRadius: profileScreenTokens.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  profileAvatarPlaceholder: {
    backgroundColor: colors.stage,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  profileName: {
    flexShrink: 1,
    fontWeight: fonts.weights.bold,
    fontSize: profileScreenTokens.nameSize,
    lineHeight: 18,
    color: colors.text,
  },
  profileSub: {
    marginTop: 2,
    color: colors.muted,
    fontSize: profileScreenTokens.idLineSize,
    lineHeight: 14,
  },
  stats: {
    flexDirection: 'row',
    marginTop: profileScreenTokens.statsMarginTop,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: profileScreenTokens.statsRadius,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.line,
  },
  statValue: {
    fontWeight: fonts.weights.bold,
    fontSize: profileScreenTokens.statValueSize,
    lineHeight: 16,
    color: colors.text,
  },
  statLabel: {
    marginTop: 1,
    fontWeight: fonts.weights.medium,
    fontSize: profileScreenTokens.statLabelSize,
    lineHeight: 11,
    color: colors.text,
    textAlign: 'center',
  },
  profileBannerSlot: {
    marginTop: profileScreenTokens.bannerGap,
    marginBottom: profileScreenTokens.bannerGap,
  },
});
