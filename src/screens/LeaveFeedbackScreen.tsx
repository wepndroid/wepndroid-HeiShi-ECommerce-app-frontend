import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/typography';
import { useApp } from '../context/AppContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ordersApi } from '../api/endpoints/orders';
import { fetchOrderReview, submitOrderReview } from '../services/ordersService';
import {
  EMPTY_REVIEW_CRITERIA,
  REVIEW_CRITERION_KEYS,
  ReviewCriteriaDraft,
  ReviewCriterionKey,
  criteriaOverallRating,
  isReviewCriteriaComplete,
} from '../data/reviewCriteria';
import { DetailCard, FieldInputRow } from '../components/FormUI';
import { OrderThumb } from '../components/ProductUI';
import { StarRating, StarRatingInput } from '../components/StarRating';
import {
  BackButton,
  LoadingState,
  Notice,
  PillButton,
  ScreenScroll,
  TitleBar,
} from '../components/UI';
import { colors, fonts, radius, spacing } from '../theme';
import type { OrderDto } from '../api/types';
import type { UiOrder } from '../types';

function orderDtoToUi(order: OrderDto): UiOrder {
  return {
    id: order.id,
    listingId: order.listingId,
    title: order.listingTitle,
    imageUrl: order.listingImageUrl,
    sellerName: order.seller.nickname,
    amount: order.amount,
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    paymentMethodId: order.paymentMethodId,
    escrowFee: order.escrowFee,
    bundleItemId: order.bundleItemId,
    couponId: order.couponId,
    discountAmount: order.discountAmount,
  };
}

