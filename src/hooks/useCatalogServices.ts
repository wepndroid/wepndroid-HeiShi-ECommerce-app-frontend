import React from 'react';
import type { RegionSelection } from '../data/region';
import type { LocalService } from '../data/services';
import { fetchLocalServices } from '../services/catalogService';
import { useCatalogRevision } from '../utils/catalogSync';

export function useCatalogServices(region: RegionSelection) {
  const [services, setServices] = React.useState<LocalService[]>([]);
  const [loading, setLoading] = React.useState(true);
  const catalogRevision = useCatalogRevision();

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLocalServices(region)
      .then((items) => {
        if (!cancelled) setServices(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, catalogRevision]);

  return { services, loading };
}
