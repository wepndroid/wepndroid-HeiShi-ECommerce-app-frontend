import type { Product } from '../types';

export function resolveProductImages(
  product: Pick<Product, 'imageUrl' | 'imageUrls'>,
): string[] {
  const urls = product.imageUrls?.filter((url) => url.length > 0) ?? [];
  if (urls.length) return urls;
  return product.imageUrl ? [product.imageUrl] : [];
}