import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  ALL_AREAS,
  normalizeProfileCity,
  regionFromCityKey,
  regionLabel,
} from '../data/region';
import { serviceDetailProduct } from '../data/detailProducts';
import type { LocalService } from '../data/services';
import { serviceMatchesCategory } from '../data/services';
import { useCatalogServices } from '../hooks/useCatalogServices';
import { useFeed } from '../hooks/useFeed';
import { useUserProfile } from '../hooks/useUserProfile';
import { ProductCatKey } from '../types';
import {
  LOCAL_CATEGORY_SHORTCUTS,
  HomeCategoryShortcutRow,
} from '../components/HomeCategoryShortcutRow';
import {
  MarketScreenHeader,
  useInboxUnreadCount,
} from '../components/MarketScreenHeader';
import {
  ScreenScroll,
  SearchBar,
  SectionHead,
  LoadingState,
  EmptyState,
  PillButton,
} from '../components/UI';
import { Banner, ProductFeed, ServiceCard } from '../components/ProductUI';

const LOCAL_DEFAULT_CATEGORY: ProductCatKey = 'digital';
const LOCAL_ITEMS_PER_CATEGORY = 2;

export function CategoryScreen() {
  const { t } = useTranslation();
  const {
    openSearch,
    openDetail,
    requireAuthNav,
    isLoggedIn,
    authReady,
    products,
    user,
  } = useApp();
  const { profile } = useUserProfile(user, authReady);
  const inboxUnreadCount = useInboxUnreadCount(isLoggedIn, authReady);
  const localRegion = useMemo(() => {
    const cityKey = normalizeProfileCity(profile?.city);
    const { state, city } = regionFromCityKey(cityKey);
    return { state, city, area: ALL_AREAS };
  }, [profile?.city]);
  const localRegionLabel = useMemo(
    () => regionLabel(localRegion),
    [localRegion.state, localRegion.city, localRegion.area],
  );
  const {
    services: visibleServices,
    loading: servicesLoading,
  } = useCatalogServices(localRegion);
  const [selectedCategory, setSelectedCategory] = useState<ProductCatKey>(LOCAL_DEFAULT_CATEGORY);
  const {
    items: categoryProducts,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts,
  } = useFeed(localRegion, 'recommended', selectedCategory);

  const displayProducts = useMemo(
    () => categoryProducts.slice(0, LOCAL_ITEMS_PER_CATEGORY),
    [categoryProducts],
  );

  const displayServices = useMemo(() => {
    return visibleServices
      .filter((service) => serviceMatchesCategory(service, selectedCategory))
      .slice(0, LOCAL_ITEMS_PER_CATEGORY);
  }, [visibleServices, selectedCategory]);

  const openServiceDetail = (service: LocalService) => {
    openDetail(
      serviceDetailProduct(service, service.imageUrl ?? products[0]?.imageUrl ?? ''),
    );
  };

  const selectCategory = (catKey: ProductCatKey) => {
    setSelectedCategory(catKey);
  };

  return (
    <ScreenScroll screenId="category">
      <MarketScreenHeader
        regionLabelText={localRegionLabel}
        unreadCount={inboxUnreadCount}
        onMessagesPress={() => requireAuthNav('messages')}
        onSettingsPress={() => requireAuthNav('settings')}
      />
      <SearchBar
        placeholder={t('screens.category.searchPlaceholder')}
        readonly
        onPress={openSearch}
      />
      <Banner
        variant="local"
        title={t('screens.category.bannerTitle')}
        subtitle={t('screens.category.bannerSubtitle', { city: localRegionLabel })}
        badge={t('screens.category.bannerBadge')}
      />
      <SectionHead title={t('screens.category.sectionCategories')} compact />
      <HomeCategoryShortcutRow
        categories={LOCAL_CATEGORY_SHORTCUTS}
        selectedKey={selectedCategory}
        onSelect={selectCategory}
        layout="spread"
        contentStyle={styles.catRowContent}
      />
      <SectionHead title={t('screens.category.sectionProducts')} compact />
      {productsLoading && !displayProducts.length ? (
        <LoadingState compact />
      ) : productsError ? (
        <>
          <EmptyState text={t('home.feedError')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={reloadProducts} />
        </>
      ) : displayProducts.length ? (
        <ProductFeed data={displayProducts} onPress={openDetail} />
      ) : (
        <EmptyState text={t('screens.category.emptyProducts')} />
      )}
      <SectionHead title={t('screens.category.sectionServices')} compact />
      {servicesLoading && !displayServices.length ? (
        <LoadingState compact />
      ) : displayServices.length ? (
        displayServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => openServiceDetail(service)}
          />
        ))
      ) : (
        <EmptyState text={t('screens.category.emptyServices')} />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  catRowContent: {
    marginBottom: 0,
    paddingBottom: 0,
  },
});
