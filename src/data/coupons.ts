import i18n from '../i18n';
import type { CouponDto } from '../api/types';

export function mockCoupons(): CouponDto[] {
  return [
    {
      id: 'demo-welcome',
      amount: 5,
      currency: 'AUD',
      description: i18n.t('coupons.welcomeDesc'),
      status: 'available',
    },
  ];
}
