import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { ORDER_FILTERS } from '../../data/orders';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useSellerOrders } from '../../hooks/useSellerOrders';
import { useOrders } from '../../hooks/useOrders';
import {
  sellerActionForStatus,
  openOrderDispute,
  sellerAdjustOrderAmount,
} from '../../services/ordersService';
import { useLocalizedProducts } from '../../hooks/useLocalizedProduct';
import { PillButton, ScreenScroll, TitleBar, EmptyState, LoadingState } from '../../components/UI';
import { Product, OrderFilterKey, OrderStatus, UiOrder } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useChatStore } from '../../store/chatStore';
import { toast } from '../../store/uiStore';
import {
  FILTER_LABEL_KEYS,
  OrderListCard,
  OrderReasonModal,
  PromptModal,
  orderDisplay,
  sellerOrderDisplay,
  styles,
} from './shared';

export function OrdersScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const params = useLocalSearchParams<{ filter?: string }>();
  const products = useCatalogStore((s) => s.products);
  const openChat = useChatStore((s) => s.openChat);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const mergeCatalogProducts = useCatalogStore((s) => s.mergeCatalogProducts);
  const [activeFilter, setActiveFilter] = useState<OrderFilterKey>(() => {
    const filter = params.filter;
    return filter && ORDER_FILTERS.includes(filter as OrderFilterKey)
      ? (filter as OrderFilterKey)
      : 'all';
  });
  const localizedProducts = useLocalizedProducts(products);

  const resolveTitle = useCallback(
    (product: Product) =>
      localizedProducts.find((p) => p.id === product.id)?.title ?? product.apiTitle ?? '',
    [localizedProducts],
  );
  const resolveSeller = useCallback(
    (product: Product) =>
      localizedProducts.find((p) => p.id === product.id)?.seller ?? product.seller ?? '',
    [localizedProducts],
  );

  const { orders: visibleOrders, loading, error, runAction, refresh } = useOrders(
    activeFilter,
    isLoggedIn,
    authReady,
    products,
    resolveTitle,
    resolveSeller,
    mergeCatalogProducts,
  );
  const [prompt, setPrompt] = useState<
    | { kind: 'dispute' | 'refund'; order: UiOrder }
    | null
  >(null);

  const openOrderListing = useCallback(
    (order: UiOrder) => {
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
      );
    },
    [openDetail, products],
  );

  const handleSecondaryAction = async (order: (typeof visibleOrders)[number]) => {
    const display = orderDisplay(order.status, t, order.viewerHasReviewed);
    if (order.status === 'pendingReview' || order.status === 'completed' || order.status === 'refunded') {
      const mode = order.viewerHasReviewed ? '?mode=view' : '';
      router.push(`/profile/review/${order.id}${mode}` as Href);
      return;
    }
    if (!display.secondaryLabel) return;
    try {
      await runAction(order);
      toast(t(display.secondaryToastKey));
    } catch {
      toast(t('toast.orderActionFailed'));
    }
  };

  const handleOpenDispute = useCallback(
    (order: UiOrder) => {
      setPrompt({ kind: 'dispute', order });
    },
    [],
  );

  const submitPrompt = useCallback(
    async (reason: string, evidenceUrls: string[]) => {
      if (!prompt) return;
      if (!reason) {
        toast(t('screens.orders.reasonRequired'));
        return;
      }
      const { order, kind } = prompt;
      setPrompt(null);
      try {
        await openOrderDispute(order, reason, isLoggedIn, evidenceUrls);
        toast(t(kind === 'refund' ? 'toast.refundRequested' : 'toast.disputeOpened'));
        refresh();
      } catch {
        toast(t('toast.orderActionFailed'));
      }
    },
    [isLoggedIn, prompt, refresh, t],
  );

  const canOpenDispute = (status: OrderStatus) =>
    status === 'pendingShip' ||
    status === 'pendingReceive' ||
    status === 'pendingService' ||
    status === 'completed';

  return (
    <ScreenScroll screenId="orders">
      <TitleBar center={t('screens.orders.title')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ORDER_FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {t(FILTER_LABEL_KEYS[filter])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {loading ? (
        <LoadingState compact />
      ) : error ? (
        <>
          <EmptyState text={t('screens.orders.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : visibleOrders.length ? (
        visibleOrders.map((order) => {
          const display = orderDisplay(order.status, t, order.viewerHasReviewed);
          return (
            <OrderListCard
              key={order.id}
              order={order}
              display={display}
              counterpartName={order.sellerName}
              contactLabel={t('screens.orders.contactSeller')}
              onOpenListing={() => openOrderListing(order)}
              onContact={() =>
                openChat({
                  listingId: order.listingId,
                  counterpartName: order.sellerName,
                  listingTitle: order.title,
                })
              }
              onSecondary={
                display.secondaryLabel ? () => void handleSecondaryAction(order) : undefined
              }
              onDispute={
                canOpenDispute(order.status) ? () => handleOpenDispute(order) : undefined
              }
              disputeLabel={
                canOpenDispute(order.status) ? t('screens.orders.openDispute') : undefined
              }
            />
          );
        })
      ) : (
        <EmptyState text={t('screens.orders.emptyFilter')} />
      )}
      <OrderReasonModal
        visible={prompt != null}
        title={
          prompt?.kind === 'refund'
            ? t('screens.orders.refundConfirmTitle')
            : t('screens.orders.disputeConfirmTitle')
        }
        body={
          prompt?.kind === 'refund'
            ? t('screens.orders.refundConfirmBody')
            : t('screens.orders.disputeConfirmBody')
        }
        placeholder={t('screens.orders.reasonPlaceholder')}
        confirmLabel={t('common.confirm')}
        isLoggedIn={isLoggedIn}
        onCancel={() => setPrompt(null)}
        onConfirm={submitPrompt}
      />
    </ScreenScroll>
  );
}

export function SoldScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const params = useLocalSearchParams<{ filter?: string }>();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const openChat = useChatStore((s) => s.openChat);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
  const publishListingPriceChange = useCatalogStore((s) => s.publishListingPriceChange);
  const [activeFilter, setActiveFilter] = useState<OrderFilterKey>(() => {
    const filter = params.filter;
    return filter && ORDER_FILTERS.includes(filter as OrderFilterKey)
      ? (filter as OrderFilterKey)
      : 'all';
  });
  const localizedProducts = useLocalizedProducts(products);
  const resolveTitle = useCallback(
    (product: Product) =>
      localizedProducts.find((p) => p.id === product.id)?.title ?? product.apiTitle ?? '',
    [localizedProducts],
  );
  const resolveSeller = useCallback(
    (product: Product) =>
      localizedProducts.find((p) => p.id === product.id)?.seller ?? product.seller ?? '',
    [localizedProducts],
  );
  const { orders, loading, error, shipOrder, releaseOrder, refresh } = useSellerOrders(
    activeFilter,
    isLoggedIn,
    authReady,
    products,
    resolveTitle,
    resolveSeller,
  );
  const [adjustOrder, setAdjustOrder] = useState<UiOrder | null>(null);

  const openSaleListing = useCallback(
    (order: UiOrder) => {
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
      );
    },
    [openDetail, products],
  );

  const handleShip = async (order: UiOrder) => {
    try {
      await shipOrder(order);
      toast(t('toast.shipped'));
    } catch {
      toast(t('toast.orderActionFailed'));
    }
  };

  const handleRelease = async (order: UiOrder) => {
    try {
      await releaseOrder(order);
      toast(t('toast.orderReleased'));
    } catch {
      toast(t('toast.orderActionFailed'));
    }
  };

  const handleSellerSecondary = (order: UiOrder) => {
    if (order.status === 'pendingReview' || order.status === 'completed' || order.status === 'refunded') {
      const mode = order.viewerHasReviewed ? '?mode=view' : '';
      router.push(`/profile/review/${order.id}${mode}` as Href);
    }
  };

  return (
    <ScreenScroll screenId="sold">
      <TitleBar center={t('screens.sold.title')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ORDER_FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {t(FILTER_LABEL_KEYS[filter])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {loading ? (
        <LoadingState compact />
      ) : error ? (
        <>
          <EmptyState text={t('screens.sold.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : orders.length ? (
        orders.map((order) => {
          const display = sellerOrderDisplay(order.status, t, order.viewerHasReviewed);
          const sellerAction = sellerActionForStatus(order.status);
          const actionHandler =
            sellerAction === 'ship' ? handleShip : sellerAction === 'release' ? handleRelease : null;
          return (
            <OrderListCard
              key={order.id}
              order={order}
              display={display}
              counterpartName={order.buyerName ?? ''}
              contactLabel={t('screens.sold.contactBuyer')}
              showContact={Boolean(order.buyerId && order.buyerName)}
              onOpenListing={() => openSaleListing(order)}
              onContact={() =>
                openChat({
                  listingId: order.listingId,
                  counterpartUserId: order.buyerId,
                  counterpartName: order.buyerName,
                  listingTitle: order.title,
                })
              }
              onSecondary={
                display.secondaryLabel && sellerAction
                  ? () => void actionHandler?.(order)
                  : display.secondaryLabel
                    ? () => handleSellerSecondary(order)
                    : undefined
              }
              onAdjustPrice={
                order.status === 'pendingPay' ? () => setAdjustOrder(order) : undefined
              }
              adjustPriceLabel={
                order.status === 'pendingPay' ? t('screens.sold.adjustPrice') : undefined
              }
            />
          );
        })
      ) : (
        <EmptyState text={t('screens.sold.emptyFilter')} />
      )}
      <PromptModal
        visible={adjustOrder != null}
        title={t('screens.sold.adjustPriceTitle')}
        body={t('screens.sold.adjustPriceBody')}
        placeholder={t('common.currencyPrefix')}
        keyboardType="decimal-pad"
        confirmLabel={t('common.confirm')}
        onCancel={() => setAdjustOrder(null)}
        onConfirm={(value) => {
          if (!adjustOrder) return;
          const amount = Number(value);
          if (!Number.isFinite(amount) || amount <= 0) {
            toast(t('screens.sold.adjustPriceInvalid'));
            return;
          }
          const order = adjustOrder;
          setAdjustOrder(null);
          void sellerAdjustOrderAmount(order, amount, isLoggedIn)
            .then(({ amount: newAmount }) => {
              toast(t('toast.orderUpdated'));
              void publishListingPriceChange(order.listingId, newAmount);
              refresh();
            })
            .catch(() => toast(t('toast.orderActionFailed')));
        }}
      />
    </ScreenScroll>
  );
}
