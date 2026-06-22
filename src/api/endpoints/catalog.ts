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

export const catalogApi = {
  /** GET /catalog/form-options */
  getFormOptions() {
    return apiRequest<ListingFormOptionsDto>('/catalog/form-options', { auth: false });
  },

  /** GET /catalog/feed */
  getFeed(query: FeedQuery) {
    return apiRequest<Paginated<ListingSummaryDto>>('/catalog/feed', {
      query: query as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /** GET /catalog/search */
  search(query: SearchQuery) {
    return apiRequest<Paginated<ListingSummaryDto>>('/catalog/search', {
      query: query as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /** POST /catalog/search/image */
  searchByImage(formData: FormData, query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'>) {
    return apiRequest<ImageSearchResponseDto>('/catalog/search/image', {
      method: 'POST',
      body: formData,
      query: query as Record<string, string | number | boolean | undefined | null>,
      auth: false,
    });
  },

  /** GET /catalog/listings/:id */
  getListing(id: number) {
    return apiRequest<ListingDetailDto>(`/catalog/listings/${id}`);
  },

  /** GET /catalog/listings/:id/related */
  getRelatedListings(id: number, query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'>) {
    return apiRequest<Paginated<ListingSummaryDto>>(`/catalog/listings/${id}/related`, { query });
  },

  /** GET /catalog/services */
  getLocalServices(query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'>) {
    return apiRequest<Paginated<LocalServiceDto>>('/catalog/services', { query });
  },

  /** GET /catalog/suggestions */
  getSearchSuggestions(query?: Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'>) {
    return apiRequest<{ query: string; listingId: number; title: string; subtitle: string }[]>(
      '/catalog/suggestions',
      { query },
    );
  },
};
