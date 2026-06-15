import { favoritesApi, historyApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { loadLocalFavorites, saveLocalFavorites } from '../data/favorites';
import { loadLocalHistory, recordLocalView } from '../data/history';

export async function bootstrapFavorites(isLoggedIn: boolean): Promise<Set<number>> {
  if (isLoggedIn) {
    try {
      const result = await favoritesApi.list({ pageSize: 100 });
      const ids = new Set(result.items.map((item) => item.listingId));
      await saveLocalFavorites(ids);
      return ids;
    } catch {
      if (API_USE_MOCK_FALLBACK) return loadLocalFavorites();
      return new Set();
    }
  }
  return loadLocalFavorites();
}

export async function setFavorite(
  listingId: number,
  shouldFavorite: boolean,
  isLoggedIn: boolean,
): Promise<Set<number>> {
  const current = await loadLocalFavorites();
  const next = new Set(current);

  if (shouldFavorite) next.add(listingId);
  else next.delete(listingId);

  if (isLoggedIn) {
    try {
      if (shouldFavorite) await favoritesApi.add(listingId);
      else await favoritesApi.remove(listingId);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('favorite_sync_failed');
    }
  }

  await saveLocalFavorites(next);
  return next;
}

export async function recordListingView(listingId: number, isLoggedIn: boolean) {
  if (isLoggedIn) {
    try {
      await historyApi.recordView(listingId);
    } catch {
      // Local history still updated below.
    }
  }
  await recordLocalView(listingId);
}

export async function fetchHistoryListingIds(isLoggedIn: boolean): Promise<number[]> {
  if (isLoggedIn) {
    try {
      const result = await historyApi.listViews({ pageSize: 50 });
      return result.items.map((item) => item.listingId);
    } catch {
      if (API_USE_MOCK_FALLBACK) return loadLocalHistory();
      return [];
    }
  }
  return loadLocalHistory();
}
