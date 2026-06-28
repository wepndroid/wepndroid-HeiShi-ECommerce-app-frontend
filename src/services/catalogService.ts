import { catalogApi } from '../api';
import {
  mapDetailDtoToProduct,
  mapListingToProduct,
  mapServiceDtoToLocalService,
  regionToFeedQuery,
} from '../api/mappers';
import { ApiError } from '../api/client';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import i18n from '../i18n';
import { isLocalDetailListing, resolveDetailProduct } from '../data/detailProducts';
import { products as mockProducts } from '../data/products';
import { localServices, serviceInRegion } from '../data/services';
import { homeFeedProducts, regionProducts } from '../hooks/useProductFilters';
import type { PickedMedia } from '../services/mediaPicker';
import type { LocalService } from '../data/services';
import type { RegionSelection } from '../data/region';
import type { HomeTabKey, Product, ProductCatKey } from '../types';
import { Platform } from 'react-native';
import { isBundleListingProduct } from '../data/bundle';
import { normalizeMediaUrl } from '../utils/mediaUrls';
import { productImageUrl } from '../data/productImages';
import { isDemoCatalogListing } from '../data/catalogDemo';

export interface SearchSuggestion {
  query: string;
  productId: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
}

const MOCK_SUGGESTION_KEYS = ['desk', 'headphones', 'camera', 'boxes', 'pte', 'ticket'] as const;
const MOCK_SUGGESTION_IDS = [5, 1, 4, 12, 7, 6] as const;

function mockSearchSuggestions(): SearchSuggestion[] {
  return MOCK_SUGGESTION_KEYS.map((key, index) => {
    const productId = MOCK_SUGGESTION_IDS[index];
    return {
      query: i18n.t(`searchSuggest.${key}.query`),
      productId,
      title: i18n.t(`searchSuggest.${key}.title`),
      subtitle: i18n.t(`searchSuggest.${key}.sub`),
      imageUrl: mockProducts.find((p) => p.id === productId)?.imageUrl,
    };
  });
}

function mockFeed(region: RegionSelection, tab: HomeTabKey, categoryKey?: ProductCatKey): Product[] {
  const base = homeFeedProducts(region, tab);
  if (categoryKey) return base.filter((p) => p.catKey === categoryKey);
  return base;
}

function mockSearchableText(product: Product): string {
  const title =
    product.apiTitle ??
    i18n.t(`products.items.${product.id}.title`, { defaultValue: '' });
  return [
    title,
    product.apiDesc ?? '',
    product.loc,
    product.catKey,
    product.seller,
    product.sellerKey,
    product.tagKey,
    String(product.id),
  ]
    .join(' ')
    .toLowerCase();
}

function mockSearch(region: RegionSelection, query: string): Product[] {
  const q = query.trim().toLowerCase();
  const regional = regionProducts(mockProducts, region);
  if (!q) return regional.slice(0, 6);
  return regional.filter((product) => mockSearchableText(product).includes(q));
}

function mockRelated(region: RegionSelection, listingId: number): Product[] {
  return regionProducts(
    mockProducts.filter((p) => p.id !== listingId),
    region,
  ).slice(0, 6);
}

function mockServices(region: RegionSelection): LocalService[] {
  if (region.city !== 'Melbourne') return [];
  return localServices.filter((service) => serviceInRegion(service.area, region.area));
}

export async function fetchFeed(
  region: RegionSelection,
  tab: HomeTabKey,
  categoryKey?: ProductCatKey,
): Promise<Product[]> {
  try {
    const items: Product[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await catalogApi.getFeed({
        ...regionToFeedQuery(region),
        tab,
        categoryKey,
        page,
        pageSize: 40,
      });
      items.push(...result.items.map(mapListingToProduct));
      hasMore = result.hasMore;
      page += 1;
    }
    return items;
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockFeed(region, tab, categoryKey);
    throw new Error('feed_failed');
  }
}

export async function searchCatalog(
  region: RegionSelection,
  query: string,
  sort: 'relevance' | 'priceAsc' | 'priceDesc' | 'newest' = 'relevance',
): Promise<Product[]> {
  const q = query.trim();
  if (!q) {
    if (API_USE_MOCK_FALLBACK) return mockSearch(region, '');
    return fetchFeed(region, 'recommended');
  }

  try {
    const items: Product[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await catalogApi.search({
        ...regionToFeedQuery(region),
        q,
        sort,
        page,
        pageSize: 40,
      });
      items.push(...result.items.map(mapListingToProduct));
      hasMore = result.hasMore;
      page += 1;
    }
    return items;
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockSearch(region, q);
    throw new Error('search_failed');
  }
}

function buildImageSearchFormData(media: PickedMedia): FormData {
  const mimeType = media.mimeType === 'image/jpg' ? 'image/jpeg' : media.mimeType || 'image/jpeg';
  const rawName = media.fileName || 'photo.jpg';
  const safeName = rawName.match(/\.(jpe?g|png|webp|gif)$/i)
    ? rawName
    : `${rawName.replace(/\.\w+$/, '') || 'photo'}.jpg`;

  const formData = new FormData();
  if (Platform.OS === 'web') {
    throw new Error('image_search_unsupported');
  }
  formData.append('file', {
    uri: media.uri,
    name: safeName,
    type: mimeType,
  } as unknown as Blob);
  return formData;
}

