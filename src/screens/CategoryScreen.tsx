import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { serviceDetailProduct } from '../data/detailProducts';
import type { LocalService } from '../data/services';
import { useCatalogServices } from '../hooks/useCatalogServices';
import { AppIcon, AppIconName } from '../components/AppIcon';
import {
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../components/UI';
import { Banner, ServiceCard } from '../components/ProductUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { ProductCatKey } from '../types';
import { fonts, filterIconColor, filterIconLabelColor, filterIconTile, radius } from '../theme';

const SHORTCUTS: { icon: AppIconName; catKey: ProductCatKey; labelKey: string }[] = [
  { icon: 'phone', catKey: 'digital', labelKey: 'homeCats.digital' },
  { icon: 'sofa', catKey: 'home', labelKey: 'homeCats.home' },
  { icon: 'shirt', catKey: 'fashion', labelKey: 'homeCats.fashion' },
  { icon: 'sparkles', catKey: 'beauty', labelKey: 'homeCats.beauty' },
];

export function CategoryScreen() {
  const { t } = useTranslation();
  const { nav, openDetail, region, products, setHomeCategory, setHomeTabKey } = useApp();
  const { services: visibleServices } = useCatalogServices(region);

  const openServiceDetail = (service: LocalService) => {
    openDetail(serviceDetailProduct(service, products[0]?.imageUrl ?? ''));
  };

  const filterCat = (catKey: ProductCatKey) => {
    setHomeTabKey('recommended');
    setHomeCategory(catKey);
    nav('home');
  };

  return (
    <ScreenScroll screenId="category">
      <TitleBar title={t('nav.category')} />
      <SearchBar
        placeholder={t('screens.category.searchPlaceholder')}
        readonly
        onPress={() => nav('search')}
      />
      <Banner
        title={t('screens.category.bannerTitle')}
        subtitle={t('screens.category.bannerSubtitle')}
        icon="mapPin"
      />
      <SectionHead title={t('screens.category.sectionCategories')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {SHORTCUTS.map((item) => (
          <Pressable
            key={item.catKey}
            style={styles.shortcut}
            onPress={() => filterCat(item.catKey)}
          >
            <View style={styles.filterIco}>
              <AppIcon name={item.icon} size={24} color={filterIconColor} />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={2}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionHead title={t('screens.category.sectionServices')} action={t('screens.category.featured')} />
      {visibleServices.length ? (
        visibleServices.map((service) => (
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
  filterRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  shortcut: {
    minWidth: 56,
    alignItems: 'center',
    marginRight: 10,
  },
  filterIco: {
    width: 46,
    height: 46,
    borderRadius: 16,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...filterIconTile,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: filterIconLabelColor,
    textAlign: 'center',
  },
  empty: {
    borderStyle: 'dashed',
    borderColor: '#e6dfc8',
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8a7a54',
    fontSize: 13,
    fontWeight: fonts.weights.bold,
  },
});
