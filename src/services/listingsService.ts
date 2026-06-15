import { listingsApi } from '../api';
import {
  mapListingDtoToUiListing,
  mapListingToProduct,
} from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CreateListingRequest } from '../api/types';
import {
  createLocalListing,
  createLocalResaleDraft,
  listLocalListings,
  uploadLocalImagePlaceholder,
} from '../data/listingsLocal';
import type { UiListing } from '../types';

export async function uploadListingImage(
  _localUri: string | undefined,
  isLoggedIn: boolean,
): Promise<string> {
  if (isLoggedIn) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: _localUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      const result = await listingsApi.uploadImage(formData);
      return result.url;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('upload_failed');
    }
  }

  return uploadLocalImagePlaceholder();
}

export async function publishListing(
  body: CreateListingRequest,
  isLoggedIn: boolean,
): Promise<UiListing> {
  if (isLoggedIn) {
    try {
      const dto = await listingsApi.create(body);
      return mapListingDtoToUiListing(dto);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('publish_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return createLocalListing(body, 'active');
  }

  throw new Error('publish_failed');
}

export async function publishServiceListing(
  body: CreateListingRequest,
  isLoggedIn: boolean,
): Promise<UiListing> {
  return publishListing({ ...body, type: 'service' }, isLoggedIn);
}

export async function createResaleDraft(
  sourceListingId: number,
  title: string,
  price: number,
  imageUrl: string,
  isLoggedIn: boolean,
): Promise<UiListing> {
  if (isLoggedIn) {
    try {
      const dto = await listingsApi.createResaleDraft(sourceListingId);
      return mapListingDtoToUiListing(dto);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('resale_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return createLocalResaleDraft(sourceListingId, title, price, imageUrl);
  }

  throw new Error('resale_failed');
}

export async function getMyListings(
  status: 'active' | 'draft' | 'inactive' | undefined,
  isLoggedIn: boolean,
): Promise<UiListing[]> {
  if (isLoggedIn) {
    try {
      const result = await listingsApi.getMine({ status, pageSize: 50 });
      return result.items.map(mapListingDtoToUiListing);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  return listLocalListings(status);
}

export async function getSoldListings(isLoggedIn: boolean): Promise<UiListing[]> {
  if (isLoggedIn) {
    try {
      const result = await listingsApi.getSold({ pageSize: 50 });
      return result.items.map(mapListingDtoToUiListing);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  return [];
}

export { mapListingToProduct };
