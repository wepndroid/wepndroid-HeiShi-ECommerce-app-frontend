import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDemoListingI18nKeys,
  resolveDemoSellerKey,
  sellerKeyFromUserId,
  shouldUseDemoI18n,
} from '../data/catalogDemo';
import { formatLocationLabel } from '../data/region';
import { Product } from '../types';

export interface LocalizedProduct extends Product {
  title: string;
  visual: string;
  cat: string;
  tag: string;
  desc: string;
  pricePrefix: string;
  seller: string;
  loc: string;
}

function resolveSellerLabel(product: Product, t: (key: string, opts?: { defaultValue?: string }) => string): string {
  const sellerKey =
    resolveDemoSellerKey(product.id) ??
    sellerKeyFromUserId(product.sellerKey) ??
    product.sellerKey;
  if (sellerKey && !sellerKey.includes('-')) {
    const fromKey = t(`sellers.${sellerKey}`, { defaultValue: '' });
    if (fromKey) return fromKey;
  }
  return product.seller;
}

function localizeProduct(
  product: Product,
  t: (key: string, opts?: { defaultValue?: string }) => string,
  prefix: string,
  language: string,
): LocalizedProduct {
  const id = product.id;
  const demoKeys = shouldUseDemoI18n(language, id) ? getDemoListingI18nKeys(id) : null;

  const title = demoKeys
    ? t(demoKeys.titleKey)
    : product.apiTitle ??
      (product.titleKey ? t(product.titleKey) : t(`products.items.${id}.title`, { defaultValue: String(id) }));

  const visual = demoKeys
    ? t(demoKeys.visualKey)
    : product.apiVisual ??
      product.apiTitle ??
      (product.visualKey ? t(product.visualKey) : t(`products.items.${id}.visual`, { defaultValue: title }));

  const desc = demoKeys
    ? t(demoKeys.descKey)
    : product.apiDesc ??
      (product.descKey ? t(product.descKey) : t(`products.items.${id}.desc`, { defaultValue: '' }));

  return {
    ...product,
    title,
    visual,
    cat: t(`categories.${product.catKey}`),
    tag: t(`tags.${product.tagKey}`),
    desc,
    pricePrefix: prefix,
    seller: resolveSellerLabel(product, t),
    loc: formatLocationLabel(product.loc),
  };
}

export function useLocalizedProduct(product: Product): LocalizedProduct {
  const { t, i18n } = useTranslation();
  return localizeProduct(product, t, t('common.currencyPrefix'), i18n.language);
}

export function useLocalizedProducts(products: Product[]): LocalizedProduct[] {
  const { t, i18n } = useTranslation();
  const prefix = t('common.currencyPrefix');
  return useMemo(
    () => products.map((product) => localizeProduct(product, t, prefix, i18n.language)),
    [i18n.language, prefix, products, t],
  );
}