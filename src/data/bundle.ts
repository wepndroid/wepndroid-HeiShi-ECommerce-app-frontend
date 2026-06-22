import { productImageUrls } from './productImages';

export type BundleItemStatus = 'available' | 'onHold' | 'sold';

export type BundleItemKey = 'desk' | 'microwave' | 'chairs' | 'bedFrame';

export interface BundleLineItem {
  id: string;
  title: string;
  sharePrice: number;
  separatePrice?: number;
  /** Primary thumbnail — first entry in imageUrls. */
  imageUrl?: string;
  imageUrls?: string[];
  status: BundleItemStatus;
}

export interface BundleMeta {
  fullPrice: number;
  pickupDeadline?: string;
  allowSeparateSale: boolean;
  pickupWindow?: string;
  totalItems: number;
  items: BundleLineItem[];
}

/** @deprecated Demo-only typed keys for seeded Clayton bundle labels. */
export interface BundleItem {
  key: BundleItemKey;
  labelKey: `screens.bundle.${BundleItemKey}`;
  sharePrice: number;
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

export function createBundleLineItem(title = '', sharePrice = 0): BundleLineItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    sharePrice,
    imageUrls: [],
    status: 'available',
  };
}

export function bundleItemImageUrls(item: Pick<BundleLineItem, 'imageUrl' | 'imageUrls'>): string[] {
  const fromList = item.imageUrls?.filter(Boolean) ?? [];
  if (fromList.length) return fromList;
  return item.imageUrl ? [item.imageUrl] : [];
}

export function patchBundleItemImages(urls: string[]): Pick<BundleLineItem, 'imageUrl' | 'imageUrls'> {
  const clean = urls.filter(Boolean);
  return { imageUrls: clean, imageUrl: clean[0] };
}

export function sumBundleShares(items: Pick<BundleLineItem, 'sharePrice'>[]): number {
  return items.reduce((sum, item) => sum + (Number.isFinite(item.sharePrice) ? item.sharePrice : 0), 0);
}

export function distributeEvenShares(items: BundleLineItem[], fullPrice: number): BundleLineItem[] {
  if (!items.length) return items;
  const base = Math.floor((fullPrice / items.length) * 100) / 100;
  let remainder = Math.round((fullPrice - base * items.length) * 100) / 100;
  return items.map((item, index) => {
    const extra = remainder >= 0.01 ? 0.01 : 0;
    if (extra) remainder = Math.round((remainder - extra) * 100) / 100;
    return { ...item, sharePrice: Math.round((base + (index === 0 ? extra : 0)) * 100) / 100 };
  });
}

export function buildBundleMeta(
  items: BundleLineItem[],
  fullPrice: number,
  options: {
    pickupDeadline?: string;
    allowSeparateSale?: boolean;
    pickupWindow?: string;
  } = {},
): BundleMeta {
  return {
    fullPrice,
    pickupDeadline: options.pickupDeadline,
    allowSeparateSale: options.allowSeparateSale ?? true,
    pickupWindow: options.pickupWindow,
    totalItems: items.length,
    items,
  };
}

export function parseBundleMeta(raw: unknown): BundleMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<BundleMeta>;
  if (!Array.isArray(data.items) || typeof data.fullPrice !== 'number') return null;
  const items = data.items
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const row = item as Partial<BundleLineItem>;
      const imageUrls = Array.isArray(row.imageUrls)
        ? row.imageUrls.filter((url): url is string => typeof url === 'string' && Boolean(url))
        : typeof row.imageUrl === 'string' && row.imageUrl
          ? [row.imageUrl]
          : [];
      return {
        id: String(row.id ?? createBundleLineItem().id),
        title: String(row.title ?? '').trim(),
        sharePrice: Number(row.sharePrice) || 0,
        separatePrice: row.separatePrice != null ? Number(row.separatePrice) : undefined,
        imageUrls,
        imageUrl: imageUrls[0],
        status: (row.status as BundleItemStatus) ?? 'available',
      };
    })
    .filter((item) => item.title);
  if (!items.length) return null;
  return {
    fullPrice: data.fullPrice,
    pickupDeadline: data.pickupDeadline,
    allowSeparateSale: data.allowSeparateSale ?? true,
    pickupWindow: data.pickupWindow,
    totalItems: data.totalItems ?? items.length,
    items,
  };
}

export function demoBundleMeta(): BundleMeta {
  const itemImages: Record<BundleItemKey, string> = {
    desk: productImageUrls[5],
    microwave: productImageUrls[2],
    chairs: productImageUrls[10],
    bedFrame: productImageUrls[4],
  };
  return buildBundleMeta(
    bundleItems.map((item) => ({
      id: item.key,
      title: item.labelKey,
      sharePrice: item.sharePrice,
      separatePrice: item.separatePrice,
      imageUrls: [itemImages[item.key]],
      imageUrl: itemImages[item.key],
      status: item.status,
    })),
    BUNDLE_FULL_PRICE,
    { allowSeparateSale: true, pickupDeadline: '2026-06-28' },
  );
}

export function bundleMetaToLineItems(meta: BundleMeta): BundleLineItem[] {
  return meta.items.map((item) => ({ ...item }));
}

export function getSoldBundleShareFromMeta(meta: BundleMeta): number {
  return meta.items
    .filter((item) => item.status === 'sold')
    .reduce((sum, item) => sum + item.sharePrice, 0);
}

export function getRemainingBundlePriceFromMeta(meta: BundleMeta): number {
  return meta.fullPrice - getSoldBundleShareFromMeta(meta);
}

export function bundleHasSoldItemsFromMeta(meta: BundleMeta): boolean {
  return getSoldBundleShareFromMeta(meta) > 0;
}

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
