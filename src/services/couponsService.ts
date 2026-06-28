import { couponsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CouponDto } from '../api/types';

export async function listCoupons(isLoggedIn: boolean): Promise<CouponDto[]> {
  if (isLoggedIn) {
    try {
      const items: CouponDto[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await couponsApi.list({ page, pageSize: 50 });
        items.push(...result.items);
        hasMore = result.hasMore;
        page += 1;
      }
      return items;
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }
  return [];
}

export async function redeemCoupon(id: string, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await couponsApi.redeem(id);
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('coupon_redeem_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) return;
  throw new Error('coupon_redeem_failed');
}
