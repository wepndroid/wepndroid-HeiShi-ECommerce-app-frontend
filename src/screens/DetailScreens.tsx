import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { ConfirmPaymentButton } from '../components/ConfirmPaymentButton';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { checkoutOrder } from '../services/ordersService';
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
import {
  Badge,
  IconButton,
  PillButton,
  followPillStyle,
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../components/UI';
import { AppIcon } from '../components/AppIcon';
import { usePhotoSearch } from '../hooks/usePhotoSearch';
import { demoBundleMeta } from '../data/bundle';
import { BUNDLE_DETAIL_ID } from '../data/detailProducts';
import { BundleDetailSection } from '../components/BundleUI';
import { colors, fonts, radius } from '../theme';

export function SearchScreen() {
  const { t } = useTranslation();
  const {
    openDetail,
    region,
    searchValue,
    setSearchValue,
    toast,
    imageSearchResults,
    imageSearchPreviewUri,
    imageSearchLoading,
    clearImageSearch,
  } = useApp();
  const { results, suggestions, loading, isImageMode } = useSearch(
    region,
    searchValue,
    imageSearchResults,
    imageSearchLoading,
  );
  const searchByPhoto = usePhotoSearch();

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
        </>
      ) : null}
      <SectionHead
        title={isImageMode ? t('screens.search.imageResults') : t('screens.search.results')}
        action={t('common.tapForDetails')}
      />
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.loadingText}>{t('screens.search.searching')}</Text>
        </View>
      ) : (
        <ProductGrid data={results} onPress={openDetail} />
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
    region,
    openDetail,
    openSellerProfile,
    openChat,
  } = useApp();
  const item = useLocalizedProduct(currentItem);
  const related = useRelatedListings(currentItem.id, region);
  const isFav = favs.has(currentItem.id);
  const isFollowing = isFollowingSeller(currentItem.sellerKey);
  const stickyBarInset = useStickyActionsBarInset();
  const favoriteCount = currentItem.favoriteCount ?? 0;
  const galleryImages = resolveProductImages(currentItem);
  const bundleMeta =
    currentItem.bundleMeta ??
    (currentItem.listingType === 'bundle' || currentItem.id === BUNDLE_DETAIL_ID
      ? demoBundleMeta()
      : null);

  return (
    <View style={styles.detailShell}>
      <ScreenScroll screenId="detail" contentBottomInset={stickyBarInset}>
      <TitleBar
        right={
          <IconButton
            icon={isFav ? 'heart' : 'heartOutline'}
            onPress={toggleFav}
            active={isFav}
          />
        }
      />
      <DetailImageGallery
        key={currentItem.id}
        images={galleryImages}
        locationLabel={currentItem.loc}
      />
      <DetailCard>
        {bundleMeta ? (
          <BundleDetailSection meta={bundleMeta} />
        ) : (
          <>
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
          </>
        )}
        <Text style={styles.detailDesc}>{item.desc}</Text>
      </DetailCard>
      <DetailCard>
        <SellerAuthorRow
          sellerKey={currentItem.sellerKey}
          seller={item.seller}
          avatarUrl={currentItem.sellerAvatarUrl}
          subtitle={t('screens.detail.sellerMeta')}
          onPress={() => openSellerProfile(currentItem.sellerKey)}
          action={
            <PillButton
              label={isFollowing ? t('common.following') : t('common.follow')}
              variant={isFollowing ? 'brand' : 'light'}
              onPress={() => void toggleFollow(currentItem.sellerKey)}
              style={followPillStyle}
            />
          }
        />
      </DetailCard>
      <DetailCard>
        <Text style={styles.cardH3}>{t('screens.detail.tradeProtection')}</Text>
        <Text style={styles.detailDesc}>{t('screens.detail.tradeProtectionBody')}</Text>
      </DetailCard>
      <SectionHead title={t('screens.detail.related')} action={t('screens.detail.relatedHint')} />
      <ProductGrid data={related} onPress={openDetail} />
      </ScreenScroll>
      <StickyActions fixed>
        <DetailBottomBar
          leading={
            <DetailBottomIconAction
              icon={isFav ? 'heart' : 'heartOutline'}
              label={String(favoriteCount)}
              active={isFav}
              onPress={toggleFav}
              accessibilityLabel={
                isFav ? t('common.a11y.unfavorite') : t('common.a11y.favorite')
              }
            />
          }
          trailing={
            <View style={styles.detailActionsRight}>
              <PillButton
                label={t('common.checkout')}
                variant="light"
                onPress={() => requireAuthNav('order')}
                style={styles.detailBuyBtn}
              />
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
  } = useApp();
  useAuthGuard();
  const { options } = useFormOptions();
  const item = useLocalizedProduct(currentItem);
  const total = currentItem.price + ESCROW_FEE;
  const [submitting, setSubmitting] = useState(false);
  const deliveryLabel = findOptionLabel(options.deliveryMethods, deliveryMethod, i18n.language);

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
                <Text style={styles.listSub}>{deliveryLabel || t('common.placeholders.selectOption')}</Text>
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
          disabled={submitting}
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
    backgroundColor: colors.brand3,
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
    borderRadius: 16,
    backgroundColor: colors.paper,
  },
  imageSearchPreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.brand3,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 13,
    color: colors.sub,
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
    fontSize: 24,
    color: colors.red,
    fontWeight: fonts.weights.bold,
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: fonts.weights.bold,
    lineHeight: 22,
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.sub,
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
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
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
    color: colors.sub,
    lineHeight: 17,
  },
});
