import React from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchBlocklist, type BlocklistUser } from '../services/safetyService';

export function useBlocklist(isLoggedIn: boolean, authReady: boolean) {
  const [entries, setEntries] = React.useState<BlocklistUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    fetchBlocklist(isLoggedIn)
      .then(setEntries)
      .catch(() => {
        setError(true);
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { entries, loading, error, refresh };
}
