import { apiRequest } from '../client';
import type { FavoriteDto, Paginated } from '../types';

export const favoritesApi = {
  /** GET /favorites */
  list(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<FavoriteDto>>('/favorites', { query: params });
  },

  /** POST /favorites/:listingId */
  add(listingId: number) {
    return apiRequest<FavoriteDto>(`/favorites/${listingId}`, { method: 'POST' });
  },

  /** DELETE /favorites/:listingId */
  remove(listingId: number) {
    return apiRequest<void>(`/favorites/${listingId}`, { method: 'DELETE' });
  },
};

export const historyApi = {
  /** GET /history/views */
  listViews(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<{ listingId: number; viewedAt: string }>>('/history/views', { query: params });
  },

  /** POST /history/views/:listingId */
  recordView(listingId: number) {
    return apiRequest<void>(`/history/views/${listingId}`, { method: 'POST' });
  },
};

export const followsApi = {
  /** GET /follows */
  list(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<{ userId: string; nickname: string; subtitle?: string; followedAt: string }>>(
      '/follows',
      { query: params },
    );
  },

  /** POST /follows/:userId */
  follow(userId: string) {
    return apiRequest<void>(`/follows/${userId}`, { method: 'POST' });
  },

  /** DELETE /follows/:userId */
  unfollow(userId: string) {
    return apiRequest<void>(`/follows/${userId}`, { method: 'DELETE' });
  },
};

export const couponsApi = {
  /** GET /coupons */
  list(params?: { status?: 'available' | 'used' | 'expired' }) {
    return apiRequest<Paginated<import('../types').CouponDto>>('/coupons', { query: params });
  },

  /** POST /coupons/:id/redeem */
  redeem(id: string) {
    return apiRequest<void>(`/coupons/${id}/redeem`, { method: 'POST' });
  },
};
