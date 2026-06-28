import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { ORDER_FILTERS } from '../data/orders';
import { productImageUrl } from '../data/productImages';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCoupons } from '../hooks/useCoupons';
import { useFavoriteProducts } from '../hooks/useFavoriteProducts';
import { useHistoryProducts } from '../hooks/useHistory';
import { useMyListings } from '../hooks/useMyListings';
import { useSellerOrders } from '../hooks/useSellerOrders';
import { useOrders } from '../hooks/useOrders';
import { cancelOrder, fetchOrderReview, releaseSalesOrder, sellerActionForStatus, submitOrderReview } from '../services/ordersService';
import { regionProducts } from '../hooks/useProductFilters';
import { useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { ListCard, TableNote } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { OrderThumb, ProductGrid } from '../components/ProductUI';
import { PillButton, followPillStyle, ScreenScroll, TitleBar, EmptyState, LoadingState } from '../components/UI';
import { AppIcon } from '../components/AppIcon';
import { SellerAvatar } from '../components/SellerAvatar';
import { useFollowList } from '../hooks/useFollowList';
import { deleteListing, updateListing } from '../services/listingsService';
import { colors, fonts, radius } from '../theme';
import { OrderFilterKey, OrderStatus, Product, UiListing, UiOrder } from '../types';

function uiListingToProduct(listing: UiListing, sellerId?: string, sellerName?: string): Product {
  const images = listing.imageUrls?.length ? listing.imageUrls : listing.imageUrl ? [listing.imageUrl] : [];
  return {
    id: listing.id,
    price: listing.price,
    catKey: 'home',
    tagKey: listing.listingType === 'bundle' ? 'bundleSet' : listing.listingType === 'service' ? 'localService' : 'lightlyUsed',
    sellerKey: sellerId ?? '',
    seller: sellerName ?? '',
    sellerUserId: sellerId,
    loc: '',
    height: '',
    imageUrl: images[0] ?? listing.imageUrl,
    imageUrls: images,
    apiTitle: listing.title,
    listingType: listing.listingType,
    listingStatus: listing.status,
  };
}

const FILTER_LABEL_KEYS: Record<OrderFilterKey, 'screens.orders.all' | 'screens.orders.pendingPay' | 'screens.orders.pendingShip' | 'screens.orders.pendingReceive' | 'screens.orders.pendingReview'> = {
  all: 'screens.orders.all',
  pendingPay: 'screens.orders.pendingPay',
  pendingShip: 'screens.orders.pendingShip',
  pendingReceive: 'screens.orders.pendingReceive',
  pendingReview: 'screens.orders.pendingReview',
};

function orderDisplay(
  status: OrderStatus,
  t: (key: string) => string,
): {
  statusTitle: string;
  statusSub: string;
  statusColor: string;
  secondaryLabel: string | null;
  secondaryToastKey: string;
  secondaryIsBrand: boolean;
} {
  switch (status) {
    case 'pendingPay':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitPay'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.payNow'),
        secondaryToastKey: 'toast.paySuccess',
        secondaryIsBrand: true,
      };
    case 'pendingShip':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitShip'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.remindShip'),
        secondaryToastKey: 'toast.reminderSent',
        secondaryIsBrand: false,
      };
    case 'pendingReceive':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.confirmReceive'),
        secondaryToastKey: 'toast.confirmReceived',
        secondaryIsBrand: true,
      };
    case 'pendingReview':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.orders.waitReview'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.submitReview'),
        secondaryToastKey: 'toast.reviewSubmitted',
        secondaryIsBrand: true,
      };
    case 'completed':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.orders.success'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.viewReview'),
        secondaryToastKey: 'toast.viewReview',
        secondaryIsBrand: true,
      };
    case 'cancelled':
      return {
        statusTitle: t('screens.orders.cancelled'),
        statusSub: t('screens.orders.cancelledSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderCancelled',
        secondaryIsBrand: false,
      };
  }
}

function sellerOrderDisplay(
  status: OrderStatus,
  t: (key: string) => string,
): {
  statusTitle: string;
  statusSub: string;
  statusColor: string;
  secondaryLabel: string | null;
  secondaryToastKey: string;
} {
  switch (status) {
    case 'pendingShip':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitShip'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.sold.shipNow'),
        secondaryToastKey: 'toast.shipped',
      };
    case 'pendingPay':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitPay'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.sold.releaseOrder'),
        secondaryToastKey: 'toast.orderReleased',
      };
    case 'cancelled':
      return {
        statusTitle: t('screens.orders.cancelled'),
        statusSub: t('screens.orders.cancelledSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderCancelled',
      };
    case 'pendingReceive':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitBuyerConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
      };
    case 'pendingReview':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.sold.waitReview'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
      };
    case 'completed':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.sold.buyerConfirmed'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
      };
    default:
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitBuyerConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
      };
  }
}

