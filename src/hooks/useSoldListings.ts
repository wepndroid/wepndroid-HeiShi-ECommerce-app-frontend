import React from 'react';
import { useFocusEffect } from 'expo-router';
import { getSoldListings } from '../services/listingsService';
import type { UiListing } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useSoldListings(isLoggedIn: boolean, authReady: boolean) {
  const [listings, setListings] = React.useState<UiListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const catalogRevision = useCatalogRevision();

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    getSoldListings(isLoggedIn)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, catalogRevision]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { listings, loading, refresh };
}
