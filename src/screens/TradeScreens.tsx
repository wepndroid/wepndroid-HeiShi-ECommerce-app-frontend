import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { ORDER_FILTERS } from '../data/orders';
import { productImageUrl } from '../data/productImages';
import { useHistoryProducts } from '../hooks/useHistory';
import { useMyListings } from '../hooks/useMyListings';
import { useOrders } from '../hooks/useOrders';
import { regionProducts } from '../hooks/useProductFilters';
import { useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { ListCard, TableNote } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { OrderThumb, ProductGrid } from '../components/ProductUI';
import { PillButton, ScreenScroll, TitleBar } from '../components/UI';
import { colors, fonts, radius } from '../theme';
import { OrderFilterKey, OrderStatus } from '../types';

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
  secondaryLabel: string;
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
        secondaryIsBrand: true,
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
        secondaryLabel: t('screens.orders.viewReview'),
        secondaryToastKey: 'toast.viewReview',
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
  }
}

export function OrdersScreen() {
  const { t } = useTranslation();
  const { products, requireAuthNav, toast, openChat, isLoggedIn, authReady } = useApp();
  const [activeFilter, setActiveFilter] = useState<OrderFilterKey>('all');
  const localizedProducts = useLocalizedProducts(products);

  const resolveTitle = useMemo(
    () => (productId: number) =>
      localizedProducts.find((p) => p.id === productId)?.title ?? '',
    [localizedProducts],
  );
  const resolveSeller = useMemo(
    () => (productId: number) =>
      localizedProducts.find((p) => p.id === productId)?.seller ?? '',
    [localizedProducts],
  );

  const { orders: visibleOrders, runAction } = useOrders(
    activeFilter,
    isLoggedIn,
    authReady,
    products,
    (product) => resolveTitle(product.id),
    (product) => resolveSeller(product.id),
  );

  const handleSecondaryAction = async (order: (typeof visibleOrders)[number]) => {
    const display = orderDisplay(order.status, t);
    if (order.status === 'pendingReview' || order.status === 'completed') {
      toast(t(display.secondaryToastKey));
      return;
    }
    try {
      await runAction(order);
      toast(t(display.secondaryToastKey));
    } catch {
      toast(t('toast.checkoutFailed'));
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
      {visibleOrders.length ? (
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
              <Pressable
                style={[styles.orderBtn, display.secondaryIsBrand && styles.orderBtnYellow]}
                onPress={() => handleSecondaryAction(order)}
              >
                <Text style={styles.orderBtnText} numberOfLines={1}>
                  {display.secondaryLabel}
                </Text>
              </Pressable>
            </View>
          </AmazingSurface>
          );
        })
      ) : (
        <AmazingSurface style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('screens.orders.emptyFilter')}</Text>
        </AmazingSurface>
      )}
    </ScreenScroll>
  );
}

export function SoldScreen() {
  const { t } = useTranslation();
  return (
    <ScreenScroll screenId="sold">
      <TitleBar center={t('screens.sold.title')} />
      <AmazingSurface style={styles.orderItem}>
        <View style={styles.orderTop}>
          <Text style={styles.orderTopStrong}>{t('common.completed')}</Text>
          <Text style={styles.price}>A$50</Text>
        </View>
        <View style={styles.orderMid}>
          <OrderThumb imageUrl={productImageUrl(12)} />
          <View>
            <Text style={styles.orderTitle}>{t('products.items.12.title')}</Text>
            <Text style={styles.orderSub}>{t('screens.sold.buyerConfirmed')}</Text>
          </View>
        </View>
      </AmazingSurface>
    </ScreenScroll>
  );
}

export function MyListingsScreen() {
  const { t } = useTranslation();
  const { requireAuthNav, isLoggedIn, authReady } = useApp();
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses: Array<'active' | 'draft' | 'inactive' | undefined> = ['active', 'draft', 'inactive'];
  const status = statuses[statusIndex];
  const { listings } = useMyListings(status, isLoggedIn, authReady);

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
      {listings.length ? (
        listings.map((listing) => (
          <AmazingSurface key={listing.id} style={styles.orderItem}>
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
          </AmazingSurface>
        ))
      ) : (
        <TableNote>{t('screens.myListings.empty')}</TableNote>
      )}
      <PillButton label={t('screens.myListings.goPublish')} variant="brand" full onPress={() => requireAuthNav('publish')} />
    </ScreenScroll>
  );
}

