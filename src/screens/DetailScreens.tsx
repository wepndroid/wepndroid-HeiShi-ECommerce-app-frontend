import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { ConfirmPaymentButton } from '../components/ConfirmPaymentButton';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { resolveListingDetail } from '../services/catalogService';
import { checkoutOrder, clearStalePendingPayForListing, userCanChatOnListing } from '../services/ordersService';
import { listCoupons } from '../services/couponsService';
import type { CouponDto } from '../api/types';
import { ApiError } from '../api/client';
import { useCatalogRevision } from '../utils/catalogSync';
import { ESCROW_FEE } from '../hooks/useProductFilters';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useFormOptions } from '../hooks/useFormOptions';
import { findOptionLabel } from '../utils/formOptionLabel';
import { useRelatedListings } from '../hooks/useRelatedListings';
import { useSearch } from '../hooks/useSearch';
import { useLocalizedProduct } from '../hooks/useLocalizedProduct';
import {
  DetailCard,
  DetailBottomBar,
  DetailBottomIconAction,
  ListCard,
  ListRow,
  StickyActions,
  useStickyActionsBarInset,
} from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { ProductGrid, OrderThumb } from '../components/ProductUI';
import { DetailImageGallery } from '../components/DetailImageGallery';
import { SellerAuthorRow } from '../components/SellerAvatar';
import { resolveProductImages } from '../utils/productImages';
import { normalizeMediaUrl } from '../utils/mediaUrls';
import {
  Badge,
  EmptyState,
  IconButton,
  LoadingState,
  PillButton,
  followPillStyle,
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../components/UI';
import { AppIcon } from '../components/AppIcon';
import { usePhotoSearch } from '../hooks/usePhotoSearch';
import { demoBundleMeta, bundleHasOnHoldItemsFromMeta, getRemainingBundlePriceFromMeta, isBundleListingProduct } from '../data/bundle';
import { BUNDLE_DETAIL_ID } from '../data/detailProducts';
import { BundleDetailSummary, BundleItemDetailCard } from '../components/BundleUI';
import { colors, fonts, iconTokens, radius, detailPageTokens } from '../theme';
import type { UiOrder } from '../types';

export function SearchScreen() {
  const { t } = useTranslation();
  const {
    openDetail,
    region,
    searchValue,
    setSearchValue,
    toast,
    products,
    imageSearchResults,
    imageSearchPreviewUri,
    imageSearchLoading,
    imageSearchError,
    clearImageSearch,
    setImageSearchLoading,
    setImageSearchError,
  } = useApp();
  const { results, suggestions, loading, error, reload, isImageMode } = useSearch(
    region,
    searchValue,
    imageSearchResults,
    imageSearchLoading,
  );
  const searchByPhoto = usePhotoSearch();
  const showSearchError = error || (isImageMode && imageSearchError);

  const retryImageSearch = () => {
    setImageSearchError(false);
    void searchByPhoto();
  };

  return (
    <ScreenScroll screenId="search">
      <TitleBar />
      <SearchBar
        placeholder={t('screens.search.defaultQuery')}
        value={searchValue}
        onChangeText={(text) => {
          clearImageSearch();
          setSearchValue(text);
        }}
        onSubmit={() => toast(t('toast.search', { query: searchValue }))}
        showCamera
        onCameraPress={() => void searchByPhoto()}
      />
      {isImageMode && imageSearchPreviewUri ? (
        <View style={styles.imageSearchRow}>
          <Image source={{ uri: imageSearchPreviewUri }} style={styles.imageSearchPreview} />
          <View style={styles.imageSearchMeta}>
            <Text style={styles.imageSearchTitle}>{t('screens.search.imageTitle')}</Text>
            <Text style={styles.imageSearchHint}>{t('screens.search.imageHint')}</Text>
          </View>
        </View>
      ) : null}
      {!isImageMode ? (
        <>
          <SectionHead
            title={t('screens.search.guessTitle')}
            subtitle={t('screens.search.guessHint')}
          />
          <View style={styles.suggestRow}>
            {suggestions.map((item) => (
              <AmazingSurface
                key={`${item.productId}-${item.query}`}
                style={styles.suggest}
                onPress={() => {
                  setSearchValue(item.query);
                  if (item.productId != null) {
                    void fetchListingDetail(item.productId).then((product) => {
                      if (product) {
                        openDetail(product);
                        return;
                      }
                      const fromResults = results.find((p) => p.id === item.productId);
                      if (fromResults) {
                        openDetail(fromResults);
                        return;
                      }
                      const fromCatalog = products.find((p) => p.id === item.productId);
                      if (fromCatalog) {
                        openDetail(fromCatalog);
                        return;
                      }
                      toast(t('toast.listingUnavailable'));
                    });
                    return;
                  }
                  toast(t('toast.quickSearch', { query: item.query }));
                }}
              >
                <View style={styles.sgImg}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: normalizeMediaUrl(item.imageUrl) ?? item.imageUrl }}
                      style={styles.sgImgPhoto}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <View style={styles.suggestText}>
                  <Text style={styles.suggestTitle}>{item.title}</Text>
                  <Text style={styles.suggestSub}>{item.subtitle}</Text>
                </View>
              </AmazingSurface>
            ))}
          </View>
        </>
      ) : null}
      <SectionHead
        title={isImageMode ? t('screens.search.imageResults') : t('screens.search.results')}
        action={t('common.tapForDetails')}
        compact
      />
      {loading ? (
        <LoadingState text={t('screens.search.searching')} />
      ) : showSearchError ? (
        <>
          <EmptyState text={t('screens.search.error')} />
          <PillButton
            label={t('common.retry')}
            variant="light"
            full
            onPress={isImageMode && imageSearchError ? retryImageSearch : reload}
          />
        </>
      ) : (
        <ProductGrid data={results} onPress={openDetail} emptyText={t('screens.search.empty')} />
      )}
    </ScreenScroll>
  );
}

