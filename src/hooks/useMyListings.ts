import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { getMyListings } from '../services/listingsService';
import type { UiListing } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useMyListings(
  status: 'active' | 'draft' | 'inactive' | undefined,
  isLoggedIn: boolean,
  authReady: boolean,
) {
  const [listings, setListings] = React.useState<UiListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const catalogRevision = useCatalogRevision();

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    getMyListings(status, isLoggedIn)
      .then((rows) => {
        setListings(rows);
      })
      .catch(() => {
        setListings([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, status, catalogRevision, i18n.language]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { listings, loading, error, refresh };
}