export function LeaveFeedbackScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady, toast, openDetail, products, user } = useApp();
  const params = useLocalSearchParams<{ orderId?: string; mode?: string }>();
  const orderId = Number(params.orderId);
  const isViewMode = params.mode === 'view';

  const [order, setOrder] = useState<UiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<ReviewCriteriaDraft>({ ...EMPTY_REVIEW_CRITERIA });
  const [comment, setComment] = useState('');
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [reviewRole, setReviewRole] = useState<'buyer' | 'seller'>('buyer');
  const [counterpartName, setCounterpartName] = useState('');

  const load = useCallback(async () => {
    if (!authReady || !Number.isFinite(orderId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dto = await ordersApi.get(orderId);
      const uiOrder = orderDtoToUi(dto);
      setOrder(uiOrder);
      const asSeller = user?.id === dto.seller.id;
      setReviewRole(asSeller ? 'seller' : 'buyer');
      setCounterpartName(asSeller ? dto.buyer?.nickname ?? '' : dto.seller.nickname);
      if (isViewMode || dto.status === 'completed') {
        const review = await fetchOrderReview(orderId, isLoggedIn);
        setSavedRating(review.rating);
        setComment(review.comment ?? '');
        if (review.criteria) {
          setCriteria({
            quality: review.criteria.quality,
            communication: review.criteria.communication,
            trustement: review.criteria.trustement,
          });
        } else {
          setCriteria({
            quality: review.rating,
            communication: review.rating,
            trustement: review.rating,
          });
        }
      }
    } catch {
      setError(t('screens.leaveFeedback.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [authReady, isLoggedIn, isViewMode, orderId, t, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const canSubmit = useMemo(
    () => isReviewCriteriaComplete(criteria) && comment.trim().length > 0 && !submitting,
    [criteria, comment, submitting],
  );

  const handleCriterionChange = (key: ReviewCriterionKey, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  const openListing = useCallback(() => {
    if (!order?.listingId) return;
    const fromCatalog = products.find((p) => p.id === order.listingId);
    openDetail(
      fromCatalog ?? {
        id: order.listingId,
        price: order.amount,
        catKey: 'misc',
        tagKey: 'lightlyUsed',
        sellerKey: '',
        seller: order.sellerName,
        loc: '',
        height: '',
        imageUrl: order.imageUrl,
        apiTitle: order.title,
        listingStatus: 'sold',
      },
      { orderContext: true },
    );
  }, [order, openDetail, products]);

  const handleSubmit = async () => {
    if (!order || !canSubmit) {
      if (!comment.trim()) {
        toast(t('screens.leaveFeedback.commentRequired'));
      } else if (!isReviewCriteriaComplete(criteria)) {
        toast(t('screens.leaveFeedback.criteriaRequired'));
      }
      return;
    }
    setSubmitting(true);
    try {
      await submitOrderReview(order, {
        criteria: {
          quality: criteria.quality,
          communication: criteria.communication,
          trustement: criteria.trustement,
        },
        comment: comment.trim(),
      }, isLoggedIn);
      toast(t('toast.reviewSubmitted'));
      router.replace('/profile/reviews' as Href);
    } catch {
      toast(t('toast.orderActionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const title = isViewMode
    ? t('screens.leaveFeedback.viewTitle')
    : t('screens.leaveFeedback.title');

  if (!Number.isFinite(orderId)) {
    return (
      <ScreenScroll screenId="leaveFeedback">
        <TitleBar center={title} left={<BackButton />} />
        <Notice text={t('screens.leaveFeedback.invalidOrder')} />
      </ScreenScroll>
    );
  }

  if (loading) {
    return (
      <ScreenScroll screenId="leaveFeedback">
        <TitleBar center={title} left={<BackButton />} />
        <LoadingState />
      </ScreenScroll>
    );
  }

  if (error || !order) {
    return (
      <ScreenScroll screenId="leaveFeedback">
        <TitleBar center={title} left={<BackButton />} />
        <Notice text={error ?? t('screens.leaveFeedback.loadFailed')} />
        <PillButton label={t('common.retry')} variant="light" full onPress={() => void load()} />
      </ScreenScroll>
    );
  }

  const previewRating = isViewMode
    ? savedRating ?? criteriaOverallRating({
        quality: criteria.quality,
        communication: criteria.communication,
        trustement: criteria.trustement,
      })
    : criteriaOverallRating({
        quality: criteria.quality || 0,
        communication: criteria.communication || 0,
        trustement: criteria.trustement || 0,
      });

  return (
    <ScreenScroll screenId="leaveFeedback">
      <TitleBar center={title} left={<BackButton />} />

      <DetailCard>
        <Pressable
          onPress={openListing}
          accessibilityRole="button"
          accessibilityLabel={order.title}
        >
          <View style={styles.orderRow}>
            <OrderThumb imageUrl={order.imageUrl} size={56} />
            <View style={styles.orderCopy}>
              <Text style={styles.sellerName}>
                {reviewRole === 'seller'
                  ? t('screens.leaveFeedback.rateBuyer')
                  : t('screens.leaveFeedback.rateSeller')}
                {counterpartName ? `: ${counterpartName}` : ''}
              </Text>
              <Text style={styles.orderTitle} numberOfLines={2}>{order.title}</Text>
            </View>
          </View>
        </Pressable>
      </DetailCard>

      <Text style={styles.sectionTitle}>{t('screens.leaveFeedback.rateSection')}</Text>
      <DetailCard>
        {REVIEW_CRITERION_KEYS.map((key, index) => (
          <View
            key={key}
            style={[styles.criterionRow, index < REVIEW_CRITERION_KEYS.length - 1 && styles.criterionBorder]}
          >
            <Text style={styles.criterionLabel} numberOfLines={1}>
              {t(`screens.leaveFeedback.criteria.${key}`)}
            </Text>
            <StarRatingInput
              value={criteria[key]}
              onChange={(value) => handleCriterionChange(key, value)}
              readOnly={isViewMode}
            />
          </View>
        ))}
      </DetailCard>

      <Text style={styles.sectionTitle}>{t('screens.leaveFeedback.commentSection')}</Text>
      {isViewMode ? (
        <DetailCard>
          <Text style={styles.commentBody}>{comment.trim() || t('screens.leaveFeedback.noComment')}</Text>
          {previewRating > 0 ? (
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>{t('screens.leaveFeedback.overall')}</Text>
              <StarRating rating={previewRating} />
            </View>
          ) : null}
        </DetailCard>
      ) : (
        <DetailCard>
          <FieldInputRow
            label={t('screens.leaveFeedback.commentLabel')}
            value={comment}
            onChangeText={setComment}
            placeholder={
              reviewRole === 'seller'
                ? t('screens.leaveFeedback.commentPlaceholderBuyer')
                : t('screens.leaveFeedback.commentPlaceholder')
            }
            multiline
          />
        </DetailCard>
      )}

      {!isViewMode ? (
        <PillButton
          label={submitting ? t('common.loading') : t('screens.leaveFeedback.rateUser')}
          variant="brand"
          full
          onPress={() => void handleSubmit()}
          disabled={!canSubmit}
          style={styles.submitBtn}
        />
      ) : null}
      {submitting ? <ActivityIndicator color={colors.text} style={styles.spinner} /> : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: spacing.screenPadding,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderCopy: {
    flex: 1,
    minWidth: 0,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  orderTitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.sub,
    lineHeight: 18,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
  },
  criterionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  criterionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  overallRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLabel: {
    fontSize: 13,
    color: colors.sub,
  },
  submitBtn: {
    marginTop: 16,
    marginHorizontal: spacing.screenPadding,
  },
  spinner: {
    marginTop: 12,
  },
});