export function DetailScreen() {
  const { t } = useTranslation();
  const {
    nav,
    requireAuthNav,
    toast,
    currentItem,
    toggleFav,
    favs,
    toggleFollow,
    isFollowingSeller,
    isSelfSeller,
    region,
    openDetail,
    openSellerProfile,
    openChat,
    mergeProductDetail,
    loadProduct,
    isLoggedIn,
    openOrderCheckout,
  } = useApp();
  const item = useLocalizedProduct(currentItem);
  const { items: related, loadError: relatedLoadError, reload: reloadRelated } = useRelatedListings(
    currentItem.id,
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
    bundleMeta,
  });
  const isBundleListing = isBundleListingProduct(currentItem) || bundleMeta != null;
  const bundleReady = !isBundleListing || (bundleMeta?.items?.length ?? 0) > 0;
  const [bundleItemsFailed, setBundleItemsFailed] = useState(false);
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

  return (
    <View style={styles.detailShell}>
      <ScreenScroll screenId="detail" contentBottomInset={stickyBarInset}>
      <TitleBar
        right={
          <IconButton
            icon={isFav ? 'heart' : 'heartOutline'}
            onPress={isSelf ? undefined : toggleFav}
            active={isFav}
          />
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
                allowSeparateSale={bundleMeta.allowSeparateSale}
                onBuySeparate={() => openOrderCheckout(bundleItem.id)}
                buyDisabled={isSelf || bundleItem.status !== 'available'}
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
      </ScreenScroll>
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
    </View>
  );
}