export function MyServicesScreen() {
  const { t } = useTranslation();
  const { requireAuthNav } = useApp();
  return (
    <ScreenScroll screenId="myServices">
      <TitleBar center={t('screens.myServices.title')} />
      <TableNote>{t('screens.myServices.note')}</TableNote>
      <PillButton label={t('screens.myServices.publish')} variant="brand" full onPress={() => requireAuthNav('publishService')} />
    </ScreenScroll>
  );
}

export function FavoritesScreen() {
  const { t } = useTranslation();
  const { favs, products, region, openDetail, favCount } = useApp();
  const data = useMemo(
    () => regionProducts(products.filter((p) => favs.has(p.id)), region),
    [products, favs, region],
  );

  return (
    <ScreenScroll screenId="favorites">
      <TitleBar center={t('screens.favorites.title', { count: favCount })} />
      <ProductGrid data={data} onPress={openDetail} />
    </ScreenScroll>
  );
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const { openDetail, region, isLoggedIn } = useApp();
  const { items: data } = useHistoryProducts(region, isLoggedIn);

  return (
    <ScreenScroll screenId="history">
      <TitleBar center={t('screens.history.title')} />
      <ProductGrid data={data} onPress={openDetail} />
    </ScreenScroll>
  );
}

export function FollowingScreen() {
  const { t } = useTranslation();
  const rows = [
    { nameKey: 'screens.following.miaName', subKey: 'screens.following.mia' },
    { nameKey: 'screens.following.shopName', subKey: 'screens.following.shop' },
  ];

  return (
    <ScreenScroll screenId="following">
      <TitleBar center={t('screens.following.title')} />
      <ListCard>
        {rows.map((row, index) => (
          <View key={row.nameKey} style={[styles.followRow, index < rows.length - 1 && styles.followBorder]}>
            <View style={styles.followAvatar}>
              <Text style={styles.followAvatarText}>{t(row.nameKey).slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.followName}>{t(row.nameKey)}</Text>
              <Text style={styles.followSub}>{t(row.subKey)}</Text>
            </View>
            <PillButton label={t('screens.following.followingBtn')} variant="light" style={{ paddingVertical: 8, paddingHorizontal: 12 }} />
          </View>
        ))}
      </ListCard>
    </ScreenScroll>
  );
}

export function CouponsScreen() {
  const { t } = useTranslation();
  const { toast } = useApp();
  const coupons = [
    { amount: 'A$6', subKey: 'screens.coupons.c1' },
    { amount: 'A$3', subKey: 'screens.coupons.c2' },
    { amount: 'A$10', subKey: 'screens.coupons.c3' },
  ];

  return (
    <ScreenScroll screenId="coupons">
      <TitleBar center={t('screens.coupons.title')} />
      {coupons.map((coupon) => (
        <AmazingSurface key={coupon.amount} style={styles.coupon}>
          <View>
            <Text style={styles.couponAmt}>{coupon.amount}</Text>
            <Text style={styles.couponSub}>{t(coupon.subKey)}</Text>
          </View>
          <Pressable style={styles.couponBtn} onPress={() => toast(t('toast.couponUsed'))}>
            <Text style={styles.couponBtnText}>{t('screens.coupons.use')}</Text>
          </Pressable>
        </AmazingSurface>
      ))}
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
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.brand,
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
    flexDirection: 'row',
    gap: 10,
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
    color: colors.red,
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
  emptyState: {
    borderStyle: 'dashed',
    borderColor: '#e6dfc8',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyStateText: {
    color: '#8a7a54',
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    textAlign: 'center',
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  followBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  followAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff1c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followAvatarText: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
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
    fontSize: 30,
    color: colors.red,
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
  couponBtnText: {
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
  },
});