export async function searchCatalogByImage(
  region: RegionSelection,
  media: PickedMedia,
): Promise<{ items: Product[]; suggestedQuery: string; matchCount: number }> {
  try {
    const items: Product[] = [];
    let page = 1;
    let hasMore = true;
    let suggestedQuery = '';
    let matchCount = 0;
    while (hasMore && page <= 25) {
      const result = await catalogApi.searchByImage(
        buildImageSearchFormData(media),
        { ...regionToFeedQuery(region), page, pageSize: 40 },
      );
      items.push(...result.items.map(mapListingToProduct));
      suggestedQuery = result.suggestedQuery || suggestedQuery;
      matchCount = result.matchCount;
      hasMore = result.hasMore;
      page += 1;
    }
    return { items, suggestedQuery, matchCount };
  } catch {
    if (API_USE_MOCK_FALLBACK) {
      const items = mockSearch(region, '');
      return {
        items,
        suggestedQuery: items[0]?.apiTitle ?? '',
        matchCount: items.length,
      };
    }
    throw new Error('image_search_failed');
  }
}

/** @returns product, null if 404, undefined on network/other failure */
export async function fetchListingDetail(id: number): Promise<Product | null | undefined> {
  if (isLocalDetailListing(id)) {
    return resolveDetailProduct(id) ?? undefined;
  }

  try {
    const dto = await catalogApi.getListing(id);
    return mapDetailDtoToProduct(dto);
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) return resolveDetailProduct(id);
    if (err instanceof ApiError && err.status === 404) return null;
    return undefined;
  }
}

/** Public catalog detail, with owned-listing fallback for drafts the seller is viewing. */
export async function resolveListingDetail(
  id: number,
  isLoggedIn: boolean,
): Promise<Product | null | undefined> {
  const detail = await fetchListingDetail(id);
  if (detail === undefined) {
    if (!isLoggedIn) return undefined;
    const { fetchMyListingDetail } = await import('./listingsService');
    return (await fetchMyListingDetail(id, true)) ?? undefined;
  }
  if (detail === null) {
    if (!isLoggedIn) return null;
    const { fetchMyListingDetail } = await import('./listingsService');
    return (await fetchMyListingDetail(id, true)) ?? null;
  }
  if (isBundleListingProduct(detail) && detail.bundleMeta == null && isLoggedIn) {
    const { fetchMyListingDetail } = await import('./listingsService');
    const owned = await fetchMyListingDetail(id, true);
    if (owned?.bundleMeta != null) return owned;
  }
  return detail;
}

export async function fetchRelatedListings(
  listingId: number,
  region: RegionSelection,
): Promise<{ items: Product[]; failed: boolean }> {
  if (isLocalDetailListing(listingId)) {
    return { items: mockRelated(region, listingId), failed: false };
  }

  try {
    const items: Product[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await catalogApi.getRelatedListings(listingId, {
        ...regionToFeedQuery(region),
        page,
        pageSize: 40,
      });
      items.push(...result.items.map(mapListingToProduct));
      hasMore = result.hasMore;
      page += 1;
    }
    return { items, failed: false };
  } catch {
    if (API_USE_MOCK_FALLBACK) return { items: mockRelated(region, listingId), failed: false };
    return { items: [], failed: true };
  }
}

export async function fetchLocalServices(region: RegionSelection): Promise<LocalService[]> {
  try {
    const items: LocalService[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await catalogApi.getLocalServices({
        ...regionToFeedQuery(region),
        page,
        pageSize: 40,
      });
      items.push(...result.items.map(mapServiceDtoToLocalService));
      hasMore = result.hasMore;
      page += 1;
    }
    return items;
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockServices(region);
    return [];
  }
}

export async function fetchSearchSuggestions(region: RegionSelection): Promise<SearchSuggestion[]> {
  try {
    const items = await catalogApi.getSearchSuggestions(regionToFeedQuery(region));
    return items.map((item) => ({
      query: item.query,
      productId: item.listingId,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl:
        normalizeMediaUrl(item.imageUrl) ??
        normalizeMediaUrl(mockProducts.find((p) => p.id === item.listingId)?.imageUrl) ??
        (isDemoCatalogListing(item.listingId) ? productImageUrl(item.listingId) : undefined),
    }));
  } catch {
    if (API_USE_MOCK_FALLBACK) {
      return mockSearchSuggestions();
    }
    return [];
  }
}

export async function fetchListingsByIds(ids: number[]): Promise<Product[]> {
  const unique = [...new Set(ids)];
  const results = await Promise.all(unique.map((id) => fetchListingDetail(id)));
  return results.filter((p): p is Product => p != null);
}

export function mockCatalogProducts(): Product[] {
  return mockProducts;
}
