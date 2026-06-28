import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { ALL_AREAS, formatAreaLabel } from '../data/region';
import { feedTitleKey, homeFilterForCategory } from '../hooks/useProductFilters';
import {
  MarketScreenHeader,
  useInboxUnreadCount,
} from '../components/MarketScreenHeader';
import {
  ScreenScroll,
  SearchBar,
  SectionHead,
} from '../components/UI';
import { Banner, ProductFeed } from '../components/ProductUI';
import { LoadingState, PillButton } from '../components/UI';
import { homePromoBannerForLanguage } from '../assets/homeBanner';
import {
  activeHomeCategoryKey,
  HOME_CATEGORY_SHORTCUTS,
  HomeCategoryShortcutRow,
} from '../components/HomeCategoryShortcutRow';
import { HomeTabKey, ProductCatKey } from '../types';
import { usePhotoSearch } from '../hooks/usePhotoSearch';
import { colors, fonts, homeScreenTokens } from '../theme';

const HOME_TABS: HomeTabKey[] = [
  'recommended',
  'newArrivals',
  'digital',
  'services',
  'tickets',
];

const CATS = HOME_CATEGORY_SHORTCUTS;

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const {
    nav,
    requireAuthNav,
    openSearch,
    openDetail,
    homeFeed,
    homeFeedLoading,
    homeFeedError,
    reloadHomeFeed,
    homeTabKey,
    setHomeTabKey,
    setHomeCategory,
    homeCategory,
    region,
    regionLabelText,
    openRegionSheet,
    toast,
    isLoggedIn,
    authReady,
  } = useApp();
  const inboxUnreadCount = useInboxUnreadCount(isLoggedIn, authReady);
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
      <MarketScreenHeader
        regionLabelText={regionLabelText}
        unreadCount={inboxUnreadCount}
        onRegionPress={openRegionSheet}
        onMessagesPress={() => requireAuthNav('messages')}
        onSettingsPress={() => requireAuthNav('settings')}
      />

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
        artworkSource={homePromoBannerForLanguage(i18n.language)}
      />

      <SectionHead
        title={feedTitle}
        action={t('home.moreRecommend')}
        onAction={openSearch}
        compact
      />
      {homeFeedLoading && homeFeed.length === 0 ? (
        <LoadingState text={t('home.loadingFeed')} />
      ) : (
        <>
          <ProductFeed
            data={homeFeed}
            onPress={openDetail}
            emptyText={homeFeedError ? t('home.feedError') : t('home.emptyFeed')}
          />
          {homeFeedError ? (
            <PillButton label={t('common.retry')} variant="light" full onPress={reloadHomeFeed} />
          ) : null}
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  tabs: {
    paddingVertical: 2,
    marginBottom: 0,
  },
  tabItem: {
    marginRight: 14,
    paddingBottom: 4,
    alignItems: 'center',
  },
  tabText: {
    fontSize: homeScreenTokens.tabSize,
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
