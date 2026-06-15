import { catalogApi } from '../api';
import {
  mapDetailDtoToProduct,
  mapListingToProduct,
  mapServiceDtoToLocalService,
  regionToFeedQuery,
} from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { resolveDetailProduct, SERVICE_DETAIL_BASE } from '../data/detailProducts';
import { products as mockProducts } from '../data/products';
import { localServices, serviceInRegion } from '../data/services';
import { homeFeedProducts, regionProducts } from '../hooks/useProductFilters';
import type { LocalService } from '../data/services';
import type { RegionSelection } from '../data/region';
import type { HomeTabKey, Product, ProductCatKey } from '../types';

export interface SearchSuggestion {
  query: string;
  productId: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
}

const MOCK_SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { query: 'Nordic folding desk', productId: 5, title: 'Nordic folding desk', subtitle: 'Space-saving' },
  { query: 'Bluetooth headphones', productId: 1, title: 'Bluetooth headphones', subtitle: 'Commute & study' },
  { query: 'Vintage film camera', productId: 4, title: 'Vintage film camera', subtitle: 'Aesthetic shots' },
  { query: 'Moving boxes', productId: 12, title: 'Moving boxes', subtitle: 'Packing supplies' },
  { query: 'PTE tutoring', productId: 7, title: 'PTE tutoring', subtitle: 'Exam prep' },
  { query: 'Concert ticket', productId: 6, title: 'Concert ticket', subtitle: 'Live events' },
];

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
      return MOCK_SEARCH_SUGGESTIONS.map((item) => ({
        ...item,
        imageUrl: mockProducts.find((p) => p.id === item.productId)?.imageUrl,
      }));
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
