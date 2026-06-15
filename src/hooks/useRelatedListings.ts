import React from 'react';
import type { RegionSelection } from '../data/region';
import { fetchRelatedListings } from '../services/catalogService';
import type { Product } from '../types';

export function useRelatedListings(listingId: number, region: RegionSelection) {
  const [items, setItems] = React.useState<Product[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetchRelatedListings(listingId, region).then((related) => {
      if (!cancelled) setItems(related);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, region.state, region.city, region.area]);

  return items;
}
