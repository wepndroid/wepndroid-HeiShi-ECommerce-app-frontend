import type { ProductHeight } from '../types';
import { CARD_PREVIEW_ASPECT_RATIO } from '../theme';

/** Stable card preview ratio — reference art 211×329. */
export function fallbackCardAspectRatio(_height: ProductHeight, _productId: number): number {
  return CARD_PREVIEW_ASPECT_RATIO;
}

/** Fixed card preview aspect ratio for all listing thumbnails. */
export function useProductImageAspectRatio(
  _imageUrl: string,
  height: ProductHeight,
  productId: number,
): number {
  return fallbackCardAspectRatio(height, productId);
}