export function OrdersScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { products, requireAuthNav, toast, openChat, openDetail, nav, isLoggedIn, authReady, paymentMethods } = useApp();
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
  );

  const openOrderCheckout = useCallback(
    (order: UiOrder) => {
      if (!paymentMethods.length) {
        toast(t('toast.selectPayment'));
        nav('paymentSettings');
        return;
      }
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
        },
      );
      nav('order');
    },
    [nav, openDetail, paymentMethods.length, products, t, toast],
  );

  const handleSecondaryAction = async (order: (typeof visibleOrders)[number]) => {
    const display = orderDisplay(order.status, t);
    if (order.status === 'pendingPay') {
      openOrderCheckout(order);
      return;
    }
    if (order.status === 'pendingReview') {
      Alert.alert(
        t('screens.orders.reviewTitle'),
        t('screens.orders.reviewPrompt'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          ...([5, 4, 3, 2, 1] as const).map((stars) => ({
            text: t('screens.orders.reviewStars', { count: stars }),
            onPress: () => {
              void (async () => {
                try {
                  await submitOrderReview(order, stars, isLoggedIn);
                  toast(t('toast.reviewSubmitted'));
                  refresh();
                } catch {
                  toast(t('toast.orderActionFailed'));
                }
              })();
            },
          })),
        ],
      );
      return;
    }
    if (order.status === 'completed') {
      try {
        const review = await fetchOrderReview(order.id, isLoggedIn);
        Alert.alert(
          t('screens.orders.reviewTitle'),
          review.comment?.trim()
            ? t('screens.orders.reviewDetail', { stars: review.rating, comment: review.comment })
            : t('screens.orders.reviewStarsOnly', { count: review.rating }),
        );
      } catch {
        toast(t('toast.reviewNotFound'));
      }
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

  const handleCancelOrder = async (order: (typeof visibleOrders)[number]) => {
    try {
      await cancelOrder(order, isLoggedIn);
      toast(t('toast.orderCancelled'));
      refresh();
    } catch {
      toast(t('toast.orderActionFailed'));
    }
  };

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
          const display = orderDisplay(order.status, t);
          return (
          <AmazingSurface key={order.id} style={styles.orderItem}>
            <View style={styles.orderTop}>
              <Text style={styles.orderTopStrong}>{display.statusTitle}</Text>
              <Text style={{ color: display.statusColor, fontWeight: fonts.weights.bold }}>
                {display.statusSub}
              </Text>
            </View>
            <View style={styles.orderMid}>
              <OrderThumb imageUrl={order.imageUrl} />
              <View style={styles.orderInfo}>
                <Text style={styles.orderTitle} numberOfLines={2}>
                  {order.title}
                </Text>
                <Text style={styles.orderSub} numberOfLines={1}>
                  {order.sellerName}
                </Text>
                <Text style={styles.price}>
                  {t('common.currencyPrefix')}
                  {order.amount}
                </Text>
              </View>
            </View>
            <View style={styles.orderActions}>
              <Pressable
                style={styles.orderBtn}
                onPress={() =>
                  openChat({
                    listingId: order.listingId,
                    counterpartName: order.sellerName,
                    listingTitle: order.title,
                  })
                }
              >
                <Text style={styles.orderBtnText} numberOfLines={1}>
                  {t('screens.orders.contactSeller')}
                </Text>
              </Pressable>
              {display.secondaryLabel ? (
              <Pressable
                style={[styles.orderBtn, display.secondaryIsBrand && styles.orderBtnYellow]}
                onPress={() => handleSecondaryAction(order)}
              >
                <Text style={styles.orderBtnText} numberOfLines={1}>
                  {display.secondaryLabel}
                </Text>
              </Pressable>
              ) : null}
            </View>
            {order.status === 'pendingPay' ? (
              <Pressable onPress={() => void handleCancelOrder(order)} style={styles.cancelLink}>
                <Text style={styles.cancelLinkText}>{t('screens.orders.cancelOrder')}</Text>
              </Pressable>
            ) : null}
          </AmazingSurface>
          );
        })
      ) : (
        <EmptyState text={t('screens.orders.emptyFilter')} />
      )}
    </ScreenScroll>
  );
}

