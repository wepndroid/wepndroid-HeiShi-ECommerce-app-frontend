import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { usePublicUserProfile } from '../hooks/usePublicUserProfile';
import { sellerKeyFromUserId } from '../data/catalogDemo';
import { DetailCard } from '../components/FormUI';
import { ProductGrid } from '../components/ProductUI';
import { AppIcon } from '../components/AppIcon';
import { Notice, PillButton, ScreenScroll, SectionHead, TitleBar, followPillStyle } from '../components/UI';
import { SellerAvatar } from '../components/SellerAvatar';
import { colors, fonts, radius } from '../theme';

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <AppIcon
          key={star}
          name="star"
          size={14}
          color={star <= filled ? colors.brand2 : colors.line}
        />
      ))}
      <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
    </View>
  );
}

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
  const { openDetail, toggleFollow, isFollowingSeller, user } = useApp();
  const { profile, listings, loading, error } = usePublicUserProfile(userId);

  const sellerKey = sellerKeyFromUserId(userId) ?? userId.replace(/^seller-/, '');
  const isSelf = user?.id === userId;
  const isFollowing = isFollowingSeller(sellerKey);

  if (loading && !profile) {
    return (
      <ScreenScroll screenId="sellerProfile">
        <TitleBar center={t('screens.sellerProfile.title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand2} />
        </View>
      </ScreenScroll>
    );
  }

  if (error || !profile) {
    return (
      <ScreenScroll screenId="sellerProfile">
        <TitleBar center={t('screens.sellerProfile.title')} />
        <Notice text={t('screens.sellerProfile.notFound')} />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll screenId="sellerProfile">
      <TitleBar center={profile.nickname} />
      <DetailCard>
        <View style={styles.header}>
          <SellerAvatar
            sellerKey={sellerKey}
            seller={profile.nickname}
            avatarUrl={profile.avatarUrl}
            size={72}
          />
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{profile.nickname}</Text>
            {profile.city ? <Text style={styles.city}>{profile.city}</Text> : null}
            <StarRating rating={profile.rating} />
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
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  ratingValue: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.brand2,
  },
  reviewLine: {
    marginTop: 2,
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
    backgroundColor: colors.brand3,
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
