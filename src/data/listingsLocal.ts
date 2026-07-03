import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateListingRequest } from '../api/types';
import { productImageUrls } from './productImages';
import type { BundleMeta } from './bundle';
import type { UiListing } from '../types';

const LISTINGS_KEY = 'localListings';

export interface LocalListingRecord {
  id: number;
  type: 'product' | 'service' | 'bundle' | 'job' | 'rental';
  title: string;
  description: string;
  price: number;
  categoryKey: string;
  tagKey: string;
  locationLabel: string;
  imageUrl: string;
  status: 'active' | 'draft' | 'inactive';
  sourceListingId?: number;
  bundleMeta?: BundleMeta;
}

async function readListings(): Promise<LocalListingRecord[]> {
  const raw = await AsyncStorage.getItem(LISTINGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalListingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeListings(listings: LocalListingRecord[]) {
  await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function mapLocalListingToUi(record: LocalListingRecord): UiListing {
  return {
    id: record.id,
    title: record.title,
    imageUrl: record.imageUrl,
    price: record.price,
    status: record.status,
  };
}

export async function listLocalListings(
  status?: 'active' | 'draft' | 'inactive',
): Promise<UiListing[]> {
  const listings = await readListings();
  const filtered = status ? listings.filter((item) => item.status === status) : listings;
  return filtered.map(mapLocalListingToUi);
}

export async function createLocalListing(
  body: CreateListingRequest,
  status: 'active' | 'draft' = 'active',
): Promise<UiListing> {
  const listings = await readListings();
  const id = (Date.now() % 900_000) + 2000;
  const bundleMeta =
    body.type === 'bundle' && body.bundleItems?.length
      ? {
          fullPrice: body.price,
          pickupDeadline: body.pickupDeadline,
          allowSeparateSale: body.allowSeparateSale ?? true,
          pickupWindow: body.pickupWindow,
          totalItems: body.bundleItems.length,
          coverImageUrls: body.imageUrls.filter(Boolean),
          items: body.bundleItems.map((item, index) => {
            const photos = item.imageUrls?.length
              ? item.imageUrls
              : item.imageUrl
                ? [item.imageUrl]
                : [];
            return {
              id: `local-${id}-${index}`,
              title: item.title,
              sharePrice: item.sharePrice,
              separatePrice: item.separatePrice,
              imageUrls: photos,
              imageUrl: photos[0],
              status: 'available' as const,
            };
          }),
        }
      : undefined;
  const record: LocalListingRecord = {
    id,
    type: body.type,
    title: body.title,
    description: body.description,
    price: body.price,
    categoryKey: body.categoryKey,
    tagKey: body.tagKey ?? 'lightlyUsed',
    locationLabel: body.locationLabel,
    imageUrl: body.imageUrls[0] ?? productImageUrls[1],
    status,
    bundleMeta,
  };
  await writeListings([record, ...listings]);
  return mapLocalListingToUi(record);
}

/** Active user-published listings, for merging into the mock feed/search. */
export async function listActiveLocalListingRecords(): Promise<LocalListingRecord[]> {
  const listings = await readListings();
  return listings.filter((item) => item.status === 'active');
}

export async function updateLocalListingStatus(
  listingId: number,
  status: 'active' | 'draft' | 'inactive',
): Promise<UiListing | null> {
  const listings = await readListings();
  const index = listings.findIndex((item) => item.id === listingId);
  if (index < 0) return null;
  const updated: LocalListingRecord = { ...listings[index], status };
  listings[index] = updated;
  await writeListings(listings);
  return mapLocalListingToUi(updated);
}

export async function deleteLocalListing(listingId: number): Promise<void> {
  const listings = await readListings();
  await writeListings(listings.filter((item) => item.id !== listingId));
}

export async function updateLocalListingPrice(
  listingId: number,
  price: number,
): Promise<UiListing | null> {
  const listings = await readListings();
  const index = listings.findIndex((item) => item.id === listingId);
  if (index < 0) return null;
  const current = listings[index];
  const bundleMeta = current.bundleMeta
    ? { ...current.bundleMeta, fullPrice: price }
    : undefined;
  const updated: LocalListingRecord = { ...current, price, bundleMeta };
  listings[index] = updated;
  await writeListings(listings);
  return mapLocalListingToUi(updated);
}

export async function createLocalResaleDraft(sourceListingId: number, title: string, price: number, imageUrl: string) {
  return createLocalListing(
    {
      type: 'product',
      title,
      description: `Resale draft from listing #${sourceListingId}`,
      price,
      categoryKey: 'misc',
      tagKey: 'lightlyUsed',
      locationLabel: 'Melbourne',
      imageUrls: [imageUrl],
    },
    'draft',
  );
}
