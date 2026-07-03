import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ConfirmPaymentButton } from '../../components/ConfirmPaymentButton';
import { useCheckoutPicker } from '../../context/CheckoutPickerContext';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useUiStore } from '../../store/uiStore';
import { nav } from '../../store/navigation';
import { checkoutOrder, clearStalePendingPayForListing } from '../../services/ordersService';
import { listCoupons } from '../../services/couponsService';
import { ApiError } from '../../api/client';
import { useCatalogRevision } from '../../utils/catalogSync';
import { ESCROW_FEE } from '../../hooks/useProductFilters';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useFormOptions } from '../../hooks/useFormOptions';
import { findOptionLabel } from '../../utils/formOptionLabel';
import { useLocalizedProduct } from '../../hooks/useLocalizedProduct';
import {
  ListCard,
  ListRow,
  StickyActions,
  useStickyActionsBarInset,
} from '../../components/FormUI';
import { AmazingSurface } from '../../components/AmazingSurface';
import { OrderThumb } from '../../components/ProductUI';
import { ScreenScroll, TitleBar } from '../../components/UI';
import { AppIcon } from '../../components/AppIcon';
import { getRemainingBundlePriceFromMeta, isBundleListingProduct } from '../../data/bundle';
import { iconTokens } from '../../theme';
import { styles } from './shared';

export function OrderScreen() {
  const { t, i18n } = useTranslation();
  const toast = useUiStore((s) => s.toast);
  const currentItem = useCatalogStore((s) => s.currentItem);
  const loadProduct = useCatalogStore((s) => s.loadProduct);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const paymentMethodId = useCheckoutStore((s) => s.paymentMethodId);
  const refreshPaymentMethods = useCheckoutStore((s) => s.refreshPaymentMethods);
  const deliveryMethod = useCheckoutStore((s) => s.deliveryMethod);
  const setDeliveryMethod = useCheckoutStore((s) => s.setDeliveryMethod);
  const checkoutBundleItemId = useCheckoutStore((s) => s.checkoutBundleItemId);
  const setCheckoutBundleItemId = useCheckoutStore((s) => s.setCheckoutBundleItemId);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const isSelfSeller = useFavoritesStore((s) => s.isSelfSeller);
  useAuthGuard();
  const {
    coupons,
    selectedCouponId,
    setSelectedCouponId,
    setCoupons,
    openPaymentPicker,
    openCouponPicker,
  } = useCheckoutPicker();
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
  const deliveryLabel =
    findOptionLabel(options.pickupMethods, deliveryMethod, i18n.language) ||
    findOptionLabel(options.deliveryMethods, deliveryMethod, i18n.language);
  const catalogRevision = useCatalogRevision();

  useEffect(() => {
    const sellerMethod = currentItem.pickupMethodKeys?.[0];
    if (sellerMethod) setDeliveryMethod(sellerMethod);
  }, [currentItem.id, currentItem.pickupMethodKeys, setDeliveryMethod]);

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
      if (isLoggedIn) void refreshPaymentMethods();
    }, [prepareCheckout, isLoggedIn, refreshPaymentMethods]),
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
      const { paid, payFailed, pendingPayment } = result;
      if (paid) {
        void loadProduct(currentItem.id);
        setCheckoutBundleItemId(null);
        toast(t('toast.paySuccess'));
        setTimeout(() => nav('orders'), 700);
      } else if (pendingPayment) {
        void loadProduct(currentItem.id);
        setCheckoutBundleItemId(null);
        toast(t('toast.checkoutPendingPay'));
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
          onPress={openCouponPicker}
        />
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="pay" size={iconTokens.sizes.sm} color={iconTokens.accent} />
              <View>
                <Text style={styles.listMain}>{t('screens.order.payment')}</Text>
                <Text style={styles.listSub}>
                  {paymentMethod || t('common.placeholders.selectOption')}
                </Text>
              </View>
            </View>
          }
          right={<AppIcon name="chevronForward" size={16} color="#bbbbbb" />}
          onPress={openPaymentPicker}
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
        <Text style={styles.cnyHint}>
          {t('screens.order.cnyDisplay', { amount: (total * 4.75).toFixed(0) })}
        </Text>
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
