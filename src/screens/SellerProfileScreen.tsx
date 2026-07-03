import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useCatalogStore } from '../store/catalogStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePublicUserProfile } from '../hooks/usePublicUserProfile';
import { sellerKeyFromUserId } from '../data/catalogDemo';
import { DetailCard } from '../components/FormUI';
import { ProductGrid } from '../components/ProductUI';
import { StarRating } from '../components/StarRating';
import { Notice, LoadingState, PillButton, ScreenScroll, SectionHead, TitleBar, BackButton, followPillStyle } from '../components/UI';
import { SellerAvatar } from '../components/SellerAvatar';
import { colors, fonts, radius } from '../theme';

function VerificationBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <View style={styles.verifyBadge}>
      <Text style={styles.verifyBadgeText}>{label}</Text>
    </View>
  );
}

export function SellerProfileScreen({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const openDetail = useCatalogStore((s) => s.openDetail);
  const toggleFollow = useFavoritesStore((s) => s.toggleFollow);
  const isFollowingSeller = useFavoritesStore((s) => s.isFollowingSeller);
  const user = useAuthStore((s) => s.user);
  const { profile, listings, loading, error } = usePublicUserProfile(userId);

  const sellerKey = sellerKeyFromUserId(userId) ?? userId.replace(/^seller-/, '');
  const isSelf = user?.id === userId;
  const isFollowing = isFollowingSeller(sellerKey);

  if (loading && !profile) {
    return (
      <ScreenScroll screenId="sellerProfile">
        <TitleBar center={t('screens.sellerProfile.title')} left={<BackButton />} />
        <LoadingState />
      </ScreenScroll>
    );
  }

  if (error || !profile) {
    return (
      <ScreenScroll screenId="sellerProfile">
        <TitleBar center={t('screens.sellerProfile.title')} left={<BackButton />} />
        <Notice text={t('screens.sellerProfile.notFound')} />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll screenId="sellerProfile">
      <TitleBar />
      <DetailCard>
        <View style={styles.header}>
          <SellerAvatar
            sellerKey={sellerKey}
            seller={profile.nickname}
            avatarUrl={profile.avatarUrl}
            sellerUserId={profile.id}
            size={72}
          />
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{profile.nickname}</Text>
            {profile.city ? <Text style={styles.city}>{profile.city}</Text> : null}
            {profile.reviewCount > 0 ? (
              <StarRating rating={profile.rating} style={styles.stars} />
            ) : (
              <Text style={styles.noReviews}>{t('screens.sellerProfile.noReviews')}</Text>
            )}
            <Text style={styles.reviewLine}>
              {t('screens.sellerProfile.reviewCount', { count: profile.reviewCount })}
            </Text>
          </View>
        </View>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {!isSelf ? (
          <PillButton
            label={isFollowing ? t('common.following') : t('common.follow')}
            variant={isFollowing ? 'brand' : 'light'}
            onPress={() => void toggleFollow(sellerKey)}
            style={[followPillStyle, styles.followBtn]}
          />
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.listingCount}</Text>
            <Text style={styles.statLabel}>{t('screens.sellerProfile.listings')}</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{profile.followerCount}</Text>
            <Text style={styles.statLabel}>{t('screens.sellerProfile.followers')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.reviewCount}</Text>
            <Text style={styles.statLabel}>{t('screens.sellerProfile.reviews')}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <VerificationBadge label={t('screens.sellerProfile.phoneVerified')} active={profile.phoneVerified} />
          <VerificationBadge
            label={t('screens.sellerProfile.identityVerified')}
            active={profile.identityVerified}
          />
          <VerificationBadge
            label={t('screens.sellerProfile.businessVerified')}
            active={profile.businessVerified}
          />
          <VerificationBadge label={t('screens.sellerProfile.wechatLinked')} active={profile.wechatLinked} />
          <VerificationBadge label={t('screens.sellerProfile.alipayLinked')} active={profile.alipayLinked} />
        </View>
      </DetailCard>
      <SectionHead title={t('screens.sellerProfile.posts')} subtitle={t('screens.sellerProfile.postsHint')} />
      {listings.length ? (
        <ProductGrid data={listings} onPress={openDetail} />
      ) : (
        <DetailCard>
          <Text style={styles.emptyPosts}>{t('screens.sellerProfile.noPosts')}</Text>
        </DetailCard>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  city: {
    marginTop: 2,
    fontSize: 13,
    color: colors.sub,
  },
  stars: {
    marginTop: 6,
  },
  reviewLine: {
    marginTop: 2,
    fontSize: 12,
    color: colors.sub,
  },
  noReviews: {
    marginTop: 4,
    fontSize: 12,
    color: colors.sub,
  },
  bio: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  followBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  statValue: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.sub,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  verifyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  verifyBadgeText: {
    fontSize: 11,
    color: colors.brand2,
    fontWeight: fonts.weights.medium,
  },
  emptyPosts: {
    fontSize: 13,
    color: colors.sub,
    textAlign: 'center',
  },
});
