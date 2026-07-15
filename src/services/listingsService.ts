import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { listingsApi } from '../api';
import { ApiError, getAuthRequestHeaders, isNetworkError } from '../api/client';
import { resolveApiBaseUrl } from '../api/config';
import {
  mapDetailDtoToProduct,
  mapListingDtoToUiListing,
  mapListingToProduct,
} from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CreateListingRequest } from '../api/types';
import type { Product } from '../types';
import { prepareMediaForUpload } from './mediaPicker';
import { normalizeMediaUrl } from '../utils/mediaUrls';
import { isPersistedAvatarUrl } from '../utils/sellerAvatar';
import { demoMyListings } from '../data/myListingsDemo';
import {
  createLocalListing,
  createLocalResaleDraft,
  deleteLocalListing,
  listLocalListings,
  updateLocalListingPrice,
  updateLocalListingStatus,
} from '../data/listingsLocal';
import type { UiListing } from '../types';
import { invalidateCatalog } from '../utils/catalogSync';

function inferUploadMimeType(fileName: string, mimeType?: string): string {
  if (mimeType && mimeType !== 'application/octet-stream' && mimeType !== 'binary/octet-stream') {
    return mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function assertPersistedUploadUrl(url: string): string {
  const normalized = normalizeMediaUrl(url) ?? url.trim();
  if (!isPersistedAvatarUrl(normalized)) {
    throw new ApiError('Upload did not return a valid URL', 500, 'UPLOAD_INVALID_URL');
  }
  return normalized;
}

async function assertUploadAuthHeaders(): Promise<Record<string, string>> {
  const headers = await getAuthRequestHeaders();
  if (!headers.Authorization) {
    throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return headers;
}

function parseNativeUploadBody(body: string, status: number): string {
  if (status < 200 || status >= 300) {
    let message = `Upload failed (${status})`;
    let code: string | undefined;
    try {
      const parsed = JSON.parse(body) as { message?: string; code?: string };
      message = parsed.message ?? message;
      code = parsed.code;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(message, status, code);
  }

  let payload: { url?: string };
  try {
    payload = JSON.parse(body || '{}') as { url?: string };
  } catch {
    throw new ApiError('Invalid upload response', status, 'UPLOAD_INVALID_RESPONSE');
  }
  if (!payload.url) {
    throw new ApiError('Upload did not return a URL', status, 'UPLOAD_INVALID_RESPONSE');
  }
  return assertPersistedUploadUrl(payload.url);
}

async function uploadImageViaNative(fileUri: string, mimeType: string): Promise<string> {
  const headers = await assertUploadAuthHeaders();
  const result = await FileSystem.uploadAsync(`${resolveApiBaseUrl()}/uploads/images`, fileUri, {
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers,
  });
  return parseNativeUploadBody(result.body, result.status);
}

async function uploadImageViaFetch(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  await assertUploadAuthHeaders();
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  const result = await listingsApi.uploadImage(formData);
  return assertPersistedUploadUrl(result.url);
}

async function uploadImageToServer(
  localUri: string,
  mimeType = 'image/jpeg',
  fileName = 'photo.jpg',
): Promise<string> {
  const prepared = await prepareMediaForUpload(localUri, fileName);
  const normalizedMime = inferUploadMimeType(prepared.fileName, mimeType);

  if (Platform.OS === 'web') {
    return uploadImageViaFetch(prepared.uri, prepared.fileName, normalizedMime);
  }

  // LDPlayer / Android: fetch multipart is more reliable than FileSystem.uploadAsync.
  if (Platform.OS === 'android') {
    try {
      return await uploadImageViaFetch(prepared.uri, prepared.fileName, normalizedMime);
    } catch (fetchError) {
      try {
        return await uploadImageViaNative(prepared.uri, normalizedMime);
      } catch {
        throw fetchError;
      }
    }
  }

  try {
    return await uploadImageViaNative(prepared.uri, normalizedMime);
  } catch (nativeError) {
    try {
      return await uploadImageViaFetch(prepared.uri, prepared.fileName, normalizedMime);
    } catch {
      throw nativeError;
    }
  }
}

/** Upload profile avatar — must succeed on the server; never returns a local file URI. */
export async function uploadAvatarImage(
  localUri: string,
  isLoggedIn: boolean,
  mimeType = 'image/jpeg',
  fileName = 'avatar.jpg',
): Promise<string> {
  if (!isLoggedIn) throw new Error('AVATAR_UPLOAD_REQUIRES_AUTH');
  return uploadImageToServer(localUri, mimeType, fileName);
}

export async function uploadListingImage(
  localUri: string,
  isLoggedIn: boolean,
  mimeType = 'image/jpeg',
  fileName = 'photo.jpg',
): Promise<string> {
  if (!isLoggedIn) throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  const headers = await getAuthRequestHeaders();
  if (!headers.Authorization) {
    // Mock/offline demo session has no bearer token — keep the picked local URI.
    if (API_USE_MOCK_FALLBACK) return localUri;
    throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  }
  try {
    return await uploadImageToServer(localUri, mimeType, fileName);
  } catch (err) {
    // Backend unreachable in mock dev — compose the listing with the local URI.
    if (API_USE_MOCK_FALLBACK && isNetworkError(err)) return localUri;
    throw err;
  }
}

function assertPersistedListingImages(imageUrls: string[]): void {
  if (!imageUrls.length || imageUrls.some((url) => !isPersistedAvatarUrl(url))) {
    throw new Error('publish_image_upload_required');
  }
}

export async function publishListing(
  body: CreateListingRequest,
  isLoggedIn: boolean,
): Promise<UiListing> {
  if (isLoggedIn) {
    // On a real backend, images must be uploaded first. In mock dev, local URIs are fine.
    if (body.status !== 'draft' && !API_USE_MOCK_FALLBACK) {
      assertPersistedListingImages(body.imageUrls);
    }
    try {
      const dto = await listingsApi.create(body);
      invalidateCatalog();
      return mapListingDtoToUiListing(dto);
    } catch (err) {
      if (err instanceof ApiError && !isNetworkError(err)) {
        if (err.code === 'IDENTITY_REQUIRED') throw new Error('identity_required');
        if (err.code === 'BLOCKED_CONTENT') throw err;
        throw err;
      }
      // Network error (backend unreachable): fall through to the local mock create below.
      if (!API_USE_MOCK_FALLBACK) throw new Error('publish_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    const listing = await createLocalListing(body, body.status ?? 'active');
    invalidateCatalog();
    return listing;
  }

  throw new Error('publish_failed');
}

export async function publishServiceListing(
  body: CreateListingRequest,
  isLoggedIn: boolean,
): Promise<UiListing> {
  return publishListing({ ...body, type: 'service' }, isLoggedIn);
}

export async function publishBundleListing(
  body: CreateListingRequest,
  isLoggedIn: boolean,
): Promise<UiListing> {
  return publishListing({ ...body, type: 'bundle', tagKey: body.tagKey ?? 'bundleSet' }, isLoggedIn);
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
      const dto = await listingsApi.createResaleDraft(sourceListingId, { title, price });
      invalidateCatalog();
      return mapListingDtoToUiListing(dto);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'RESALE_EXISTS') throw new Error('resale_exists');
        if (err.code === 'FORBIDDEN') throw new Error('resale_forbidden');
      }
      if (!API_USE_MOCK_FALLBACK) throw new Error('resale_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    const listing = await createLocalResaleDraft(sourceListingId, title, price, imageUrl);
    invalidateCatalog();
    return listing;
  }

  throw new Error('resale_failed');
}

export async function deleteListing(listingId: number, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await listingsApi.remove(listingId);
      invalidateCatalog();
      return;
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) throw err;
    }
  }

  await deleteLocalListing(listingId);
  invalidateCatalog();
}

export async function fetchMyListingDetail(
  listingId: number,
  isLoggedIn: boolean,
): Promise<Product | null> {
  if (!isLoggedIn) return null;
  try {
    const dto = await listingsApi.getById(listingId);
    return mapDetailDtoToProduct(dto);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    if (!API_USE_MOCK_FALLBACK) throw err;
    return null;
  }
}

export async function updateListing(
  listingId: number,
  body: Partial<CreateListingRequest>,
  isLoggedIn: boolean,
): Promise<UiListing> {
  if (isLoggedIn) {
    try {
      const dto = await listingsApi.update(listingId, body);
      invalidateCatalog();
      return mapListingDtoToUiListing(dto);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'LISTING_HAS_ORDERS') throw new Error('listing_has_orders');
        if (err.code === 'INVALID_STATE' || err.code === 'LISTING_SOLD') {
          throw new Error('listing_edit_blocked');
        }
      }
      if (API_USE_MOCK_FALLBACK) {
        if (body.price != null) {
          const local = await updateLocalListingPrice(listingId, body.price);
          if (local) {
            invalidateCatalog();
            return local;
          }
        }
        if (body.status === 'active' || body.status === 'draft') {
          const local = await updateLocalListingStatus(listingId, body.status);
          if (local) {
            invalidateCatalog();
            return local;
          }
        }
      }
      if (!API_USE_MOCK_FALLBACK) throw new Error('update_failed');
    }
  }

  throw new Error('update_failed');
}

