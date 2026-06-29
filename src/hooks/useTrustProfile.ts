import React from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchCreditProfile,
  fetchPendingReviewOrders,
  fetchReceivedReviews,
  fetchReviewSummary,
  fetchVerificationStatus,
  type VerificationStatus,
} from '../services/userService';
import type { PendingReviewOrderDto } from '../api/types';

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
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    fetchCreditProfile(isLoggedIn)
      .then(setCredit)
      .catch(() => {
        setCredit(null);
        setError(true);
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

  return { credit, loading, error, refresh };
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

export function useReceivedReviews(
  isLoggedIn: boolean,
  authReady: boolean,
  role: 'seller' | 'buyer' = 'seller',
) {
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof fetchReceivedReviews>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    fetchReceivedReviews(isLoggedIn, role)
      .then(setItems)
      .catch(() => {
        setItems([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn, role]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { items, loading, error, refresh };
}

export function usePendingReviewOrders(isLoggedIn: boolean, authReady: boolean) {
  const [orders, setOrders] = React.useState<PendingReviewOrderDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    fetchPendingReviewOrders(isLoggedIn)
      .then(setOrders)
      .catch(() => setOrders([]))
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

  return { orders, loading, refresh };
}
