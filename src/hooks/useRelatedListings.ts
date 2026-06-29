import React from 'react';
import type { RegionSelection } from '../data/region';
import i18n from '../i18n';
import { fetchRelatedListings } from '../services/catalogService';
import type { Product } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useRelatedListings(listingId: number | null, region: RegionSelection) {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const catalogRevision = useCatalogRevision();

  const reload = React.useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    if (listingId == null) {
      setItems([]);
      setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoadError(false);
    fetchRelatedListings(listingId, region).then(({ items: related, failed }) => {
      if (cancelled) return;
      setItems(related);
      setLoadError(failed);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, region.state, region.city, region.area, i18n.language, catalogRevision, refreshKey]);

  return { items, loadError, reload };
}
