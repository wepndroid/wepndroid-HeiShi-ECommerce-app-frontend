import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { CouponDto } from '../api/types';
import { listCoupons, redeemCoupon } from '../services/couponsService';

export function useCoupons(isLoggedIn: boolean, authReady: boolean) {
  const [coupons, setCoupons] = React.useState<CouponDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listCoupons(isLoggedIn)
      .then(setCoupons)
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

  const redeem = React.useCallback(
    async (id: string) => {
      await redeemCoupon(id, isLoggedIn);
      setCoupons((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: 'used' as const } : row)),
      );
    },
    [isLoggedIn],
  );

  return { coupons, loading, refresh, redeem };
}
