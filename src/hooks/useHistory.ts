import React from 'react';
import type { RegionSelection } from '../data/region';
import { mergeProducts } from '../api/mappers';
import { mockCatalogProducts, fetchListingsByIds } from '../services/catalogService';
import { fetchHistoryListingIds } from '../services/userDataService';
import { regionProducts } from '../hooks/useProductFilters';
import type { Product } from '../types';

export function useHistoryProducts(region: RegionSelection, isLoggedIn: boolean) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchHistoryListingIds(isLoggedIn)
      .then(async (ids) => {
        if (cancelled) return;
        if (ids.length === 0) {
          setItems(regionProducts(mockCatalogProducts(), region).slice(0, 9));
          return;
        }
        const resolved = await fetchListingsByIds(ids);
        const merged = mergeProducts(mockCatalogProducts(), resolved);
        const ordered = ids
          .map((id) => merged.find((product) => product.id === id))
          .filter((product): product is Product => product != null);
        setItems(regionProducts(ordered.length ? ordered : merged, region).slice(0, 9));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, isLoggedIn]);

  return { items, loading };
}
