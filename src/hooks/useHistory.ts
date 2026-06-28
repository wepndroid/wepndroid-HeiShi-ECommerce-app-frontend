import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { historyApi } from '../api';
import { mapListingToProduct, mergeProducts } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { RegionSelection } from '../data/region';
import { mockCatalogProducts, fetchListingsByIds } from '../services/catalogService';
import { fetchHistoryListingIds } from '../services/userDataService';
import type { Product } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useHistoryProducts(region: RegionSelection, isLoggedIn: boolean) {
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
            const result = await historyApi.listListings({ page, pageSize: 50 });
            all.push(...result.items.map(mapListingToProduct));
            hasMore = result.hasMore;
            page += 1;
          }
          if (!cancelled) setItems(all);
          return;
        }

        const ids = await fetchHistoryListingIds(false);
        if (cancelled) return;
        if (ids.length === 0) {
          setItems([]);
          return;
        }
        const resolved = await fetchListingsByIds(ids);
        const merged = mergeProducts(mockCatalogProducts(), resolved);
        const ordered = ids
          .map((id) => merged.find((product) => product.id === id))
          .filter((product): product is Product => product != null);
        if (!cancelled) setItems(ordered);
      } catch {
        if (cancelled) return;
        if (API_USE_MOCK_FALLBACK) {
          const ids = await fetchHistoryListingIds(false);
          const resolved = await fetchListingsByIds(ids);
          const merged = mergeProducts(mockCatalogProducts(), resolved);
          const ordered = ids
            .map((id) => merged.find((product) => product.id === id))
            .filter((product): product is Product => product != null);
          if (!cancelled) setItems(ordered);
        } else if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, catalogRevision, i18n.language, refreshKey]);

  return { items, loading, reload };
}
