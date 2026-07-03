import React from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCatalogStore } from '../../store/catalogStore';
import { useRegionStore } from '../../store/regionStore';
import { useSearchStore } from '../../store/searchStore';
import { useUiStore } from '../../store/uiStore';
import { useSearch } from '../../hooks/useSearch';
import { fetchListingDetail } from '../../services/catalogService';
import { AmazingSurface } from '../../components/AmazingSurface';
import { ProductGrid } from '../../components/ProductUI';
import { normalizeMediaUrl } from '../../utils/mediaUrls';
import { Text } from '../../components/typography';
import {
  EmptyState,
  LoadingState,
  PillButton,
  ScreenScroll,
  SearchBar,
  SectionHead,
  TitleBar,
} from '../../components/UI';
import { usePhotoSearch } from '../../hooks/usePhotoSearch';
import { styles } from './shared';

export function SearchScreen() {
  const { t } = useTranslation();
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
  const region = useRegionStore((s) => s.region);
  const toast = useUiStore((s) => s.toast);
  const searchValue = useSearchStore((s) => s.searchValue);
  const setSearchValue = useSearchStore((s) => s.setSearchValue);
  const imageSearchResults = useSearchStore((s) => s.imageSearchResults);
  const imageSearchPreviewUri = useSearchStore((s) => s.imageSearchPreviewUri);
  const imageSearchLoading = useSearchStore((s) => s.imageSearchLoading);
  const imageSearchError = useSearchStore((s) => s.imageSearchError);
  const clearImageSearch = useSearchStore((s) => s.clearImageSearch);
  const setImageSearchLoading = useSearchStore((s) => s.setImageSearchLoading);
  const setImageSearchError = useSearchStore((s) => s.setImageSearchError);
  const { results, suggestions, loading, error, reload, isImageMode } = useSearch(
    region,
    searchValue,
    imageSearchResults,
    imageSearchLoading,
  );
  const searchByPhoto = usePhotoSearch();
  const showSearchError = error || (isImageMode && imageSearchError);

  const retryImageSearch = () => {
    setImageSearchError(false);
    void searchByPhoto();
  };

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
      {!isImageMode && suggestions.length > 0 ? (
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
                  if (item.productId != null) {
                    void fetchListingDetail(item.productId).then((product) => {
                      if (product) {
                        openDetail(product);
                        return;
                      }
                      const fromResults = results.find((p) => p.id === item.productId);
                      if (fromResults) {
                        openDetail(fromResults);
                        return;
                      }
                      const fromCatalog = products.find((p) => p.id === item.productId);
                      if (fromCatalog) {
                        openDetail(fromCatalog);
                        return;
                      }
                      toast(t('toast.listingUnavailable'));
                    });
                    return;
                  }
                  toast(t('toast.quickSearch', { query: item.query }));
                }}
              >
                <View style={styles.sgImg}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: normalizeMediaUrl(item.imageUrl) ?? item.imageUrl }}
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
        compact
      />
      {loading ? (
        <LoadingState text={t('screens.search.searching')} />
      ) : showSearchError ? (
        <>
          <EmptyState text={t('screens.search.error')} />
          <PillButton
            label={t('common.retry')}
            variant="light"
            full
            onPress={isImageMode && imageSearchError ? retryImageSearch : reload}
          />
        </>
      ) : (
        <ProductGrid data={results} onPress={openDetail} emptyText={t('screens.search.empty')} />
      )}
    </ScreenScroll>
  );
}
