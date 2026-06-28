import React from 'react';
import type { RegionSelection } from '../data/region';
import i18n from '../i18n';
import { fetchFeed } from '../services/catalogService';
import type { HomeTabKey, Product, ProductCatKey } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useFeed(
  region: RegionSelection,
  tab: HomeTabKey,
  categoryKey: ProductCatKey | null,
) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const catalogRevision = useCatalogRevision();

  const reload = React.useCallback(() => {
    let cancelled = false;
    setItems([]);
    setLoading(true);
    setError(false);
    fetchFeed(region, tab, categoryKey ?? undefined)
      .then((feed) => {
        if (!cancelled) setItems(feed);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, tab, categoryKey, i18n.language, catalogRevision]);

  React.useEffect(() => reload(), [reload]);

  return { items, loading, error, reload };
}
