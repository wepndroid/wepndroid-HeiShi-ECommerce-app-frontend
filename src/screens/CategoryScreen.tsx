import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useCatalogStore } from '../store/catalogStore';
import { useRegionStore, regionLabel } from '../store/regionStore';
import { openSearch, requireAuthNav } from '../store/navigation';
import { useHomeBanners } from '../hooks/useHomeBanners';
import { formatAreaLabel } from '../data/region';
import { serviceDetailProduct } from '../data/detailProducts';
import type { LocalService } from '../data/services';
import { useCatalogServices } from '../hooks/useCatalogServices';
import { useFeed } from '../hooks/useFeed';
import { cityHubTabToFeedTab, CityHubTabKey } from '../types';
import { MarketScreenHeader, useInboxUnreadCount } from '../components/MarketScreenHeader';
import {
  ScreenScroll,
  SearchBar,
  SectionHead,
  LoadingState,
  EmptyState,
  PillButton,
} from '../components/UI';
import { Text } from '../components/typography';
import { Banner, ProductFeed, ServiceCard } from '../components/ProductUI';
import { colors, fonts } from '../theme';

const CITY_HUB_TABS: CityHubTabKey[] = ['secondhand', 'services', 'jobs', 'rentals'];

export function CategoryScreen() {
  const { t } = useTranslation();
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const region = useRegionStore((s) => s.region);
  const openRegionSheet = useRegionStore((s) => s.openRegionSheet);
  const regionLabelText = regionLabel(region);
  const inboxUnreadCount = useInboxUnreadCount(isLoggedIn, authReady);
  const cmsBanner = useHomeBanners('category');
  const [activeTab, setActiveTab] = useState<CityHubTabKey>('secondhand');
  const feedTab = cityHubTabToFeedTab(activeTab);
  const {
    services: visibleServices,
    loading: servicesLoading,
  } = useCatalogServices(region);
  const {
    items: feedItems,
    loading: feedLoading,
    error: feedError,
    reload: reloadFeed,
  } = useFeed(region, feedTab, null);

  const sectionTitle = useMemo(() => {
    const areaSuffix =
      region.area && region.area !== '全部区域' ? ` · ${formatAreaLabel(region.area)}` : '';
    return t(`screens.category.section.${activeTab}`, { city: regionLabelText }) + areaSuffix;
  }, [activeTab, region.area, regionLabelText, t]);

  const openServiceDetail = (service: LocalService) => {
    openDetail(serviceDetailProduct(service, service.imageUrl ?? products[0]?.imageUrl ?? ''));
  };

  return (
    <ScreenScroll screenId="category">
      <MarketScreenHeader
        regionLabelText={regionLabelText}
        unreadCount={inboxUnreadCount}
        onRegionPress={openRegionSheet}
        onMessagesPress={() => requireAuthNav('messages')}
        onSettingsPress={() => requireAuthNav('settings')}
      />
      <SearchBar
        placeholder={t('screens.category.searchPlaceholder')}
        readonly
        onPress={openSearch}
      />
      <Banner
        variant={cmsBanner ? 'promo' : 'local'}
        title={cmsBanner?.title ?? t('screens.category.bannerTitle')}
        subtitle={
          t('screens.category.bannerSubtitle', { city: regionLabelText ?? '' })
        }
        badge={cmsBanner ? undefined : t('screens.category.bannerBadge')}
        artworkRemoteUri={cmsBanner?.imageUrl}
      />
      <SectionHead title={t('screens.category.sectionTypes')} compact />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeTabs}
      >
        {CITY_HUB_TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.typeChip, selected && styles.typeChipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>
                {t(`screens.category.types.${tab}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <SectionHead title={sectionTitle} compact />
      {activeTab === 'services' ? (
        servicesLoading && !visibleServices.length ? (
          <LoadingState compact />
        ) : visibleServices.length ? (
          visibleServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => openServiceDetail(service)}
            />
          ))
        ) : (
          <EmptyState text={t('screens.category.emptyServices')} />
        )
      ) : feedLoading && !feedItems.length ? (
        <LoadingState compact />
      ) : feedError ? (
        <>
          <EmptyState text={t('home.feedError')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={reloadFeed} />
        </>
      ) : feedItems.length ? (
        <ProductFeed data={feedItems} onPress={openDetail} />
      ) : (
        <EmptyState text={t(`screens.category.empty.${activeTab}`)} />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  typeTabs: {
    gap: 8,
    paddingBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f3f3',
  },
  typeChipActive: {
    backgroundColor: colors.brand,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.sub,
  },
  typeChipTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
});
