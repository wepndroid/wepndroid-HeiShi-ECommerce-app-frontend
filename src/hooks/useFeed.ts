import React from 'react';
import type { RegionSelection } from '../data/region';
import i18n from '../i18n';
import { fetchFeed } from '../services/catalogService';
import type { HomeTabKey, Product, ProductCatKey } from '../types';

export function useFeed(
  region: RegionSelection,
  tab: HomeTabKey,
  categoryKey: ProductCatKey | null,
) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFeed(region, tab, categoryKey ?? undefined)
      .then((feed) => {
        if (!cancelled) setItems(feed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, tab, categoryKey, i18n.language]);

  return { items, loading };
}
