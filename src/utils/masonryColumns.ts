import type { Product } from '../types';
import { CARD_PREVIEW_ASPECT_RATIO } from '../theme';

/** Text block + card padding + bottom margin, normalized to one column width unit. */
const CARD_BODY_RELATIVE = 0.62;

export function estimateProductCardRelativeHeight(_product: Product): number {
  return 1 / CARD_PREVIEW_ASPECT_RATIO + CARD_BODY_RELATIVE;
}

export function splitMasonryColumns<T>(
  items: T[],
  estimateHeight: (item: T) => number,
): { left: T[]; right: T[] } {
  const left: T[] = [];
  const right: T[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  for (const item of items) {
    const height = estimateHeight(item);
    if (leftHeight <= rightHeight) {
      left.push(item);
      leftHeight += height;
    } else {
      right.push(item);
      rightHeight += height;
    }
  }

  return { left, right };
}

export function splitProductMasonryColumns<T extends Product>(products: T[]): { left: T[]; right: T[] } {
  return splitMasonryColumns(products, estimateProductCardRelativeHeight);
}