export function OrderScreen() {
  const { t, i18n } = useTranslation();
  const {
    nav,
    toast,
    currentItem,
    paymentMethod,
    paymentMethods,
    paymentMethodId,
    selectPaymentMethodById,
    deliveryMethod,
    setDeliveryMethod,
    isLoggedIn,
    isSelfSeller,
    mergeProductDetail,
    loadProduct,
    checkoutBundleItemId,
    setCheckoutBundleItemId,
  } = useApp();
  useAuthGuard();
  const { options } = useFormOptions();
  const item = useLocalizedProduct(currentItem);
  const bundleMeta = currentItem.bundleMeta ?? null;
  const selectedBundleItem =
    checkoutBundleItemId && bundleMeta
      ? bundleMeta.items.find((row) => row.id === checkoutBundleItemId)
      : null;
  const isSeparateCheckout = Boolean(selectedBundleItem);
  const isBundleListing = isBundleListingProduct(currentItem) || bundleMeta != null;
  const bundleReady = !isBundleListing || (bundleMeta?.items?.length ?? 0) > 0;
  const listingUnavailable =
    currentItem.listingStatus === 'inactive' || currentItem.listingStatus === 'draft';
  const listingPurchasable =
    !listingUnavailable && currentItem.listingStatus !== 'sold';
  const isSelf = isSelfSeller(currentItem.sellerKey, currentItem.sellerUserId, item.seller);
  const catalogItemPrice =
    isSeparateCheckout && selectedBundleItem?.separatePrice
      ? selectedBundleItem.separatePrice
      : isBundleListing && bundleMeta
        ? getRemainingBundlePriceFromMeta(bundleMeta)
        : currentItem.price;
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const selectedCoupon = selectedCouponId
    ? coupons.find((row) => row.id === selectedCouponId) ?? null
    : null;
  const discountAmount = selectedCoupon
    ? Math.min(selectedCoupon.amount, catalogItemPrice)
    : 0;
  const itemPayable = catalogItemPrice - discountAmount;
  const checkoutEscrowFee =
    currentItem.escrowSupported === false
      ? 0
      : currentItem.escrowFee ?? ESCROW_FEE;
  const canPurchaseSeparate =
    isSeparateCheckout &&
    selectedBundleItem?.status === 'available' &&
    (selectedBundleItem.separatePrice ?? 0) > 0 &&
    bundleMeta?.allowSeparateSale !== false;
  const [checkoutReady, setCheckoutReady] = useState(false);
  const canPurchase =
    checkoutReady &&
    !isSelf &&
    bundleReady &&
    (canPurchaseSeparate ||
      (!isSeparateCheckout && listingPurchasable && currentItem.purchaseAvailable === true));
  const total = itemPayable + checkoutEscrowFee;
  const [submitting, setSubmitting] = useState(false);
  const deliveryLabel = findOptionLabel(options.deliveryMethods, deliveryMethod, i18n.language);
  const catalogRevision = useCatalogRevision();

  const prepareCheckout = useCallback(() => {
    if (!isLoggedIn || !currentItem.id) {
      setCheckoutReady(true);
      return;
    }
    setCheckoutReady(false);
    void clearStalePendingPayForListing(currentItem.id, checkoutBundleItemId ?? undefined)
      .then(() => loadProduct(currentItem.id))
      .finally(() => setCheckoutReady(true));
  }, [checkoutBundleItemId, currentItem.id, isLoggedIn, loadProduct]);

  useEffect(() => {
    prepareCheckout();
  }, [prepareCheckout, catalogRevision]);

  useFocusEffect(
    useCallback(() => {
      prepareCheckout();
    }, [prepareCheckout]),
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setCoupons([]);
      return;
    }
    void listCoupons(true).then(setCoupons);
  }, [isLoggedIn, catalogRevision]);

  useEffect(() => {
    if (!checkoutReady || canPurchase) return;
    if (listingPurchasable && currentItem.purchaseAvailable === false) {
      toast(t('toast.checkoutReservedByOther'));
    } else {
      toast(t('toast.listingUnavailable'));
    }
    nav('detail');
  }, [
    canPurchase,
    checkoutReady,
    currentItem.purchaseAvailable,
    listingPurchasable,
    nav,
    t,
    toast,
  ]);

  const showCouponPicker = () => {
    const available = coupons.filter((row) => row.status === 'available');
    if (!available.length) {
      toast(t('screens.order.couponEmpty'));
      return;
    }
    Alert.alert(
      t('screens.order.coupon'),
      undefined,
      [
        {
          text: t('screens.order.couponNone'),
          onPress: () => applyCouponSelection(null),
        },
        ...available.map((coupon) => ({
          text: `${t('common.currencyPrefix')}${coupon.amount} · ${coupon.description}`,
          onPress: () => applyCouponSelection(coupon.id),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ],
    );
  };

  const applyCouponSelection = (couponId: string | null) => {
    setSelectedCouponId(couponId);
  };

  const showDeliveryPicker = () => {
    if (!options.deliveryMethods.length) {
      toast(t('toast.selectDelivery'));
      return;
    }
    Alert.alert(
      t('screens.order.delivery'),
      undefined,
      options.deliveryMethods.map((option) => ({
        text: i18n.language.startsWith('zh') ? option.labelZh : option.labelEn,
        onPress: () => setDeliveryMethod(option.key),
      })),
    );
  };

  const showPaymentPicker = () => {
    if (!paymentMethods.length) {
      toast(t('toast.selectPayment'));
      return;
    }
    Alert.alert(
      t('screens.order.payment'),
      undefined,
      paymentMethods.map((method) => ({
        text: method.label,
        onPress: () => selectPaymentMethodById(method.id),
      })),
    );
  };

  const handleCheckout = async () => {
    if (submitting || !canPurchase) return;
    if (!deliveryMethod) {
      toast(t('toast.selectDelivery'));
      return;
    }
    if (!paymentMethodId) {
      toast(t('toast.selectPayment'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkoutOrder({
        listingId: currentItem.id,
        deliveryMethod,
        paymentMethodId,
        bundleItemId: checkoutBundleItemId ?? undefined,
        couponId: selectedCouponId ?? undefined,
        product: currentItem,
        title: item.title,
        sellerName: item.seller,
        isLoggedIn,
      });
      const { paid, payFailed } = result;
      if (paid) {
        void loadProduct(currentItem.id);
        setCheckoutBundleItemId(null);
        toast(t('toast.paySuccess'));
        setTimeout(() => nav('orders'), 700);
      } else if (payFailed) {
        toast(t('toast.payFailed'));
        void loadProduct(currentItem.id);
      } else {
        toast(t('toast.checkoutFailed'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_STATE') {
          toast(t('toast.cannotBuyOwnListing'));
        } else if (err.code === 'LISTING_RESERVED') {
          toast(t('toast.checkoutFailed'));
        } else if (err.code === 'LISTING_RESERVED_BY_OTHER') {
          toast(t('toast.checkoutReservedByOther'));
        } else if (err.code === 'COUPON_IN_USE' || err.code === 'INVALID_STATE') {
          toast(t('toast.couponInvalid'));
        } else if (err.code === 'USER_BLOCKED') {
          toast(t('toast.userBlocked'));
        } else if (err.status === 404) {
          toast(t('toast.listingUnavailable'));
        } else {
          toast(t('toast.checkoutFailed'));
        }
      } else {
        toast(t('toast.checkoutFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stickyBarInset = useStickyActionsBarInset();
  const payLabel = t('screens.order.confirmPay', {
    amount: `${item.pricePrefix}${total.toFixed(2)}`,
  });

  return (
    <View style={styles.orderScreen}>
      <ScreenScroll screenId="order" contentBottomInset={stickyBarInset}>
      <TitleBar center={t('screens.order.title')} />
      <AmazingSurface style={styles.orderItem}>
        <View style={styles.orderMid}>
          <OrderThumb imageUrl={item.imageUrl} />
          <View style={{ flex: 1 }}>
            <Text style={styles.orderTitle}>{item.title}</Text>
            <Text style={styles.orderSub}>{t('screens.order.subtitle')}</Text>
            <Text style={styles.detailPrice}>
              {item.pricePrefix}
              {catalogItemPrice}
            </Text>
          </View>
        </View>
      </AmazingSurface>
      <ListCard>
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="location" size={iconTokens.sizes.sm} color={iconTokens.accent} />
              <View>
                <Text style={styles.listMain}>{t('screens.order.delivery')}</Text>
                <Text style={styles.listSub}>{deliveryLabel || t('common.placeholders.selectOption')}</Text>
              </View>
            </View>
          }
          right={<AppIcon name="chevronForward" size={16} color="#bbbbbb" />}
          onPress={showDeliveryPicker}
        />
        {checkoutEscrowFee > 0 ? (
          <ListRow
            left={
              <View style={styles.listLeft}>
                <AppIcon name="shield" size={iconTokens.sizes.sm} color={iconTokens.accent} />
                <View>
                  <Text style={styles.listMain}>{t('screens.order.escrow')}</Text>
                  <Text style={styles.listSub}>{t('screens.order.escrowSub')}</Text>
                </View>
              </View>
            }
            right={
              <Text style={styles.strong}>
                {t('common.currencyPrefix')}
                {checkoutEscrowFee.toFixed(2)}
              </Text>
            }
          />
        ) : null}
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="coupon" size={iconTokens.sizes.sm} color={iconTokens.accent} />
              <View>
                <Text style={styles.listMain}>{t('screens.order.coupon')}</Text>
                <Text style={styles.listSub}>
                  {selectedCoupon
                    ? `${t('common.currencyPrefix')}${selectedCoupon.amount} · ${selectedCoupon.description}`
                    : t('screens.order.couponNone')}
                </Text>
              </View>
            </View>
          }
          right={<AppIcon name="chevronForward" size={16} color="#bbbbbb" />}
          onPress={showCouponPicker}
        />
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="pay" size={iconTokens.sizes.sm} color={iconTokens.accent} />
              <View>
                <Text style={styles.listMain}>{t('screens.order.payment')}</Text>
                <Text style={styles.listSub}>{paymentMethod}</Text>
              </View>
            </View>
          }
          right={<AppIcon name="chevronForward" size={16} color="#bbbbbb" />}
          onPress={showPaymentPicker}
          border={false}
        />
      </ListCard>
      <ListCard>
        <ListRow
          left={<Text>{t('screens.order.itemAmount')}</Text>}
          right={
            <Text style={styles.strong}>
              {item.pricePrefix}
              {catalogItemPrice.toFixed(2)}
            </Text>
          }
        />
        {discountAmount > 0 ? (
          <ListRow
            left={<Text>{t('screens.order.couponDiscount')}</Text>}
            right={
              <Text style={styles.strong}>
                -{item.pricePrefix}
                {discountAmount.toFixed(2)}
              </Text>
            }
          />
        ) : null}
        {checkoutEscrowFee > 0 ? (
          <ListRow
            left={<Text>{t('screens.order.escrowFee')}</Text>}
            right={
              <Text style={styles.strong}>
                {t('common.currencyPrefix')}
                {checkoutEscrowFee.toFixed(2)}
              </Text>
            }
          />
        ) : null}
        <ListRow
          left={<Text>{t('screens.order.total')}</Text>}
          right={
            <Text style={styles.strong}>
              {item.pricePrefix}
              {total.toFixed(2)}
            </Text>
          }
          border={false}
        />
      </ListCard>
      <AmazingSurface style={styles.tableNoteShell}>
        <Text style={styles.tableNote}>{t('screens.order.demoNote')}</Text>
      </AmazingSurface>
      </ScreenScroll>
      <StickyActions fixed>
        <ConfirmPaymentButton
          label={payLabel}
          onPress={handleCheckout}
          loading={submitting}
          disabled={submitting || !canPurchase}
        />
      </StickyActions>
    </View>
  );
}

const styles = StyleSheet.create({
  orderScreen: {
    flex: 1,
  },
  suggestRow: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8,
  },
  suggest: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sgImg: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sgImgPhoto: {
    width: '100%',
    height: '100%',
  },
  suggestText: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  suggestSub: {
    fontSize: 10,
    color: colors.sub,
    marginTop: 2,
  },
  imageSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
  },
  imageSearchPreview: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  imageSearchMeta: {
    flex: 1,
  },
  imageSearchTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  imageSearchHint: {
    fontSize: 11,
    color: colors.sub,
    marginTop: 2,
  },
  detailShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  detailActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  detailChatBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  detailBuyBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  detailPrice: {
    fontSize: detailPageTokens.priceSize,
    color: colors.red,
    fontWeight: fonts.weights.bold,
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: detailPageTokens.titleSize,
    fontWeight: fonts.weights.bold,
    lineHeight: detailPageTokens.titleLineHeight,
    marginBottom: 6,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailDesc: {
    fontSize: detailPageTokens.bodySize,
    lineHeight: detailPageTokens.bodyLineHeight,
    color: colors.sub,
  },
  cardH3: {
    fontSize: detailPageTokens.cardHeadingSize,
    fontWeight: fonts.weights.bold,
    marginBottom: 10,
    color: colors.text,
  },
  bundleItemsFailedWrap: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bundleItemsRetryBtn: {
    alignSelf: 'center',
  },
  orderItem: {
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  orderMid: {
    flexDirection: 'row',
    gap: 10,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  orderSub: {
    marginTop: 7,
    color: '#777777',
    fontSize: 12,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listMain: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  listSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  strong: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  tableNoteShell: {
    borderRadius: radius.xl,
    padding: 12,
    marginTop: 10,
  },
  tableNote: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
});
