import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/typography';
import { useApp } from '../context/AppContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import {
  usePendingReviewOrders,
  useReceivedReviews,
  useReviewSummary,
} from '../hooks/useTrustProfile';
import { DetailCard } from '../components/FormUI';
import { OrderThumb } from '../components/ProductUI';
import { AppIcon } from '../components/AppIcon';
import { StarRating, roundRatingDisplay } from '../components/StarRating';
import {
  BackButton,
  EmptyState,
  LoadingState,
  PillButton,
  ScreenScroll,
  SectionHead,
  TitleBar,
} from '../components/UI';
import type { PendingReviewOrderDto, ReceivedReviewDto } from '../api/types';
import type { Product } from '../types';
import { colors, fonts, radius, spacing } from '../theme';

type ReceivedRole = 'seller' | 'buyer';

function formatReviewDate(iso: string, language: string): string {
  try {
    return new Date(iso).toLocaleDateString(language.startsWith('zh') ? 'zh-CN' : 'en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function orderListingProduct(
  listingId: number,
  title: string,
  imageUrl: string,
  products: Product[],
  sellerName = '',
  amount = 0,
): Product {
  const fromCatalog = products.find((p) => p.id === listingId);
  return (
    fromCatalog ?? {
      id: listingId,
      price: amount,
      catKey: 'misc',
      tagKey: 'lightlyUsed',
      sellerKey: '',
      seller: sellerName,
      loc: '',
      height: '',
      imageUrl,
      apiTitle: title,
      listingStatus: 'sold',
    }
  );
}

function RatingSummaryCard({
  score,
  receivedCount,
  ratingLabel,
}: {
  score: number;
  receivedCount: number;
  ratingLabel: string;
}) {
  const displayScore = receivedCount > 0 ? score : 0;
  return (
    <DetailCard>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryLabel}>{ratingLabel}</Text>
        <Text style={styles.summaryValue}>{roundRatingDisplay(displayScore).toFixed(2)}</Text>
      </View>
      <View style={styles.summaryStarsRow}>
        <StarRating rating={displayScore} showValue={false} />
        <View style={styles.reviewCountBadge}>
          <AppIcon name="messages" size={14} color={colors.muted} />
          <Text style={styles.reviewCountValue}>{receivedCount}</Text>
        </View>
      </View>
    </DetailCard>
  );
}

function RoleToggle({
  role,
  onChange,
  sellerLabel,
  buyerLabel,
}: {
  role: ReceivedRole;
  onChange: (role: ReceivedRole) => void;
  sellerLabel: string;
  buyerLabel: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.roleToggleRow}
    >
      {(['seller', 'buyer'] as const).map((key) => {
        const active = role === key;
        return (
          <Pressable
            key={key}
            style={[styles.roleChip, active && styles.roleChipActive]}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.roleChipText, active && styles.roleChipTextActive]} numberOfLines={1}>
              {key === 'seller' ? sellerLabel : buyerLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function PendingReviewRow({
  order,
  leaveLabel,
  counterpartLine,
  onOpenListing,
}: {
  order: PendingReviewOrderDto;
  leaveLabel: string;
  counterpartLine: string;
  onOpenListing: () => void;
}) {
  return (
    <View style={styles.pendingRow}>
      <Pressable
        style={styles.productTap}
        onPress={onOpenListing}
        accessibilityRole="button"
        accessibilityLabel={order.listingTitle}
      >
        <OrderThumb imageUrl={order.listingImageUrl} size={48} />
        <View style={styles.pendingCopy}>
          <Text style={styles.rowTitle} numberOfLines={2}>{order.listingTitle}</Text>
          <Text style={styles.rowSub}>{counterpartLine}</Text>
        </View>
      </Pressable>
      <PillButton
        label={leaveLabel}
        variant="brand"
        onPress={() => router.push(`/profile/review/${order.orderId}` as Href)}
        style={styles.leaveBtn}
      />
    </View>
  );
}

function ReceivedReviewCard({
  review,
  reviewerLine,
  language,
  onOpenListing,
}: {
  review: ReceivedReviewDto;
  reviewerLine: string;
  language: string;
  onOpenListing: () => void;
}) {
  return (
    <DetailCard>
      <Pressable
        onPress={onOpenListing}
        accessibilityRole="button"
        accessibilityLabel={review.listingTitle}
      >
        <View style={styles.receivedTop}>
          <OrderThumb imageUrl={review.listingImageUrl} size={48} />
          <View style={styles.receivedCopy}>
            <Text style={styles.rowTitle} numberOfLines={2}>{review.listingTitle}</Text>
            <Text style={styles.rowSub}>{reviewerLine}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.receivedStarsRow}>
        <StarRating rating={review.rating} showValue={false} />
        <Text style={styles.receivedScore}>{roundRatingDisplay(review.rating).toFixed(2)}</Text>
        <Text style={styles.receivedDate}>{formatReviewDate(review.createdAt, language)}</Text>
      </View>
      {review.comment?.trim() ? (
        <Text style={styles.reviewComment}>{review.comment.trim()}</Text>
      ) : null}
    </DetailCard>
  );
}

export function ReviewManageScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady, openDetail, products } = useApp();
  const [receivedRole, setReceivedRole] = useState<ReceivedRole>('seller');
  const { summary, loading: summaryLoading } = useReviewSummary(isLoggedIn, authReady);
  const { orders: pendingOrders, loading: pendingLoading } = usePendingReviewOrders(
    isLoggedIn,
    authReady,
  );
  const { items: receivedReviews, loading: receivedLoading, error: receivedError, refresh } =
    useReceivedReviews(isLoggedIn, authReady, receivedRole);

  const openPendingListing = useCallback(
    (order: PendingReviewOrderDto) => {
      openDetail(
        orderListingProduct(
          order.listingId,
          order.listingTitle,
          order.listingImageUrl,
          products,
          order.counterpartNickname,
          order.amount,
        ),
        { orderContext: true },
      );
    },
    [openDetail, products],
  );

  const openReceivedListing = useCallback(
    (review: ReceivedReviewDto) => {
      if (!review.listingId) return;
      openDetail(
        orderListingProduct(
          review.listingId,
          review.listingTitle,
          review.listingImageUrl,
          products,
        ),
        { orderContext: true },
      );
    },
    [openDetail, products],
  );

  const sellerReceivedCount = summary?.receivedCount ?? 0;
  const buyerReceivedCount = summary?.buyerReceivedCount ?? 0;
  const sellerScore = sellerReceivedCount > 0 ? summary?.score ?? 0 : 0;
  const buyerScore = buyerReceivedCount > 0 ? summary?.buyerScore ?? 0 : 0;
  const activeScore = receivedRole === 'seller' ? sellerScore : buyerScore;
  const activeReceivedCount = receivedRole === 'seller' ? sellerReceivedCount : buyerReceivedCount;
  const pendingCount = summary?.pendingCount ?? pendingOrders.length;

  return (
    <ScreenScroll screenId="reviewManage">
      <TitleBar center={t('screens.reviewManage.title')} left={<BackButton />} />

      <RoleToggle
        role={receivedRole}
        onChange={setReceivedRole}
        sellerLabel={t('screens.reviewManage.tabSeller')}
        buyerLabel={t('screens.reviewManage.tabBuyer')}
      />

      {summaryLoading && !summary ? (
        <LoadingState compact />
      ) : (
        <RatingSummaryCard
          score={activeScore}
          receivedCount={activeReceivedCount}
          ratingLabel={
            receivedRole === 'seller'
              ? t('screens.reviewManage.ratingAsSeller')
              : t('screens.reviewManage.ratingAsBuyer')
          }
        />
      )}

      <SectionHead
        title={t('screens.reviewManage.toReviewSection')}
        action={pendingCount > 0 ? String(pendingCount) : undefined}
        plain
      />
      {pendingLoading ? (
        <LoadingState compact />
      ) : pendingOrders.length ? (
        <DetailCard>
          {pendingOrders.map((order, index) => (
            <View
              key={`${order.orderId}-${order.reviewRole}`}
              style={[styles.pendingRowWrap, index < pendingOrders.length - 1 && styles.rowBorder]}
            >
              <PendingReviewRow
                order={order}
                leaveLabel={t('screens.reviewManage.leaveFeedback')}
                counterpartLine={
                  order.reviewRole === 'buyer'
                    ? t('screens.reviewManage.counterpartySeller', { name: order.counterpartNickname })
                    : t('screens.reviewManage.counterpartyBuyer', { name: order.counterpartNickname })
                }
                onOpenListing={() => openPendingListing(order)}
              />
            </View>
          ))}
        </DetailCard>
      ) : (
        <EmptyState text={t('screens.reviewManage.emptyToReview')} />
      )}

      <SectionHead
        title={
          receivedRole === 'seller'
            ? t('screens.reviewManage.receivedAsSeller')
            : t('screens.reviewManage.receivedAsBuyer')
        }
        action={activeReceivedCount > 0 ? String(activeReceivedCount) : undefined}
        plain
      />
      {receivedLoading ? (
        <LoadingState compact />
      ) : receivedError ? (
        <>
          <EmptyState text={t('screens.reviewManage.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : receivedReviews.length ? (
        <View style={styles.receivedList}>
          {receivedReviews.map((review) => (
            <ReceivedReviewCard
              key={review.id}
              review={review}
              reviewerLine={
                review.reviewerRole === 'buyer'
                  ? t('screens.reviewManage.reviewerBuyer', { name: review.reviewerNickname })
                  : t('screens.reviewManage.reviewerSeller', { name: review.reviewerNickname })
              }
              language={i18n.language}
              onOpenListing={() => openReceivedListing(review)}
            />
          ))}
        </View>
      ) : (
        <DetailCard>
          <View style={styles.emptyReceived}>
            <StarRating rating={0} showValue={false} />
            <Text style={styles.emptyReceivedText}>
              {receivedRole === 'seller'
                ? t('screens.reviewManage.emptyReceivedSeller')
                : t('screens.reviewManage.emptyReceivedBuyer')}
            </Text>
          </View>
        </DetailCard>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  roleToggleRow: {
    gap: 8,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 10,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  roleChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.sub,
  },
  roleChipTextActive: {
    color: colors.bg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.sub,
    fontWeight: fonts.weights.medium,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.red,
  },
  summaryStarsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  reviewCountValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  pendingRowWrap: {
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  pendingCopy: {
    flex: 1,
    minWidth: 0,
  },
  leaveBtn: {
    flexShrink: 0,
    paddingHorizontal: 10,
    minHeight: 32,
    height: 32,
  },
  rowTitle: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  rowSub: {
    color: colors.sub,
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  receivedList: {
    gap: 10,
    marginBottom: spacing.screenBottomNoNav,
  },
  receivedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receivedCopy: {
    flex: 1,
    minWidth: 0,
  },
  receivedStarsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receivedScore: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.red,
  },
  receivedDate: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: colors.muted,
  },
  reviewComment: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  emptyReceived: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emptyReceivedText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.sub,
    textAlign: 'center',
  },
});
