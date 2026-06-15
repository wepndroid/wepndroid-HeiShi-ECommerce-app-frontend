import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { ALL_AREAS, formatAreaLabel } from '../data/region';
import { feedTitleKey } from '../hooks/useProductFilters';
import { AppIcon, AppIconName } from '../components/AppIcon';
import {
  IconButton,
  Logo,
  ScreenScroll,
  SearchBar,
  SectionHead,
} from '../components/UI';
import { Banner, ProductFeed } from '../components/ProductUI';
import { HomeTabKey, ProductCatKey } from '../types';
import { colors, fonts, amazingStyleHighlight, amazingStylePill, filterIconColor, filterIconLabelColor, filterIconTile } from '../theme';

const HOME_TABS: HomeTabKey[] = [
  'recommended',
  'newArrivals',
  'digital',
  'services',
  'tickets',
];

const CATS: { icon: AppIconName; catKey: ProductCatKey; labelKey: string }[] = [
  { icon: 'phone', catKey: 'digital', labelKey: 'homeCats.digital' },
  { icon: 'sofa', catKey: 'home', labelKey: 'homeCats.home' },
  { icon: 'shirt', catKey: 'fashion', labelKey: 'homeCats.fashion' },
  { icon: 'sparkles', catKey: 'beauty', labelKey: 'homeCats.beauty' },
  { icon: 'headphones', catKey: 'misc', labelKey: 'homeCats.misc' },
];

export function HomeScreen() {
  const { t } = useTranslation();
  const {
    nav,
    openDetail,
    homeFeed,
    homeTabKey,
    setHomeTabKey,
    setHomeCategory,
    region,
    regionLabelText,
    openRegionSheet,
  } = useApp();

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
    setHomeTabKey('recommended');
    setHomeCategory(catKey);
  };

  return (
    <ScreenScroll screenId="home">
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View style={styles.logoSlot}>
            <Logo />
          </View>
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
        <Pressable style={styles.city} onPress={openRegionSheet}>
          <View style={amazingStyleHighlight} pointerEvents="none" />
          <AppIcon name="mapPin" size={14} color={colors.sub} />
          <Text style={styles.cityText} numberOfLines={1}>
            {regionLabelText} ▾
          </Text>
        </Pressable>
      </View>

      <SearchBar
        placeholder={t('home.searchPlaceholder')}
        readonly
        showCamera
        onPress={() => nav('search')}
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATS.map((cat) => (
          <Pressable key={cat.catKey} style={styles.cat} onPress={() => filterCat(cat.catKey)}>
            <View style={styles.catIco}>
              <AppIcon name={cat.icon} size={22} color={filterIconColor} />
            </View>
            <Text style={styles.catLabel} numberOfLines={2}>
              {t(cat.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Banner
        title={t('home.bannerTitle')}
        subtitle={t('home.bannerSubtitle')}
      />

      <SectionHead
        title={feedTitle}
        action={t('home.moreRecommend')}
        onAction={() => nav('search')}
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
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  logoSlot: {
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  city: {
    ...amazingStylePill,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  cityText: {
    fontSize: 12,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  tabs: {
    paddingVertical: 4,
    marginBottom: 0,
  },
  tabItem: {
    marginRight: 20,
    paddingBottom: 5,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    color: '#676767',
    fontWeight: fonts.weights.medium,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  tabIndicator: {
    width: 24,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.brand,
    marginTop: 4,
  },
  catRow: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  cat: {
    minWidth: 56,
    alignItems: 'center',
    marginRight: 12,
  },
  catIco: {
    width: 46,
    height: 46,
    borderRadius: 16,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...filterIconTile,
  },
  catLabel: {
    fontSize: 11,
    color: filterIconLabelColor,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
});
