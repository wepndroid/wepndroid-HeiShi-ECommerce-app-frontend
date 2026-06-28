import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';
import type { PublicUserProfileDto } from '../api/types';
import type { Product } from '../types';
import { fetchPublicUserListings, fetchPublicUserProfile } from '../services/userService';
import { useCatalogRevision } from '../utils/catalogSync';

export function usePublicUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const catalogRevision = useCatalogRevision();

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setListings([]);
      return;
    }
    setLoading(true);
    setError(false);
    const [profileResult, listingsResult] = await Promise.allSettled([
      fetchPublicUserProfile(userId),
      fetchPublicUserListings(userId),
    ]);
    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value);
    } else {
      setProfile(null);
      setError(true);
    }
    if (listingsResult.status === 'fulfilled') {
      setListings(listingsResult.value);
    } else {
      setListings([]);
      if (profileResult.status !== 'fulfilled') {
        setError(true);
      }
    }
    setLoading(false);
  }, [userId, catalogRevision, i18n.language]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, listings, loading, error, reload };
}
