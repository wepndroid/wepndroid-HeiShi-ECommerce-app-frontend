import { useTranslation } from 'react-i18next';
import {
  BUNDLE_FULL_PRICE,
  BundleMeta,
  bundleHasSoldItemsFromMeta,
  getRemainingBundlePriceFromMeta,
} from '../data/bundle';

export function useBundlePricing(meta?: BundleMeta | null) {
  const { t } = useTranslation();
  const resolved = meta ?? null;
  const fullPrice = resolved?.fullPrice ?? BUNDLE_FULL_PRICE;
  const remaining = resolved ? getRemainingBundlePriceFromMeta(resolved) : fullPrice;
  const hasSold = resolved ? bundleHasSoldItemsFromMeta(resolved) : false;
  const prefix = t('common.currencyPrefix');

  const priceLabel = hasSold
    ? t('products.bundle.remainingPrice', { amount: remaining })
    : t('products.bundle.fullPrice', { amount: fullPrice });

  const priceDetail = hasSold
    ? t('products.bundle.wasFullPrice', { amount: fullPrice })
    : null;

  return {
    fullPrice,
    remainingPrice: remaining,
    hasSoldItems: hasSold,
    priceLabel,
    priceDetail,
    pricePrefix: prefix,
  };
}
