import { useCallback, useEffect, useState } from 'react';
import type { PublicUserProfileDto } from '../api/types';
import type { Product } from '../types';
import { fetchPublicUserListings, fetchPublicUserProfile } from '../services/userService';

export function usePublicUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setListings([]);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [nextProfile, nextListings] = await Promise.all([
        fetchPublicUserProfile(userId),
        fetchPublicUserListings(userId),
      ]);
      setProfile(nextProfile);
      setListings(nextListings);
    } catch {
      setError(true);
      setProfile(null);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, listings, loading, error, reload };
}