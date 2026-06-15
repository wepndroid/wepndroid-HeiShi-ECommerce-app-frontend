import React from 'react';
import { useFocusEffect } from 'expo-router';
import { getMyListings } from '../services/listingsService';
import type { UiListing } from '../types';

export function useMyListings(
  status: 'active' | 'draft' | 'inactive' | undefined,
  isLoggedIn: boolean,
  authReady: boolean,
) {
  const [listings, setListings] = React.useState<UiListing[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    getMyListings(status, isLoggedIn)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, status]);

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
