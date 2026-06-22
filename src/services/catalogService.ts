import { catalogApi } from '../api';
import {
  mapDetailDtoToProduct,
  mapListingToProduct,
  mapServiceDtoToLocalService,
  regionToFeedQuery,
} from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import i18n from '../i18n';
import { resolveDetailProduct, SERVICE_DETAIL_BASE } from '../data/detailProducts';
import { products as mockProducts } from '../data/products';
import { localServices, serviceInRegion } from '../data/services';
import { homeFeedProducts, regionProducts } from '../hooks/useProductFilters';
import type { PickedMedia } from '../services/mediaPicker';
import type { LocalService } from '../data/services';
import type { RegionSelection } from '../data/region';
import type { HomeTabKey, Product, ProductCatKey } from '../types';
import { Platform } from 'react-native';

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

function mockSearch(region: RegionSelection, query: string): Product[] {
  const q = query.trim().toLowerCase();
  const regional = regionProducts(mockProducts, region);
  if (!q) return regional.slice(0, 6);
  return regional.filter((product) => {
    return (
      String(product.id).includes(q) ||
      product.catKey.toLowerCase().includes(q) ||
      product.seller.toLowerCase().includes(q) ||
      product.sellerKey.toLowerCase().includes(q) ||
      product.tagKey.toLowerCase().includes(q)
    );
  });
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
    const result = await catalogApi.getFeed({
      ...regionToFeedQuery(region),
      tab,
      categoryKey,
      pageSize: 40,
    });
    return result.items.map(mapListingToProduct);
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockFeed(region, tab, categoryKey);
    return [];
  }
}

export async function searchCatalog(
  region: RegionSelection,
  query: string,
  sort: 'relevance' | 'priceAsc' | 'priceDesc' | 'newest' = 'relevance',
): Promise<Product[]> {
  const q = query.trim();
  if (!q) return mockSearch(region, '');

  try {
    const result = await catalogApi.search({
      ...regionToFeedQuery(region),
      q,
      sort,
      pageSize: 40,
    });
    return result.items.map(mapListingToProduct);
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockSearch(region, q);
    return [];
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
    const result = await catalogApi.searchByImage(buildImageSearchFormData(media), regionToFeedQuery(region));
    return {
      items: result.items.map(mapListingToProduct),
      suggestedQuery: result.suggestedQuery,
      matchCount: result.matchCount,
    };
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

export async function fetchListingDetail(id: number): Promise<Product | undefined> {
  if (id > SERVICE_DETAIL_BASE) {
    return resolveDetailProduct(id);
  }

  try {
    const dto = await catalogApi.getListing(id);
    return mapDetailDtoToProduct(dto);
  } catch {
    if (API_USE_MOCK_FALLBACK) return resolveDetailProduct(id);
    return undefined;
  }
}

export async function fetchRelatedListings(
  listingId: number,
  region: RegionSelection,
): Promise<Product[]> {
  if (listingId > SERVICE_DETAIL_BASE) {
    return mockRelated(region, listingId);
  }

  try {
    const result = await catalogApi.getRelatedListings(listingId, regionToFeedQuery(region));
    return result.items.map(mapListingToProduct);
  } catch {
    if (API_USE_MOCK_FALLBACK) return mockRelated(region, listingId);
    return [];
  }
}

export async function fetchLocalServices(region: RegionSelection): Promise<LocalService[]> {
  try {
    const result = await catalogApi.getLocalServices(regionToFeedQuery(region));
    return result.items.map(mapServiceDtoToLocalService);
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
      imageUrl: mockProducts.find((p) => p.id === item.listingId)?.imageUrl,
    }));
  } catch {
    if (API_USE_MOCK_FALLBACK) {
      return mockSearchSuggestions();
    }
    return [];
  }
}

export async function fetchListingsByIds(ids: number[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter((id) => id <= SERVICE_DETAIL_BASE);
  const results = await Promise.all(unique.map((id) => fetchListingDetail(id)));
  return results.filter((p): p is Product => p != null);
}

export function mockCatalogProducts(): Product[] {
  return mockProducts;
}
