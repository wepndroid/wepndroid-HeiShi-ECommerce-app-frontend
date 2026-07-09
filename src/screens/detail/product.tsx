import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useChatStore } from '../../store/chatStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useRegionStore } from '../../store/regionStore';
import { useUiStore } from '../../store/uiStore';
import { requireAuthNav, openOrderCheckout } from '../../store/navigation';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { resolveListingDetail } from '../../services/catalogService';
import { userCanChatOnListing } from '../../services/ordersService';
import { submitReport } from '../../services/safetyService';
import { ReportSheet, type ReportReason } from '../../components/ReportSheet';
import { useCatalogRevision } from '../../utils/catalogSync';
import { useRelatedListings } from '../../hooks/useRelatedListings';
import { useLocalizedProduct } from '../../hooks/useLocalizedProduct';
import {
  DetailCard,
  DetailBottomBar,
  DetailBottomIconAction,
  StickyActions,
  useStickyActionsBarInset,
} from '../../components/FormUI';
import { ProductGrid } from '../../components/ProductUI';
import { DetailImageGallery } from '../../components/DetailImageGallery';
import { SellerAuthorRow } from '../../components/SellerAvatar';
import { resolveProductImages } from '../../utils/productImages';
import {
  Badge,
  EmptyState,
  IconButton,
  LoadingState,
  PillButton,
  followPillStyle,
  ScreenScroll,
  SectionHead,
  TitleBar,
} from '../../components/UI';
import { demoBundleMeta, bundleHasOnHoldItemsFromMeta, isBundleListingProduct } from '../../data/bundle';
import { BUNDLE_DETAIL_ID } from '../../data/detailProducts';
import { BundleDetailSummary, BundleItemDetailCard } from '../../components/BundleUI';
import { detailPageTokens, spacing } from '../../theme';
import { listingReviewState } from '../trade/shared';
import { styles } from './shared';

