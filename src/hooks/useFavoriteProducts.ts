import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { favoritesApi } from '../api';
import { mapListingToProduct, mergeProducts } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import { mockCatalogProducts } from '../services/catalogService';
import { loadLocalFavorites } from '../data/favorites';
import { fetchListingsByIds } from '../services/catalogService';
import type { Product } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useFavoriteProducts(isLoggedIn: boolean, favoriteIds?: ReadonlySet<number>) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const catalogRevision = useCatalogRevision();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const reload = React.useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload]),
  );

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        if (isLoggedIn) {
          const all: Product[] = [];
          let page = 1;
          let hasMore = true;
          while (hasMore && page <= 25) {
            const result = await favoritesApi.listListings({ page, pageSize: 50 });
            all.push(...result.items.map(mapListingToProduct));
            hasMore = result.hasMore;
            page += 1;
          }
          if (!cancelled) setItems(all);
          return;
        }
      } catch {
        if (isLoggedIn && favoriteIds?.size) {
          const resolved = await fetchListingsByIds([...favoriteIds]);
          const merged = mergeProducts(mockCatalogProducts(), resolved);
          const ordered = [...favoriteIds]
            .map((id) => merged.find((product) => product.id === id))
            .filter((product): product is Product => product != null);
          if (!cancelled) setItems(ordered);
          return;
        }
        if (!API_USE_MOCK_FALLBACK && isLoggedIn) {
          if (!cancelled) setItems([]);
          return;
        }
      }

      const ids = [...(await loadLocalFavorites())];
      if (ids.length === 0) {
        if (!cancelled) setItems([]);
        return;
      }
      const resolved = await fetchListingsByIds(ids);
      const merged = mergeProducts(mockCatalogProducts(), resolved);
      const ordered = ids
        .map((id) => merged.find((product) => product.id === id))
        .filter((product): product is Product => product != null);
      if (!cancelled) setItems(ordered);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [favoriteIds, isLoggedIn, catalogRevision, i18n.language, refreshKey]);

  return { items, loading, reload };
}