export function SoldScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady, toast } = useApp();
  const { orders, loading, error, shipOrder, releaseOrder, refresh } = useSellerOrders('all', isLoggedIn, authReady);

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

  return (
    <ScreenScroll screenId="sold">
      <TitleBar center={t('screens.sold.title')} />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <>
          <EmptyState text={t('screens.sold.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : orders.length ? (
        orders.map((order) => {
          const display = sellerOrderDisplay(order.status, t);
          const sellerAction = sellerActionForStatus(order.status);
          const actionHandler =
            sellerAction === 'ship' ? handleShip : sellerAction === 'release' ? handleRelease : null;
          return (
            <AmazingSurface key={order.id} style={styles.orderItem}>
              <View style={styles.orderTop}>
                <Text style={[styles.orderTopStrong, { color: display.statusColor }]}>
                  {display.statusTitle}
                </Text>
                <Text style={styles.price}>
                  {t('common.currencyPrefix')}
                  {order.amount}
                </Text>
              </View>
              <View style={styles.orderMid}>
                <OrderThumb imageUrl={order.imageUrl} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle} numberOfLines={2}>
                    {order.title}
                  </Text>
                  {order.buyerName ? (
                    <Text style={styles.orderSub}>
                      {t('screens.sold.buyerLine', { name: order.buyerName })}
                    </Text>
                  ) : null}
                  <Text style={styles.orderSub}>{display.statusSub}</Text>
                </View>
              </View>
              {display.secondaryLabel && actionHandler ? (
                <PillButton
                  label={display.secondaryLabel}
                  variant="brand"
                  full
                  onPress={() => void actionHandler(order)}
                />
              ) : null}
            </AmazingSurface>
          );
        })
      ) : (
        <EmptyState text={t('screens.sold.empty')} />
      )}
    </ScreenScroll>
  );
}

