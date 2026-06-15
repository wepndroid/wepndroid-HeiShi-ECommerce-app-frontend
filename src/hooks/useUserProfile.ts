import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { AuthUserDto, UserProfileUpdateRequest } from '../api/types';
import type { AuthUser } from '../data/auth';
import { fetchUserProfile, updateUserProfile } from '../services/userService';

export function useUserProfile(user: AuthUser | null, authReady: boolean) {
  const isLoggedIn = user != null;
  const [profile, setProfile] = React.useState<AuthUserDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchUserProfile(user, isLoggedIn)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const save = React.useCallback(
    async (patch: UserProfileUpdateRequest) => {
      setSaving(true);
      try {
        const next = await updateUserProfile(user, isLoggedIn, patch);
        setProfile(next);
        return next;
      } finally {
        setSaving(false);
      }
    },
    [isLoggedIn, user],
  );

  return { profile, loading, saving, refresh, save };
}
