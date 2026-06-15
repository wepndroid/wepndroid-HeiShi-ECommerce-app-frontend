import { useTranslation } from 'react-i18next';
import { Product } from '../types';

export interface LocalizedProduct extends Product {
  title: string;
  visual: string;
  cat: string;
  tag: string;
  desc: string;
  pricePrefix: string;
  seller: string;
}

export function useLocalizedProduct(product: Product): LocalizedProduct {
  const { t } = useTranslation();
  const id = product.id;
  const sellerFromKey = product.sellerKey
    ? t(`sellers.${product.sellerKey}`, { defaultValue: '' })
    : '';
  return {
    ...product,
    title:
      product.apiTitle ??
      (product.titleKey ? t(product.titleKey) : t(`products.items.${id}.title`)),
    visual:
      product.apiVisual ??
      product.apiTitle ??
      (product.visualKey ? t(product.visualKey) : t(`products.items.${id}.visual`)),
    cat: t(`categories.${product.catKey}`),
    tag: t(`tags.${product.tagKey}`),
    desc:
      product.apiDesc ??
      (product.descKey ? t(product.descKey) : t(`products.items.${id}.desc`)),
    pricePrefix: t('common.currencyPrefix'),
    seller: sellerFromKey || product.seller,
  };
}

export function useLocalizedProducts(products: Product[]): LocalizedProduct[] {
  const { t } = useTranslation();
  const prefix = t('common.currencyPrefix');
  return products.map((product) => {
    const sellerFromKey = product.sellerKey
      ? t(`sellers.${product.sellerKey}`, { defaultValue: '' })
      : '';
    return {
      ...product,
      title:
        product.apiTitle ??
        (product.titleKey ? t(product.titleKey) : t(`products.items.${product.id}.title`)),
      visual:
        product.apiVisual ??
        product.apiTitle ??
        (product.visualKey ? t(product.visualKey) : t(`products.items.${product.id}.visual`)),
      cat: t(`categories.${product.catKey}`),
      tag: t(`tags.${product.tagKey}`),
      desc:
        product.apiDesc ??
        (product.descKey ? t(product.descKey) : t(`products.items.${product.id}.desc`)),
      pricePrefix: prefix,
      seller: sellerFromKey || product.seller,
    };
  });
}
