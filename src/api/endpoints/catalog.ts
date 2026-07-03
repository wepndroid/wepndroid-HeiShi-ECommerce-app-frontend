import { apiRequest } from '../client';
import type {
  FeedQuery,
  ImageSearchResponseDto,
  ListingDetailDto,
  ListingFormOptionsDto,
  ListingSummaryDto,
  LocalServiceDto,
  Paginated,
  SearchQuery,
} from '../types';

export type PlatformBannerDto = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  position: string;
};

export const catalogApi = {
  /** GET /catalog/form-options */
  getFormOptions() {
    return apiRequest<ListingFormOptionsDto>('/catalog/form-options', { auth: false });
  },

  /** GET /catalog/banners */
  getBanners(position: string = 'home') {
    return apiRequest<{ items: PlatformBannerDto[] }>('/catalog/banners', {
      query: { position },
      auth: false,
    });
  },

  /** GET /catalog/feed — public; optional auth not required for browsing */
  getFeed(query: FeedQuery) {
    return apiRequest<Paginated<ListingSummaryDto>>('/catalog/feed', {
      query: query as Record<string, string | number | boolean | undefined | null>,
      auth: false,
    });
  },

  /** GET /catalog/search */
  search(query: SearchQuery) {
    return apiRequest<Paginated<ListingSummaryDto>>('/catalog/search', {
      query: query as Record<string, string | number | boolean | undefined | null>,
      auth: false,
    });
  },

  /** POST /catalog/search/image */
  searchByImage(
    formData: FormData,
    query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea' | 'page' | 'pageSize'>,
  ) {
    return apiRequest<ImageSearchResponseDto>('/catalog/search/image', {
      method: 'POST',
      body: formData,
      query: query as Record<string, string | number | boolean | undefined | null>,
      auth: false,
    });
  },

  /** GET /catalog/listings/:id — auth required for seller to view own draft/inactive listings */
  getListing(id: number) {
    return apiRequest<ListingDetailDto>(`/catalog/listings/${id}`, { auth: true });
  },

  /** GET /catalog/listings/:id/related */
  getRelatedListings(
    id: number,
    query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea' | 'page' | 'pageSize'>,
  ) {
    return apiRequest<Paginated<ListingSummaryDto>>(`/catalog/listings/${id}/related`, { query, auth: false });
  },

  /** GET /catalog/services */
  getLocalServices(query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea' | 'page' | 'pageSize'>) {
    return apiRequest<Paginated<LocalServiceDto>>('/catalog/services', { query, auth: false });
  },

  /** GET /catalog/suggestions */
  getSearchSuggestions(
    query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'> & { q?: string },
  ) {
    return apiRequest<{ query: string; listingId: number; title: string; subtitle: string; imageUrl?: string | null }[]>(
      '/catalog/suggestions',
      { query, auth: false },
    );
  },
  recordPromotionClick(listingId: number) {
    return apiRequest<void>(`/catalog/listings/${listingId}/promotion-click`, { method: 'POST' });
  },
};
