import { Platform } from 'react-native';
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
} from '../data/listingsLocal';
import type { UiListing } from '../types';

export async function uploadListingImage(
  localUri: string,
  isLoggedIn: boolean,
  mimeType = 'image/jpeg',
  fileName = 'photo.jpg',
): Promise<string> {
  if (isLoggedIn) {
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(localUri);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', {
          uri: localUri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob);
      }
      const result = await listingsApi.uploadImage(formData);
      return result.url;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('upload_failed');
    }
  }

  return localUri;
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
