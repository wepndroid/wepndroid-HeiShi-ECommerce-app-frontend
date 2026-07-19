import { favoritesApi, followsApi, historyApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { loadLocalFavorites, saveLocalFavorites } from '../data/favorites';
import { loadLocalFollows, resolveSellerUserId, saveLocalFollows } from '../data/follows';
import { loadLocalHistory, recordLocalView } from '../data/history';
import { recordShareEventForListing } from './sharingService';

export async function bootstrapFavorites(isLoggedIn: boolean): Promise<Set<number>> {
  if (isLoggedIn) {
    try {
      const ids = new Set<number>();
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await favoritesApi.list({ page, pageSize: 100 });
        result.items.forEach((item) => ids.add(item.listingId));
        hasMore = result.hasMore;
        page += 1;
      }
      await saveLocalFavorites(ids);
      return ids;
    } catch {
      if (API_USE_MOCK_FALLBACK) return loadLocalFavorites();
      return loadLocalFavorites();
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
      if (shouldFavorite) {
        void recordShareEventForListing(listingId, 'favorite').catch(() => undefined);
      }
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
  void recordShareEventForListing(listingId, 'view').catch(() => undefined);
  await recordLocalView(listingId);
}

export async function fetchHistoryListingIds(isLoggedIn: boolean): Promise<number[]> {
  const localIds = await loadLocalHistory();
  if (isLoggedIn) {
    try {
      const ids: number[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await historyApi.listViews({ page, pageSize: 50 });
        ids.push(...result.items.map((item) => item.listingId));
        hasMore = result.hasMore;
        page += 1;
      }
      const seen = new Set(ids);
      for (const id of localIds) {
        if (!seen.has(id)) {
          ids.push(id);
          seen.add(id);
        }
      }
      return ids;
    } catch {
      if (API_USE_MOCK_FALLBACK) return localIds;
      return localIds.length ? localIds : [];
    }
  }
  return localIds;
}

export async function bootstrapFollows(isLoggedIn: boolean): Promise<Set<string>> {
  if (isLoggedIn) {
    try {
      const ids = new Set<string>();
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await followsApi.list({ page, pageSize: 100 });
        result.items.forEach((item) => ids.add(resolveSellerUserId(item.userId)));
        hasMore = result.hasMore;
        page += 1;
      }
      await saveLocalFollows(ids);
      return ids;
    } catch {
      if (API_USE_MOCK_FALLBACK) return loadLocalFollows();
      return loadLocalFollows();
    }
  }
  return loadLocalFollows();
}

export async function setFollow(
  sellerKey: string,
  shouldFollow: boolean,
  isLoggedIn: boolean,
): Promise<Set<string>> {
  const userId = resolveSellerUserId(sellerKey);
  const current = await loadLocalFollows();
  const next = new Set(current);

  if (shouldFollow) next.add(userId);
  else next.delete(userId);

  if (isLoggedIn) {
    try {
      if (shouldFollow) await followsApi.follow(userId);
      else await followsApi.unfollow(userId);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('follow_sync_failed');
    }
  }

  await saveLocalFollows(next);
  return next;
}

export { resolveSellerUserId } from '../data/follows';
