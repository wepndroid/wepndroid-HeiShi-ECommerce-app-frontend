import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { ALL_AREAS, formatAreaLabel } from '../data/region';
import { feedTitleKey, homeFilterForCategory } from '../hooks/useProductFilters';
import { AppIcon } from '../components/AppIcon';
import {
  IconButton,
  Logo,
  ScreenScroll,
  SearchBar,
  SectionHead,
} from '../components/UI';
import { Banner, ProductFeed } from '../components/ProductUI';
import {
  activeHomeCategoryKey,
  HOME_CATEGORY_SHORTCUTS,
  HomeCategoryShortcutRow,
} from '../components/HomeCategoryShortcutRow';
import { HomeTabKey, ProductCatKey } from '../types';
import { usePhotoSearch } from '../hooks/usePhotoSearch';
import { colors, fonts, amazingStylePill } from '../theme';

const HOME_TABS: HomeTabKey[] = [
  'recommended',
  'newArrivals',
  'digital',
  'services',
  'tickets',
];

const CATS = HOME_CATEGORY_SHORTCUTS;

export function HomeScreen() {
  const { t } = useTranslation();
  const {
    nav,
    openSearch,
    openDetail,
    homeFeed,
    homeTabKey,
    setHomeTabKey,
    setHomeCategory,
    homeCategory,
    region,
    regionLabelText,
    openRegionSheet,
    toast,
  } = useApp();
  const searchByPhoto = usePhotoSearch();

  const titleKey = feedTitleKey(homeTabKey, region);
  const feedTitle = t(
    titleKey,
    region.area === ALL_AREAS ? undefined : { area: formatAreaLabel(region.area) },
  );

  const handleTab = (key: HomeTabKey) => {
    setHomeTabKey(key);
    setHomeCategory(null);
  };

  const filterCat = (catKey: ProductCatKey) => {
    const { tab, category } = homeFilterForCategory(catKey, homeTabKey);
    setHomeTabKey(tab);
    setHomeCategory(category);
  };

  return (
    <ScreenScroll screenId="home">
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View style={styles.logoSlot}>
            <Logo />
          </View>
          <Pressable style={styles.city} onPress={openRegionSheet}>
            <AppIcon name="mapPin" size={14} color={colors.sub} />
            <Text style={styles.cityText} numberOfLines={1}>
              {regionLabelText} ▾
            </Text>
          </Pressable>
          <View style={styles.topRight}>
            <IconButton
              icon="messages"
              label={t('common.a11y.messages')}
              dot
              onPress={() => nav('messages')}
            />
            <IconButton
              icon="settings"
              label={t('common.a11y.settings')}
              onPress={() => nav('settings')}
            />
          </View>
        </View>
      </View>

      <SearchBar
        placeholder={t('home.searchPlaceholder')}
        readonly
        showCamera
        onPress={openSearch}
        onCameraPress={() => void searchByPhoto()}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {HOME_TABS.map((tab) => (
          <Pressable key={tab} style={styles.tabItem} onPress={() => handleTab(tab)}>
            <Text style={[styles.tabText, homeTabKey === tab && styles.tabTextActive]}>
              {t(`homeTabs.${tab}`)}
            </Text>
            {homeTabKey === tab ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        ))}
      </ScrollView>

      <HomeCategoryShortcutRow
        categories={CATS}
        selectedKey={activeHomeCategoryKey(homeTabKey, homeCategory)}
        onSelect={filterCat}
        contentStyle={styles.catRowContent}
      />

      <Banner
        variant="promo"
        artwork
        title={t('home.bannerTitle')}
        subtitle={t('home.bannerSubtitle')}
      />

      <SectionHead
        title={feedTitle}
        action={t('home.moreRecommend')}
        onAction={openSearch}
      />
      <ProductFeed
        data={homeFeed}
        onPress={openDetail}
        emptyText={t('home.emptyFeed')}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 2,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSlot: {
    flexShrink: 0,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  city: {
    ...amazingStylePill,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  tabs: {
    paddingVertical: 2,
    marginBottom: 0,
  },
  tabItem: {
    marginRight: 16,
    paddingBottom: 4,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: fonts.weights.medium,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  tabIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand,
    marginTop: 3,
  },
  catRowContent: {
    marginBottom: 12,
  },
});