export function MyListingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { requireAuthNav, isLoggedIn, authReady, toast, openDetail, products, user } = useApp();
  const [statusIndex, setStatusIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const statuses: Array<'active' | 'draft' | 'inactive' | undefined> = ['active', 'draft', 'inactive'];
  const status = statuses[statusIndex];
  const { listings, loading, error, refresh } = useMyListings(status, isLoggedIn, authReady);
  const productListings = useMemo(
    () => listings.filter((listing) => listing.listingType !== 'service'),
    [listings],
  );

  const openListingDetail = useCallback(
    (listing: UiListing) => {
      const fromCatalog = products.find((p) => p.id === listing.id);
      openDetail(fromCatalog ?? uiListingToProduct(listing, user?.id, user?.nickname));
    },
    [openDetail, products, user?.id, user?.nickname],
  );

  const confirmDeleteListing = useCallback(
    (listingId: number, title: string) => {
      Alert.alert(t('screens.myListings.deleteTitle'), t('screens.myListings.deleteBody', { title }), [
        { text: t('screens.myListings.cancel'), style: 'cancel' },
        {
          text: t('screens.myListings.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setDeletingId(listingId);
            void deleteListing(listingId, isLoggedIn)
              .then(() => {
                toast(t('toast.listingDeleted'));
                refresh();
              })
              .catch(() => toast(t('toast.listingDeleteFailed')))
              .finally(() => setDeletingId(null));
          },
        },
      ]);
    },
    [isLoggedIn, refresh, t, toast],
  );

  const openEditListing = useCallback(
    (listing: UiListing) => {
      if (listing.listingType === 'bundle') {
        router.push(`/publish/bundle?mode=edit&listingId=${listing.id}`);
        return;
      }
      if (listing.listingType === 'service') {
        router.push(`/publish/service?mode=edit&listingId=${listing.id}`);
        return;
      }
      if (listing.listingType && listing.listingType !== 'product') {
        toast(t('toast.editListingTypeUnsupported'));
        return;
      }
      router.push(`/publish/product?mode=edit&listingId=${listing.id}`);
    },
    [t, toast],
  );

  const relistListing = useCallback(
    (listingId: number) => {
      void updateListing(listingId, { status: 'active' }, isLoggedIn)
        .then(() => {
          toast(t('toast.listingRelisted'));
          refresh();
        })
        .catch(() => toast(t('toast.publishFailed')));
    },
    [isLoggedIn, refresh, t, toast],
  );

  return (
    <ScreenScroll screenId="myListings">
      <TitleBar center={t('screens.myListings.title')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[t('screens.myListings.active'), t('screens.myListings.draft'), t('screens.myListings.inactive')].map((chip, i) => (
          <Pressable key={chip} style={[styles.chip, i === statusIndex && styles.chipActive]} onPress={() => setStatusIndex(i)}>
            <Text style={[styles.chipText, i === statusIndex && styles.chipTextActive]} numberOfLines={1}>
              {chip}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <>
          <EmptyState text={t('screens.myListings.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : productListings.length ? (
        productListings.map((listing) => (
          <AmazingSurface key={listing.id} style={styles.orderItem}>
            <View style={styles.listingRow}>
              <Pressable
                style={styles.listingTapArea}
                onPress={() => openListingDetail(listing)}
                accessibilityRole="button"
              >
                <View style={styles.orderMid}>
                  <OrderThumb imageUrl={listing.imageUrl} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <Text style={styles.price}>
                      {t('common.currencyPrefix')}
                      {listing.price}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {status === 'inactive' ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => relistListing(listing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.relistA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="upload" size={18} color={colors.sub} />
                </Pressable>
              ) : listing.listingType === 'product' || listing.listingType === 'bundle' || !listing.listingType ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => openEditListing(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.editA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="edit" size={18} color={colors.sub} />
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.deleteBtn, deletingId === listing.id && styles.deleteBtnDisabled]}
                onPress={() => confirmDeleteListing(listing.id, listing.title)}
                disabled={deletingId === listing.id}
                accessibilityRole="button"
                accessibilityLabel={t('screens.myListings.deleteA11y')}
                hitSlop={8}
              >
                <AppIcon name="trash" size={18} color={colors.sub} />
              </Pressable>
            </View>
          </AmazingSurface>
        ))
      ) : (
        <EmptyState text={t('screens.myListings.empty')} />
      )}
      <PillButton label={t('screens.myListings.goPublish')} variant="brand" full onPress={() => requireAuthNav('publish')} />
    </ScreenScroll>
  );
}

export function MyServicesScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { requireAuthNav, isLoggedIn, authReady, toast, openDetail, products, user } = useApp();
  const [statusIndex, setStatusIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const statuses: Array<'active' | 'draft' | 'inactive' | undefined> = ['active', 'draft', 'inactive'];
  const status = statuses[statusIndex];
  const { listings, loading, error, refresh } = useMyListings(status, isLoggedIn, authReady);
  const serviceListings = useMemo(
    () => listings.filter((listing) => listing.listingType === 'service'),
    [listings],
  );

  const openListingDetail = useCallback(
    (listing: UiListing) => {
      const fromCatalog = products.find((p) => p.id === listing.id);
      openDetail(fromCatalog ?? uiListingToProduct(listing, user?.id, user?.nickname));
    },
    [openDetail, products, user?.id, user?.nickname],
  );

  const openEditService = useCallback((listing: UiListing) => {
    router.push(`/publish/service?mode=edit&listingId=${listing.id}`);
  }, []);

  const relistListing = useCallback(
    (listingId: number) => {
      void updateListing(listingId, { status: 'active' }, isLoggedIn)
        .then(() => {
          toast(t('toast.listingRelisted'));
          refresh();
        })
        .catch(() => toast(t('toast.publishFailed')));
    },
    [isLoggedIn, refresh, t, toast],
  );

  const confirmDeleteListing = useCallback(
    (listingId: number, title: string) => {
      Alert.alert(t('screens.myListings.deleteTitle'), t('screens.myListings.deleteBody', { title }), [
        { text: t('screens.myListings.cancel'), style: 'cancel' },
        {
          text: t('screens.myListings.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setDeletingId(listingId);
            void deleteListing(listingId, isLoggedIn)
              .then(() => {
                toast(t('toast.listingDeleted'));
                refresh();
              })
              .catch(() => toast(t('toast.listingDeleteFailed')))
              .finally(() => setDeletingId(null));
          },
        },
      ]);
    },
    [isLoggedIn, refresh, t, toast],
  );

  return (
    <ScreenScroll screenId="myServices">
      <TitleBar center={t('screens.myServices.title')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[t('screens.myListings.active'), t('screens.myListings.draft'), t('screens.myListings.inactive')].map((chip, i) => (
          <Pressable key={chip} style={[styles.chip, i === statusIndex && styles.chipActive]} onPress={() => setStatusIndex(i)}>
            <Text style={[styles.chipText, i === statusIndex && styles.chipTextActive]} numberOfLines={1}>
              {chip}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <>
          <EmptyState text={t('screens.myListings.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : serviceListings.length ? (
        serviceListings.map((listing) => (
          <AmazingSurface key={listing.id} style={styles.orderItem}>
            <View style={styles.listingRow}>
              <Pressable
                style={styles.listingTapArea}
                onPress={() => openListingDetail(listing)}
                accessibilityRole="button"
              >
                <View style={styles.orderMid}>
                  <OrderThumb imageUrl={listing.imageUrl} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <Text style={styles.price}>
                      {t('common.currencyPrefix')}
                      {listing.price}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {status === 'inactive' ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => relistListing(listing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.relistA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="upload" size={18} color={colors.sub} />
                </Pressable>
              ) : (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => openEditService(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.editA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="edit" size={18} color={colors.sub} />
                </Pressable>
              )}
              <Pressable
                style={[styles.deleteBtn, deletingId === listing.id && styles.deleteBtnDisabled]}
                onPress={() => confirmDeleteListing(listing.id, listing.title)}
                disabled={deletingId === listing.id}
                accessibilityRole="button"
                accessibilityLabel={t('screens.myListings.deleteA11y')}
                hitSlop={8}
              >
                <AppIcon name="trash" size={18} color={colors.sub} />
              </Pressable>
            </View>
          </AmazingSurface>
        ))
      ) : (
        <EmptyState text={t('screens.myServices.empty')} />
      )}
      <TableNote>{t('screens.myServices.note')}</TableNote>
      <PillButton label={t('screens.myServices.publish')} variant="brand" full onPress={() => requireAuthNav('publishService')} />
    </ScreenScroll>
  );
}

export function FavoritesScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { openDetail, isLoggedIn, favs } = useApp();
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
  const { openDetail, region, isLoggedIn } = useApp();
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
  const { follows, toggleFollow, openSellerProfile, isLoggedIn } = useApp();
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
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { coupons, loading } = useCoupons(isLoggedIn, authReady);

  const handleUseCoupon = () => {
    toast(t('screens.coupons.useAtCheckout'));
    router.push('/');
  };

  return (
    <ScreenScroll screenId="coupons">
      <TitleBar center={t('screens.coupons.title')} />
      {loading ? (
        <LoadingState compact />
      ) : coupons.length ? (
        coupons.map((coupon) => {
          const used = coupon.status !== 'available';
          return (
            <AmazingSurface key={coupon.id} style={styles.coupon}>
              <View>
                <Text style={styles.couponAmt}>
                  {t('common.currencyPrefix')}
                  {coupon.amount}
                </Text>
                <Text style={styles.couponSub}>{coupon.description}</Text>
              </View>
              <Pressable
                style={[styles.couponBtn, used && styles.couponBtnUsed]}
                onPress={() => handleUseCoupon()}
                disabled={used}
              >
                <Text style={[styles.couponBtnText, used && styles.couponBtnTextUsed]}>
                  {used ? t('screens.coupons.used') : t('screens.coupons.use')}
                </Text>
              </Pressable>
            </AmazingSurface>
          );
        })
      ) : (
        <EmptyState text={t('screens.coupons.empty')} />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 4,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.brand3,
    borderColor: colors.brand,
  },
  chipText: {
    fontWeight: fonts.weights.bold,
    color: '#555555',
    fontSize: 11,
  },
  chipTextActive: {
    color: colors.text,
  },
  orderItem: {
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTopStrong: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  orderMid: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listingTapArea: {
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
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
  price: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 16,
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
  },
  orderBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#f5f5f5',
    flexShrink: 1,
    minWidth: 0,
  },
  orderBtnYellow: {
    backgroundColor: colors.brand,
  },
  orderBtnText: {
    fontWeight: fonts.weights.bold,
    fontSize: 11,
    color: colors.text,
  },
  cancelLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  followProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  followBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  followName: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  followSub: {
    marginTop: 5,
    color: '#888888',
    fontSize: 12,
  },
  coupon: {
    backgroundColor: '#fff4f4',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponAmt: {
    fontSize: 24,
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  couponSub: {
    color: '#777777',
    fontSize: 12,
  },
  couponBtn: {
    borderRadius: radius.pill,
    backgroundColor: '#ef233c',
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  couponBtnUsed: {
    backgroundColor: '#ececec',
  },
  couponBtnText: {
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
  },
  couponBtnTextUsed: {
    color: '#999999',
  },
});
