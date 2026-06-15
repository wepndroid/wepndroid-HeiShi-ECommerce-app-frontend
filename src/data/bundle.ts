export type BundleItemStatus = 'available' | 'onHold' | 'sold';

export type BundleItemKey = 'desk' | 'microwave' | 'chairs' | 'bedFrame';

export interface BundleItem {
  key: BundleItemKey;
  labelKey: `screens.bundle.${BundleItemKey}`;
  /** Portion of the full bundle price removed when this item is sold separately. */
  sharePrice: number;
  /** Shown on the line item when still available for separate purchase. */
  separatePrice?: number;
  status: BundleItemStatus;
}

/** Demo Clayton 2BR clearance — 12 items total; 4 shown on the detail page. */
export const BUNDLE_FULL_PRICE = 260;

export const BUNDLE_TOTAL_ITEMS = 12;

export const bundleItems: BundleItem[] = [
  {
    key: 'desk',
    labelKey: 'screens.bundle.desk',
    sharePrice: 35,
    separatePrice: 35,
    status: 'available',
  },
  {
    key: 'microwave',
    labelKey: 'screens.bundle.microwave',
    sharePrice: 45,
    status: 'onHold',
  },
  {
    key: 'chairs',
    labelKey: 'screens.bundle.chairs',
    sharePrice: 20,
    separatePrice: 20,
    status: 'available',
  },
  {
    key: 'bedFrame',
    labelKey: 'screens.bundle.bedFrame',
    sharePrice: 40,
    status: 'sold',
  },
];

export function getSoldBundleShare(items: BundleItem[] = bundleItems): number {
  return items
    .filter((item) => item.status === 'sold')
    .reduce((sum, item) => sum + item.sharePrice, 0);
}

export function getRemainingBundlePrice(items: BundleItem[] = bundleItems): number {
  return BUNDLE_FULL_PRICE - getSoldBundleShare(items);
}

export function bundleHasSoldItems(items: BundleItem[] = bundleItems): boolean {
  return getSoldBundleShare(items) > 0;
}