export function DetailScreen({ orderContext = false }: { orderContext?: boolean }) {
  const { t } = useTranslation();
  const openChat = useChatStore((s) => s.openChat);
  const toast = useUiStore((s) => s.toast);
  const currentItem = useCatalogStore((s) => s.currentItem);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const openSellerProfile = useCatalogStore((s) => s.openSellerProfile);
  const mergeProductDetail = useCatalogStore((s) => s.mergeProductDetail);
  const loadProduct = useCatalogStore((s) => s.loadProduct);
  const toggleFav = useFavoritesStore((s) => s.toggleFav);
  const favs = useFavoritesStore((s) => s.favs);
  const toggleFollow = useFavoritesStore((s) => s.toggleFollow);
  const isFollowingSeller = useFavoritesStore((s) => s.isFollowingSeller);
  const isSelfSeller = useFavoritesStore((s) => s.isSelfSeller);
  const region = useRegionStore((s) => s.region);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const item = useLocalizedProduct(currentItem);
  const { items: related, loadError: relatedLoadError, reload: reloadRelated } = useRelatedListings(
    orderContext ? null : currentItem.id,
    region,
  );
  const isFav = favs.has(currentItem.id);
  const isFollowing = isFollowingSeller(currentItem.sellerKey);
  const isSelf = isSelfSeller(currentItem.sellerKey, currentItem.sellerUserId, item.seller);
  const listingUnavailable =
    currentItem.listingStatus === 'inactive' || currentItem.listingStatus === 'draft';
  const listingPurchasable =
    !listingUnavailable && currentItem.listingStatus !== 'sold';
  const needsOrderForChat =
    currentItem.listingStatus === 'sold' || currentItem.listingStatus === 'inactive';
  const [hasListingOrder, setHasListingOrder] = useState<boolean | null>(null);
  const canChat =
    !isSelf &&
    currentItem.listingStatus !== 'draft' &&
    (currentItem.listingStatus === 'active' ||
      hasListingOrder === true ||
      (needsOrderForChat && hasListingOrder === null));
  const stickyBarInset = useStickyActionsBarInset();
  const favoriteCount = currentItem.favoriteCount ?? 0;
  const bundleMeta =
    currentItem.bundleMeta ??
    (currentItem.id === BUNDLE_DETAIL_ID ? demoBundleMeta() : null);
  const galleryImages = resolveProductImages({
    ...currentItem,
    bundleMeta: bundleMeta ?? undefined,
  });
  const isBundleListing = isBundleListingProduct(currentItem) || bundleMeta != null;
  const bundleReady = !isBundleListing || (bundleMeta?.items?.length ?? 0) > 0;
  const [bundleItemsFailed, setBundleItemsFailed] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const catalogRevision = useCatalogRevision();
  const bundleHasOnHold = bundleMeta ? bundleHasOnHoldItemsFromMeta(bundleMeta) : false;
  const canPurchase =
    !isSelf &&
    listingPurchasable &&
    bundleReady &&
    currentItem.purchaseAvailable === true &&
    !bundleHasOnHold;

  useEffect(() => {
    if (!isLoggedIn || !needsOrderForChat) {
      setHasListingOrder(null);
      return;
    }
    void userCanChatOnListing(currentItem.id, isLoggedIn).then(setHasListingOrder);
  }, [currentItem.id, isLoggedIn, needsOrderForChat, catalogRevision]);

  useEffect(() => {
    if (!currentItem.id) return;
    void loadProduct(currentItem.id);
  }, [catalogRevision, currentItem.id, loadProduct]);

  const showCheckout = canPurchase;
  const checkoutLabel = t('common.checkout');

  useEffect(() => {
    if (bundleMeta != null || !isBundleListingProduct(currentItem)) {
      setBundleItemsFailed(false);
      return;
    }

    let cancelled = false;
    setBundleItemsFailed(false);

    void (async () => {
      try {
        for (let attempt = 0; attempt < 4; attempt++) {
          if (cancelled) return;
          const detail = await resolveListingDetail(currentItem.id, isLoggedIn);
          if (cancelled) return;
          if (detail?.bundleMeta != null) {
            mergeProductDetail(detail);
            return;
          }
          if (detail && !isBundleListingProduct(detail)) return;
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        }
        if (!cancelled) setBundleItemsFailed(true);
      } catch {
        if (!cancelled) setBundleItemsFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentItem.id,
    currentItem.listingType,
    currentItem.tagKey,
    bundleMeta,
    isLoggedIn,
    mergeProductDetail,
  ]);

  const openEditListing = () => {
    if (currentItem.listingType === 'bundle') {
      router.push(`/publish/bundle?mode=edit&listingId=${currentItem.id}`);
      return;
    }
    if (currentItem.listingType === 'service') {
      router.push(`/publish/service?mode=edit&listingId=${currentItem.id}`);
      return;
    }
    router.push(`/publish/product?mode=edit&listingId=${currentItem.id}`);
  };

  const retryBundleItems = () => {
    setBundleItemsFailed(false);
    void resolveListingDetail(currentItem.id, isLoggedIn)
      .then((detail) => {
        if (detail?.bundleMeta != null) {
          mergeProductDetail(detail);
        } else {
          setBundleItemsFailed(true);
        }
      })
      .catch(() => setBundleItemsFailed(true));
  };

  const handleReportListing = () => {
    if (!isLoggedIn) {
      requireAuthNav('login');
      return;
    }
    setShowReportSheet(true);
  };

  const handleSubmitReport = (reason: ReportReason, details: string) => {
    if (reportSubmitting) return;
    setReportSubmitting(true);
    void submitReport(
      {
        targetType: 'listing',
        targetId: String(currentItem.id),
        reason,
        details,
      },
      isLoggedIn,
    )
      .then(() => {
        setShowReportSheet(false);
        toast(t('toast.reportSubmitted'));
      })
      .catch(() => toast(t('toast.settingsUpdateFailed')))
      .finally(() => setReportSubmitting(false));
  };

  return (
    <View style={styles.detailShell}>
      <ScreenScroll
        screenId="detail"
        contentBottomInset={orderContext ? spacing.screenBottomNoNav : stickyBarInset}
      >
      <TitleBar
        right={
          orderContext ? undefined : (
            <View style={styles.detailActionsRight}>
              {!isSelf ? (
                <IconButton icon="shield" onPress={handleReportListing} label={t('common.report')} />
              ) : null}
              <IconButton
                icon={isFav ? 'heart' : 'heartOutline'}
                onPress={isSelf ? undefined : toggleFav}
                active={isFav}
              />
            </View>
          )
        }
      />
      {isBundleListing ? (
        <DetailImageGallery
          key={`${currentItem.id}-cover-${galleryImages.join('\0')}`}
          images={galleryImages}
          locationLabel={currentItem.loc}
        />
      ) : (
        <DetailImageGallery
          key={`${currentItem.id}-${galleryImages.join('\0')}`}
          images={galleryImages}
          locationLabel={currentItem.loc}
        />
      )}
      {currentItem.reviewStatus === 'rejected' ? (
        <View style={styles.rejectionNotice}>
          <Text style={styles.rejectionNoticeTitle}>{t('common.rejected')}</Text>
          <Text style={styles.rejectionNoticeText}>
            {listingReviewState(currentItem, t)?.reason ?? t('screens.myListings.rejectedNotice')}
          </Text>
        </View>
      ) : null}
      <DetailCard>
        {isBundleListing && bundleMeta ? (
          <>
            <Text style={styles.detailTitle}>{item.title}</Text>
            {item.desc ? <Text style={styles.detailDesc}>{item.desc}</Text> : null}
            <BundleDetailSummary meta={bundleMeta} />
          </>
        ) : isBundleListing ? (
          <>
            <Text style={styles.detailTitle}>{item.title}</Text>
            {item.desc ? <Text style={styles.detailDesc}>{item.desc}</Text> : null}
            <View style={styles.badgeRow}>
              <Badge text={item.tag} fontSize={detailPageTokens.tagSize} />
            </View>
            <Text style={styles.detailPrice}>
              {item.pricePrefix}
              {currentItem.price}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.detailPrice}>
              {item.pricePrefix}
              {currentItem.price}
            </Text>
            <Text style={styles.detailTitle}>{item.title}</Text>
            <View style={styles.badgeRow}>
              <Badge text={item.tag} fontSize={detailPageTokens.tagSize} />
              {currentItem.escrowSupported !== false ? (
                <Badge text={t('common.escrowSupported')} fontSize={detailPageTokens.tagSize} />
              ) : null}
              {currentItem.negotiable ? (
                <Badge text={t('common.negotiable')} fontSize={detailPageTokens.tagSize} />
              ) : null}
              {!listingPurchasable ? (
                <Badge
                  text={
                    currentItem.listingStatus === 'sold' ? t('common.sold') : t('common.hold')
                  }
                  fontSize={detailPageTokens.tagSize}
                />
              ) : null}
            </View>
          </>
        )}
        {!isBundleListing ? <Text style={styles.detailDesc}>{item.desc}</Text> : null}
      </DetailCard>
      {isBundleListing && bundleMeta ? (
        <>
          {bundleMeta.items.map((bundleItem) => (
            <DetailCard key={bundleItem.id}>
              <BundleItemDetailCard
                item={bundleItem}
                allowSeparateSale={orderContext ? false : bundleMeta.allowSeparateSale}
                onBuySeparate={() => openOrderCheckout(bundleItem.id)}
                buyDisabled={orderContext || isSelf || bundleItem.status !== 'available'}
              />
            </DetailCard>
          ))}
        </>
      ) : isBundleListing ? (
        <DetailCard>
          {bundleItemsFailed ? (
            <View style={styles.bundleItemsFailedWrap}>
              <Text style={styles.detailDesc}>{t('screens.detail.bundleItemsLoadFailed')}</Text>
              <PillButton
                label={t('screens.detail.bundleItemsRetry')}
                variant="light"
                onPress={retryBundleItems}
                style={styles.bundleItemsRetryBtn}
              />
            </View>
          ) : (
            <LoadingState text={t('screens.detail.bundleItemsLoading')} />
          )}
        </DetailCard>
      ) : null}
      {!orderContext ? (
        <>
          <DetailCard>
            <SellerAuthorRow
              sellerKey={currentItem.sellerKey}
              seller={item.seller}
              avatarUrl={currentItem.sellerAvatarUrl}
              sellerUserId={currentItem.sellerUserId}
              listingId={currentItem.id}
              subtitle={t('screens.detail.sellerMeta')}
              onPress={() => openSellerProfile(currentItem.sellerKey)}
              action={
                <PillButton
                  label={isFollowing ? t('common.following') : t('common.follow')}
                  variant={isFollowing ? 'brand' : 'light'}
                  onPress={
                    isSelf ? undefined : () => void toggleFollow(currentItem.sellerKey, currentItem.sellerUserId, item.seller)
                  }
                  disabled={isSelf}
                  style={followPillStyle}
                />
              }
            />
          </DetailCard>
          <DetailCard>
            <Text style={styles.cardH3}>{t('screens.detail.tradeProtection')}</Text>
            <Text style={styles.detailDesc}>{t('screens.detail.tradeProtectionBody')}</Text>
          </DetailCard>
          <SectionHead title={t('screens.detail.related')} action={t('screens.detail.relatedHint')} compact />
          {relatedLoadError ? (
            <>
              <EmptyState text={t('screens.detail.relatedLoadFailed')} />
              <PillButton label={t('common.retry')} variant="light" full onPress={reloadRelated} />
            </>
          ) : (
            <ProductGrid data={related} onPress={openDetail} />
          )}
        </>
      ) : null}
      </ScreenScroll>
      {!orderContext ? (
      <StickyActions fixed>
        <DetailBottomBar
          leading={
            <DetailBottomIconAction
              icon={isFav ? 'heart' : 'heartOutline'}
              label={String(favoriteCount)}
              active={isFav}
              onPress={isSelf ? undefined : toggleFav}
              accessibilityLabel={
                isFav ? t('common.a11y.unfavorite') : t('common.a11y.favorite')
              }
            />
          }
          trailing={
            <View style={styles.detailActionsRight}>
              {isSelf && currentItem.listingStatus === 'draft' ? (
                <PillButton
                  label={t('screens.myListings.editA11y')}
                  variant="brand"
                  onPress={openEditListing}
                  style={styles.detailChatBtn}
                />
              ) : null}
              {!isSelf && showCheckout ? (
                <PillButton
                  label={checkoutLabel}
                  variant="light"
                  onPress={() => openOrderCheckout()}
                  style={styles.detailBuyBtn}
                />
              ) : null}
              {canChat ? (
                <PillButton
                  label={t('common.chat')}
                  icon="messages"
                  variant="brand"
                  onPress={() =>
                    openChat({
                      listingId: currentItem.id,
                      counterpartName: item.seller,
                      listingTitle: item.title,
                    })
                  }
                  style={styles.detailChatBtn}
                />
              ) : null}
            </View>
          }
        />
      </StickyActions>
      ) : null}
      <ReportSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        onSubmit={handleSubmitReport}
        submitting={reportSubmitting}
        title={t('screens.report.title')}
      />
    </View>
  );
}
