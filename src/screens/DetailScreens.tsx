import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { DELIVERY_OPTION_KEYS } from '../data/payments';
import { checkoutOrder } from '../services/ordersService';
import { ESCROW_FEE } from '../hooks/useProductFilters';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useRelatedListings } from '../hooks/useRelatedListings';
import { useSearch } from '../hooks/useSearch';
import { useLocalizedProduct } from '../hooks/useLocalizedProduct';
import {
  DetailCard,
  ListCard,
  ListRow,
  StickyActions,
} from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { ProductGrid, OrderThumb } from '../components/ProductUI';
import {
  Badge,
  IconButton,
  PillButton,
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../components/UI';
import { AppIcon } from '../components/AppIcon';
import { usePhotoSearch } from '../hooks/usePhotoSearch';
import { colors, fonts, radius } from '../theme';

export function SearchScreen() {
  const { t } = useTranslation();
  const { openDetail, region, searchValue, setSearchValue, toast } = useApp();
  const { results, suggestions } = useSearch(region, searchValue);
  const searchByPhoto = usePhotoSearch(toast);

  return (
    <ScreenScroll screenId="search">
      <TitleBar />
      <SearchBar
        placeholder={t('screens.search.defaultQuery')}
        value={searchValue}
        onChangeText={setSearchValue}
        onSubmit={() => toast(t('toast.search', { query: searchValue }))}
        showCamera
        onCameraPress={() => void searchByPhoto()}
      />
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
              toast(t('toast.quickSearch', { query: item.query }));
            }}
          >
            <View style={styles.sgImg}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
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
      <SectionHead
        title={t('screens.search.results')}
        action={t('common.tapForDetails')}
      />
      <ProductGrid data={results} onPress={openDetail} />
    </ScreenScroll>
  );
}

