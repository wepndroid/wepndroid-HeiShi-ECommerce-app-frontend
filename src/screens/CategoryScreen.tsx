import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { serviceDetailProduct } from '../data/detailProducts';
import type { LocalService } from '../data/services';
import { serviceMatchesCategory } from '../data/services';
import { useCatalogServices } from '../hooks/useCatalogServices';
import { useFeed } from '../hooks/useFeed';
import {
  LOCAL_CATEGORY_SHORTCUTS,
  HomeCategoryShortcutRow,
} from '../components/HomeCategoryShortcutRow';
import {
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../components/UI';
import { Banner, ProductFeed, ServiceCard } from '../components/ProductUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { localPageBannerForLanguage } from '../assets/localBanner';
import { ProductCatKey } from '../types';
import { fonts, radius } from '../theme';

export function CategoryScreen() {
  const { t, i18n } = useTranslation();
  const { openSearch, openDetail, region, products } = useApp();
  const { services: visibleServices } = useCatalogServices(region);
  const [selectedCategory, setSelectedCategory] = useState<ProductCatKey | null>(null);
  const { items: categoryProducts } = useFeed(region, 'recommended', selectedCategory);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return visibleServices;
    return visibleServices.filter((service) => serviceMatchesCategory(service, selectedCategory));
  }, [visibleServices, selectedCategory]);

  const openServiceDetail = (service: LocalService) => {
    openDetail(
      serviceDetailProduct(service, service.imageUrl ?? products[0]?.imageUrl ?? ''),
    );
  };

  const selectCategory = (catKey: ProductCatKey) => {
    setSelectedCategory((current) => (current === catKey ? null : catKey));
  };

  return (
    <ScreenScroll screenId="category">
      <TitleBar title={t('nav.category')} />
      <SearchBar
        placeholder={t('screens.category.searchPlaceholder')}
        readonly
        onPress={openSearch}
      />
      <Banner
        variant="promo"
        artwork
        artworkSource={localPageBannerForLanguage(i18n.language)}
        title={t('screens.category.bannerTitle')}
        subtitle={t('screens.category.bannerSubtitle')}
      />
      <SectionHead title={t('screens.category.sectionCategories')} />
      <HomeCategoryShortcutRow
        categories={LOCAL_CATEGORY_SHORTCUTS}
        selectedKey={selectedCategory}
        onSelect={selectCategory}
        layout="spread"
        contentStyle={styles.catRowContent}
      />
      <SectionHead title={t('screens.category.sectionProducts')} />
      {categoryProducts.length ? (
        <ProductFeed data={categoryProducts} onPress={openDetail} />
      ) : (
        <AmazingSurface style={styles.empty}>
          <Text style={styles.emptyText}>{t('screens.category.emptyProducts')}</Text>
        </AmazingSurface>
      )}
      <SectionHead title={t('screens.category.sectionServices')} action={t('screens.category.featured')} />
      {filteredServices.length ? (
        filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => openServiceDetail(service)}
          />
        ))
      ) : (
        <AmazingSurface style={styles.empty}>
          <Text style={styles.emptyText}>{t('screens.category.emptyServices')}</Text>
        </AmazingSurface>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  catRowContent: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  empty: {
    borderStyle: 'dashed',
    borderColor: '#e6dfc8',
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8a7a54',
    fontSize: 13,
    fontWeight: fonts.weights.bold,
  },
});
