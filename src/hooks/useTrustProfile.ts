import React from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchCreditProfile,
  fetchReviewSummary,
  fetchVerificationStatus,
  type VerificationStatus,
} from '../services/userService';

export function useVerificationStatus(isLoggedIn: boolean, authReady: boolean) {
  const [status, setStatus] = React.useState<VerificationStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchVerificationStatus(isLoggedIn)
      .then(setStatus)
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

  return { status, loading, refresh };
}

export function useCreditProfile(isLoggedIn: boolean, authReady: boolean) {
  const [credit, setCredit] = React.useState<Awaited<ReturnType<typeof fetchCreditProfile>> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchCreditProfile(isLoggedIn)
      .then(setCredit)
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

  return { credit, loading, refresh };
}

export function useReviewSummary(isLoggedIn: boolean, authReady: boolean) {
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof fetchReviewSummary>> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchReviewSummary(isLoggedIn)
      .then(setSummary)
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

  return { summary, loading, refresh };
}