export async function getMyListings(
  status: 'active' | 'draft' | 'inactive' | undefined,
  isLoggedIn: boolean,
): Promise<UiListing[]> {
  if (isLoggedIn) {
    try {
      const items: UiListing[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await listingsApi.getMine({ status, page, pageSize: 50 });
        items.push(...result.items.map(mapListingDtoToUiListing));
        hasMore = result.hasMore;
        page += 1;
      }
      return items;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('listings_load_failed');
      return mergeDemoMyListings(status);
    }
  }

  const local = await listLocalListings(status);
  return local.length > 0 ? local : mergeDemoMyListings(status);
}

function mergeDemoMyListings(status: 'active' | 'draft' | 'inactive' | undefined): UiListing[] {
  if (!API_USE_MOCK_FALLBACK) return [];
  return demoMyListings(status);
}

export async function getSoldListings(isLoggedIn: boolean): Promise<UiListing[]> {
  if (isLoggedIn) {
    try {
      const items: UiListing[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 25) {
        const result = await listingsApi.getSold({ page, pageSize: 50 });
        items.push(...result.items.map(mapListingDtoToUiListing));
        hasMore = result.hasMore;
        page += 1;
      }
      return items;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('sold_listings_load_failed');
    }
  }

  return [];
}

export { mapListingToProduct };