export function DetailScreen() {
  const { t } = useTranslation();
  const { nav, requireAuthNav, toast, currentItem, toggleFav, region, openDetail, openChat } =
    useApp();
  const item = useLocalizedProduct(currentItem);
  const related = useRelatedListings(currentItem.id, region);

  return (
    <ScreenScroll screenId="detail">
      <TitleBar right={<IconButton icon="heartOutline" onPress={toggleFav} />} />
      <View style={styles.detailHero}>
        <Image source={{ uri: item.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.loc}>
          <Text style={styles.locText}>{currentItem.loc}</Text>
        </View>
      </View>
      <DetailCard>
        <Text style={styles.detailPrice}>
          {item.pricePrefix}
          {currentItem.price}
        </Text>
        <Text style={styles.detailTitle}>{item.title}</Text>
        <View style={styles.badgeRow}>
          <Badge text={item.tag} />
          <Badge text={t('common.escrowSupported')} />
          <Badge text={t('common.negotiable')} />
        </View>
        <Text style={styles.detailDesc}>{item.desc}</Text>
      </DetailCard>
      <DetailCard>
        <View style={styles.sellerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.seller.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerName}>{item.seller}</Text>
            <Text style={styles.sellerSub}>{t('screens.detail.sellerMeta')}</Text>
          </View>
          <PillButton
            label={t('common.follow')}
            onPress={() => toast(t('toast.followedSeller'))}
            style={{ backgroundColor: '#fff1ce', paddingVertical: 10, paddingHorizontal: 14 }}
          />
        </View>
      </DetailCard>
      <DetailCard>
        <Text style={styles.cardH3}>{t('screens.detail.tradeProtection')}</Text>
        <Text style={styles.detailDesc}>{t('screens.detail.tradeProtectionBody')}</Text>
      </DetailCard>
      <SectionHead title={t('screens.detail.related')} action={t('screens.detail.relatedHint')} />
      <ProductGrid data={related} onPress={openDetail} />
      <StickyActions>
        <PillButton
          label={t('common.chat')}
          variant="light"
          onPress={() =>
            openChat({
              listingId: currentItem.id,
              counterpartName: item.seller,
              listingTitle: item.title,
            })
          }
        />
        <PillButton
          label={t('common.favorite')}
          variant="light"
          onPress={toggleFav}
        />
        <PillButton label={t('common.escrowOrder')} variant="brand" onPress={() => requireAuthNav('order')} />
      </StickyActions>
    </ScreenScroll>
  );
}

export function OrderScreen() {
  const { t } = useTranslation();
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
  } = useApp();
  useAuthGuard();
  const item = useLocalizedProduct(currentItem);
  const total = currentItem.price + ESCROW_FEE;
  const [submitting, setSubmitting] = useState(false);

  const showDeliveryPicker = () => {
    Alert.alert(
      t('screens.order.delivery'),
      undefined,
      DELIVERY_OPTION_KEYS.map((key) => ({
        text: t(key),
        onPress: () => setDeliveryMethod(t(key)),
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
    if (submitting) return;
    if (!deliveryMethod) {
      toast(t('toast.selectDelivery'));
      return;
    }
    setSubmitting(true);
    try {
      await checkoutOrder({
        listingId: currentItem.id,
        deliveryMethod,
        paymentMethodId,
        product: currentItem,
        title: item.title,
        sellerName: item.seller,
        isLoggedIn,
      });
      toast(t('toast.paySuccess'));
      setTimeout(() => nav('orders'), 700);
    } catch {
      toast(t('toast.checkoutFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll screenId="order">
      <TitleBar center={t('screens.order.title')} />
      <AmazingSurface style={styles.orderItem}>
        <View style={styles.orderMid}>
          <OrderThumb imageUrl={item.imageUrl} />
          <View style={{ flex: 1 }}>
            <Text style={styles.orderTitle}>{item.title}</Text>
            <Text style={styles.orderSub}>{t('screens.order.subtitle')}</Text>
            <Text style={styles.detailPrice}>
              {item.pricePrefix}
              {currentItem.price}
            </Text>
          </View>
        </View>
      </AmazingSurface>
      <ListCard>
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="location" size={16} color="#b87000" />
              <View>
                <Text style={styles.listMain}>{t('screens.order.delivery')}</Text>
                <Text style={styles.listSub}>{deliveryMethod}</Text>
              </View>
            </View>
          }
          right={<AppIcon name="chevronForward" size={16} color="#bbbbbb" />}
          onPress={showDeliveryPicker}
        />
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="shield" size={16} color="#b87000" />
              <View>
                <Text style={styles.listMain}>{t('screens.order.escrow')}</Text>
                <Text style={styles.listSub}>{t('screens.order.escrowSub')}</Text>
              </View>
            </View>
          }
          right={<Text style={styles.strong}>A$0.99</Text>}
        />
        <ListRow
          left={
            <View style={styles.listLeft}>
              <AppIcon name="pay" size={16} color="#b87000" />
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
              {currentItem.price.toFixed(2)}
            </Text>
          }
        />
        <ListRow
          left={<Text>{t('screens.order.escrowFee')}</Text>}
          right={<Text style={styles.strong}>A$0.99</Text>}
        />
        <ListRow
          left={<Text>{t('screens.order.total')}</Text>}
          right={
            <Text style={[styles.strong, { color: colors.red }]}>
              {item.pricePrefix}
              {total.toFixed(2)}
            </Text>
          }
          border={false}
        />
      </ListCard>
      <PillButton
        label={t('screens.order.confirmPay')}
        variant="brand"
        full
        onPress={handleCheckout}
      />
      <AmazingSurface style={styles.tableNoteShell}>
        <Text style={styles.tableNote}>{t('screens.order.demoNote')}</Text>
      </AmazingSurface>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  suggest: {
    width: '48%',
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sgImg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff2d3',
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
    color: '#888888',
    marginTop: 3,
  },
  detailHero: {
    height: 310,
    borderRadius: radius.xl,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  loc: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: fonts.weights.medium,
  },
  detailPrice: {
    fontSize: 28,
    color: colors.red,
    fontWeight: fonts.weights.bold,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 21,
    fontWeight: fonts.weights.bold,
    lineHeight: 26,
    marginBottom: 8,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555555',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffeec2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  sellerSub: {
    color: '#888888',
    marginTop: 2,
    fontSize: 12,
  },
  cardH3: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    marginBottom: 10,
    color: colors.text,
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
    color: '#999999',
    fontSize: 12,
    marginTop: 3,
  },
  strong: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  tableNoteShell: {
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  tableNote: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
});
