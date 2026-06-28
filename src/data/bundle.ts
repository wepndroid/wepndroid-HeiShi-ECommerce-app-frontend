import { productImageUrls } from './productImages';
import { normalizeMediaUrls } from '../utils/mediaUrls';

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
  /** Cover/preview photos from the bundle publish form (not item photos). */
  coverImageUrls?: string[];
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
  const totalCents = Math.round(fullPrice * 100);
  const baseCents = Math.floor(totalCents / items.length);
  let extra = totalCents - baseCents * items.length;
  return items.map((item) => {
    const cents = baseCents + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    return { ...item, sharePrice: cents / 100 };
  });
}

export function buildBundleMeta(
  items: BundleLineItem[],
  fullPrice: number,
  options: {
    pickupDeadline?: string;
    allowSeparateSale?: boolean;
    pickupWindow?: string;
    coverImageUrls?: string[];
  } = {},
): BundleMeta {
  return {
    fullPrice,
    pickupDeadline: options.pickupDeadline,
    allowSeparateSale: options.allowSeparateSale ?? true,
    pickupWindow: options.pickupWindow,
    totalItems: items.length,
    coverImageUrls: options.coverImageUrls?.filter(Boolean),
    items,
  };
}

/** Infer cover/preview URLs for legacy bundles that merged cover + item photos in listing.images. */
export function inferBundleCoverImageUrls(
  listingUrls: string[],
  items: BundleLineItem[],
): string[] {
  const listing = normalizeMediaUrls(listingUrls);
  if (!listing.length) return [];

  const itemPhotos = items.flatMap((item) => normalizeMediaUrls(bundleItemImageUrls(item)));
  if (!itemPhotos.length) return listing;

  const itemSet = new Set(itemPhotos);
  const exclusive = listing.filter((url) => !itemSet.has(url));
  if (exclusive.length === listing.length) return listing;

  const naiveCoverLen = Math.max(listing.length - itemPhotos.length, 1);
  const covers = listing.slice(0, naiveCoverLen);
  if (
    covers.length < listing.length &&
    itemSet.has(listing[covers.length]) &&
    !covers.includes(listing[covers.length])
  ) {
    covers.push(listing[covers.length]);
  }
  if (covers.length) return covers;
  return exclusive.length ? exclusive : [listing[0]];
}

export function parseBundleMeta(raw: unknown, listingUrls?: string[]): BundleMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<BundleMeta>;
  if (!Array.isArray(data.items)) return null;
  const fullPrice = Number(data.fullPrice);
  if (!Number.isFinite(fullPrice)) return null;
  const items = data.items
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const row = item as Partial<BundleLineItem>;
      const imageUrls = normalizeMediaUrls(
        Array.isArray(row.imageUrls)
          ? row.imageUrls.filter((url): url is string => typeof url === 'string' && Boolean(url))
          : typeof row.imageUrl === 'string' && row.imageUrl
            ? [row.imageUrl]
            : [],
      );
      const title = String(row.title ?? '').trim();
      return {
        id: String(row.id ?? createBundleLineItem().id),
        title,
        sharePrice: Number(row.sharePrice) || 0,
        separatePrice: row.separatePrice != null ? Number(row.separatePrice) : undefined,
        imageUrls,
        imageUrl: imageUrls[0],
        status: (row.status as BundleItemStatus) ?? 'available',
      };
    });
  let coverImageUrls = normalizeMediaUrls(
    Array.isArray(data.coverImageUrls)
      ? data.coverImageUrls.filter((url): url is string => typeof url === 'string' && Boolean(url))
      : [],
  );
  if (!coverImageUrls.length && listingUrls?.length) {
    coverImageUrls = items.length
      ? inferBundleCoverImageUrls(listingUrls, items)
      : normalizeMediaUrls(listingUrls);
  }
  return {
    fullPrice,
    pickupDeadline: data.pickupDeadline,
    allowSeparateSale: data.allowSeparateSale ?? true,
    pickupWindow: data.pickupWindow,
    totalItems: data.totalItems ?? items.length,
    coverImageUrls,
    items,
  };
}

export function isBundleListingProduct(product: {
  listingType?: string;
  tagKey?: string;
  bundleMeta?: BundleMeta | null;
}): boolean {
  return (
    product.listingType === 'bundle' ||
    product.tagKey === 'bundleSet' ||
    (product.bundleMeta?.items?.length ?? 0) > 0
  );
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
    { allowSeparateSale: true, pickupDeadline: '2026-06-28', coverImageUrls: [productImageUrls[5]] },
  );
}

export function bundleMetaToLineItems(meta: BundleMeta): BundleLineItem[] {
  return meta.items.map((item) => ({
    ...item,
    ...patchBundleItemImages(normalizeMediaUrls(bundleItemImageUrls(item))),
  }));
}

export function getSoldBundleShareFromMeta(meta: BundleMeta): number {
  return meta.items
    .filter((item) => item.status === 'sold')
    .reduce((sum, item) => sum + item.sharePrice, 0);
}

export function getReservedBundleShareFromMeta(meta: BundleMeta): number {
  return meta.items
    .filter((item) => item.status === 'sold' || item.status === 'onHold')
    .reduce((sum, item) => sum + item.sharePrice, 0);
}

export function getRemainingBundlePriceFromMeta(meta: BundleMeta): number {
  return meta.fullPrice - getReservedBundleShareFromMeta(meta);
}

export function bundleHasOnHoldItemsFromMeta(meta: BundleMeta): boolean {
  return meta.items.some((item) => item.status === 'onHold');
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
