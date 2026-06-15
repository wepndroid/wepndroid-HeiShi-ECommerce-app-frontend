import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateListingRequest } from '../api/types';
import { productImageUrls } from './productImages';
import type { UiListing } from '../types';

const LISTINGS_KEY = 'localListings';

export interface LocalListingRecord {
  id: number;
  type: 'product' | 'service';
  title: string;
  description: string;
  price: number;
  categoryKey: string;
  tagKey: string;
  locationLabel: string;
  imageUrl: string;
  status: 'active' | 'draft' | 'inactive';
  sourceListingId?: number;
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
  };
  await writeListings([record, ...listings]);
  return mapLocalListingToUi(record);
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

export async function uploadLocalImagePlaceholder(): Promise<string> {
  return productImageUrls[1];
}
