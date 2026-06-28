import { isDemoCatalogListing } from '../data/catalogDemo';
import { isBundleListingProduct, inferBundleCoverImageUrls } from '../data/bundle';
import { productGalleryUrls } from '../data/productImages';
import type { Product } from '../types';
import { collectMediaUrls, normalizeMediaUrl, normalizeMediaUrls } from './mediaUrls';

/** Normalize listing photo URLs for display (LDPlayer / relative /uploads paths). */
export function normalizeListingImageUrl(url?: string | null): string | undefined {
  return normalizeMediaUrl(url);
}

export function resolveProductImages(
  product: Pick<Product, 'id' | 'imageUrl' | 'imageUrls' | 'listingType' | 'bundleMeta'>,
): string[] {
  if (isBundleListingProduct(product)) {
    return resolveBundleCoverImages(product);
  }
  const normalized = collectMediaUrls(product.imageUrls, product.imageUrl);
  if (normalized.length) return normalized;

  if (isDemoCatalogListing(product.id)) {
    return productGalleryUrls(product.id);
  }
  return [];
}

/** Bundle listing hero — cover/preview only, excluding per-item photos. */
export function resolveBundleCoverImages(
  product: Pick<Product, 'imageUrl' | 'imageUrls' | 'bundleMeta'>,
): string[] {
  const listingUrls = collectMediaUrls(product.imageUrls, product.imageUrl);
  const items = product.bundleMeta?.items ?? [];

  const fromMeta = normalizeMediaUrls(product.bundleMeta?.coverImageUrls);
  if (fromMeta.length) return fromMeta;

  if (items.length) {
    return inferBundleCoverImageUrls(listingUrls, items);
  }

  // Bundle meta not loaded yet — never show merged listing + item photos.
  return listingUrls.length ? [listingUrls[0]] : [];
}
