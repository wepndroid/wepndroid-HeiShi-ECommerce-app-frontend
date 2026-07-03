import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useCoupons } from '../../hooks/useCoupons';
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';
import { useHistoryProducts } from '../../hooks/useHistory';
import { ListCard, TableNote } from '../../components/FormUI';
import { AmazingSurface } from '../../components/AmazingSurface';
import { ProductGrid } from '../../components/ProductUI';
import { PillButton, followPillStyle, ScreenScroll, TitleBar, EmptyState, LoadingState } from '../../components/UI';
import { SellerAvatar } from '../../components/SellerAvatar';
import { useFollowList } from '../../hooks/useFollowList';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useRegionStore } from '../../store/regionStore';
import { styles } from './shared';

export function FavoritesScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const openDetail = useCatalogStore((s) => s.openDetail);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const favs = useFavoritesStore((s) => s.favs);
  const { items: data, loading } = useFavoriteProducts(isLoggedIn, favs);

  return (
    <ScreenScroll screenId="favorites">
      <TitleBar center={t('screens.favorites.title', { count: data.length })} />
      {loading ? (
        <LoadingState />
      ) : (
        <ProductGrid data={data} onPress={openDetail} emptyText={t('screens.favorites.empty')} />
      )}
    </ScreenScroll>
  );
}

export function HistoryScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const openDetail = useCatalogStore((s) => s.openDetail);
  const region = useRegionStore((s) => s.region);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const { items: data, loading } = useHistoryProducts(region, isLoggedIn);

  return (
    <ScreenScroll screenId="history">
      <TitleBar center={t('screens.history.title')} />
      {loading ? (
        <LoadingState />
      ) : (
        <ProductGrid data={data} onPress={openDetail} emptyText={t('screens.history.empty')} />
      )}
    </ScreenScroll>
  );
}

export function FollowingScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const follows = useFavoritesStore((s) => s.follows);
  const toggleFollow = useFavoritesStore((s) => s.toggleFollow);
  const openSellerProfile = useCatalogStore((s) => s.openSellerProfile);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const { items: followItems } = useFollowList(isLoggedIn);

  const rows = useMemo(
    () =>
      followItems
        .filter((item) => follows.has(item.userId))
        .map((item) => ({
          userId: item.userId,
          name: item.nickname,
          sellerKey: item.userId,
          sellerAvatarUrl: item.avatarUrl,
          sub: item.subtitle ?? '',
        })),
    [followItems, follows],
  );

  return (
    <ScreenScroll screenId="following">
      <TitleBar center={t('screens.following.title')} />
      {rows.length ? (
        <ListCard>
          {rows.map((row, index) => {
            const isFollowing = follows.has(row.userId);
            return (
              <View
                key={row.userId}
                style={[styles.followRow, index < rows.length - 1 && styles.followBorder]}
              >
                <Pressable
                  style={styles.followProfile}
                  onPress={() => openSellerProfile(row.sellerKey)}
                >
                  <SellerAvatar
                    sellerKey={row.sellerKey}
                    seller={row.name}
                    avatarUrl={row.sellerAvatarUrl}
                    sellerUserId={row.userId}
                    size={48}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.followName}>{row.name}</Text>
                    <Text style={styles.followSub}>{row.sub}</Text>
                  </View>
                </Pressable>
                <PillButton
                  label={isFollowing ? t('common.following') : t('common.follow')}
                  variant={isFollowing ? 'brand' : 'light'}
                  style={followPillStyle}
                  onPress={() => void toggleFollow(row.userId)}
                />
              </View>
            );
          })}
        </ListCard>
      ) : (
        <EmptyState text={t('screens.following.empty')} />
      )}
    </ScreenScroll>
  );
}

export function CouponsScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { coupons, loading } = useCoupons(isLoggedIn, authReady);

  const formatCouponExpiry = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language.startsWith('zh') ? 'zh-CN' : 'en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const goBrowseListings = () => {
    router.push('/');
  };

  return (
    <ScreenScroll screenId="coupons">
      <TitleBar center={t('screens.coupons.title')} />
      {!loading ? (
        <View style={styles.couponOnboarding}>
          <Text style={styles.couponOnboardingTitle}>{t('screens.coupons.howToTitle')}</Text>
          <Text style={styles.couponOnboardingBody}>{t('screens.coupons.howToBody')}</Text>
          <Text style={styles.couponOnboardingStep}>{t('screens.coupons.howToStep1')}</Text>
          <Text style={styles.couponOnboardingStep}>{t('screens.coupons.howToStep2')}</Text>
          <Text style={styles.couponOnboardingStep}>{t('screens.coupons.howToStep3')}</Text>
        </View>
      ) : null}
      {loading ? (
        <LoadingState compact />
      ) : coupons.length ? (
        <>
          <Text style={styles.couponWalletHead}>{t('screens.coupons.walletSection')}</Text>
          {coupons.map((coupon) => {
            const used = coupon.status === 'used';
            const expired = coupon.status === 'expired';
            const inactive = used || expired;
            const expiryLabel =
              coupon.expiresAt && !expired
                ? t('screens.coupons.expiresBy', { date: formatCouponExpiry(coupon.expiresAt) })
                : expired
                  ? t('screens.coupons.statusExpired')
                  : null;
            return (
              <AmazingSurface key={coupon.id} style={styles.coupon}>
                <View style={styles.couponMain}>
                  <Text style={styles.couponAmt}>
                    {t('common.currencyPrefix')}
                    {coupon.amount}
                  </Text>
                  <Text style={styles.couponSub}>{coupon.description}</Text>
                  {expiryLabel ? <Text style={styles.couponExpiry}>{expiryLabel}</Text> : null}
                  {!inactive ? (
                    <Text style={styles.couponCardHint}>{t('screens.coupons.cardHint')}</Text>
                  ) : null}
                </View>
                <Pressable
                  style={[styles.couponBtn, inactive && styles.couponBtnUsed]}
                  onPress={goBrowseListings}
                  disabled={inactive}
                >
                  <Text style={[styles.couponBtnText, inactive && styles.couponBtnTextUsed]}>
                    {used ? t('screens.coupons.used') : expired ? t('screens.coupons.statusExpired') : t('screens.coupons.browseItems')}
                  </Text>
                </Pressable>
              </AmazingSurface>
            );
          })}
        </>
      ) : (
        <View>
          <EmptyState text={t('screens.coupons.empty')} />
          <TableNote>{t('screens.coupons.emptyHint')}</TableNote>
        </View>
      )}
    </ScreenScroll>
  );
}
