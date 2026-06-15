import { useTranslation } from 'react-i18next';
import {
  BUNDLE_FULL_PRICE,
  bundleHasSoldItems,
  getRemainingBundlePrice,
} from '../data/bundle';

export function useBundlePricing() {
  const { t } = useTranslation();
  const remaining = getRemainingBundlePrice();
  const hasSold = bundleHasSoldItems();
  const prefix = t('common.currencyPrefix');

  const priceLabel = hasSold
    ? t('products.bundle.remainingPrice', { amount: remaining })
    : t('products.bundle.fullPrice', { amount: BUNDLE_FULL_PRICE });

  const priceDetail = hasSold
    ? t('products.bundle.wasFullPrice', { amount: BUNDLE_FULL_PRICE })
    : null;

  return {
    fullPrice: BUNDLE_FULL_PRICE,
    remainingPrice: remaining,
    hasSoldItems: hasSold,
    priceLabel,
    priceDetail,
    pricePrefix: prefix,
  };
}
