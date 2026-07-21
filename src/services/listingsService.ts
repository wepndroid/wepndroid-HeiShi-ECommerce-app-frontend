import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { listingsApi } from '../api';
import { ApiError, apiRequest, getAuthRequestHeaders, isNetworkError } from '../api/client';
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
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'webm':
      return 'video/webm';
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

type MediaUploadSessionResponse = {
  id: string;
  status: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  processingError?: string | null;
  originalUrl?: string | null;
  variants?: Record<string, string>;
  uploadSession: {
    id: string;
    status: string;
    chunkUrl: string;
    finalizeUrl: string;
    bytesUploaded: number;
    totalBytes: number;
  };
  directUpload?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    publicUrl: string;
  };
};

const MEDIA_READY_STATES = new Set(['READY', 'DELETED']);
const MEDIA_FAILED_STATES = new Set([
  'FAILED',
  'UPLOAD_FAILED',
  'PROCESSING_FAILED',
  'MODERATION_FAILED',
]);

async function waitForMediaProcessing(
  initial: MediaUploadSessionResponse,
  allowRetry = true,
): Promise<MediaUploadSessionResponse> {
  let current = initial;
  const deadline = Date.now() + 5 * 60_000;
  while (!MEDIA_READY_STATES.has(current.status)) {
    if (current.status === 'REJECTED') {
      throw new ApiError(
        current.processingError ?? 'Media was rejected during moderation',
        422,
        'MEDIA_REJECTED',
      );
    }
    if (MEDIA_FAILED_STATES.has(current.status)) {
      if (!allowRetry) {
        throw new ApiError(
          current.processingError ?? 'Media processing failed',
          422,
          'MEDIA_PROCESSING_FAILED',
        );
      }
      current = await apiRequest<MediaUploadSessionResponse>(
        `/media/assets/${encodeURIComponent(current.id)}/retry`,
        { method: 'POST', timeoutMs: 30_000 },
      );
      allowRetry = false;
      continue;
    }
    if (Date.now() >= deadline) {
      throw new ApiError(
        'Media processing is taking longer than expected',
        408,
        'MEDIA_PROCESSING_TIMEOUT',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    current = await apiRequest<MediaUploadSessionResponse>(
      `/media/assets/${encodeURIComponent(current.id)}`,
      { timeoutMs: 30_000 },
    );
  }
  if (current.status === 'DELETED' && current.processingError?.startsWith('DUPLICATE_OF:')) {
    const duplicateId = current.processingError.slice('DUPLICATE_OF:'.length);
    const duplicate = await apiRequest<MediaUploadSessionResponse>(
      `/media/assets/${encodeURIComponent(duplicateId)}`,
      { timeoutMs: 30_000 },
    );
    // Historical duplicates may predate automatic moderation approval. Apply
    // the same readiness/moderation gate instead of bypassing it by returning
    // the duplicate response directly.
    return waitForMediaProcessing(duplicate, false);
  }
  if (current.moderationStatus !== 'approved') {
    throw new ApiError(
      current.processingError ?? 'Media moderation is still pending',
      409,
      'MEDIA_MODERATION_PENDING',
    );
  }
  return current;
}

async function readUploadBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  if (!blob.size) {
    throw new ApiError('Selected image is empty', 400, 'EMPTY_MEDIA');
  }
  return blob;
}

async function readUploadResponseError(response: Response): Promise<ApiError> {
  const text = await response.text();
  let message = `Upload failed (${response.status})`;
  let code: string | undefined;
  let details: unknown;
  try {
    const payload = JSON.parse(text) as {
      message?: string;
      code?: string;
      details?: unknown;
      detail?: { message?: string; code?: string; details?: unknown };
    };
    message = payload.message ?? payload.detail?.message ?? message;
    code = payload.code ?? payload.detail?.code;
    details = payload.details ?? payload.detail?.details;
  } catch {
    // Keep the HTTP-derived error when the storage provider returns plain text.
  }
  return new ApiError(message, response.status, code, details);
}

async function throwUploadResponse(response: Response): Promise<never> {
  throw await readUploadResponseError(response);
}

async function uploadDirectAsset(
  direct: NonNullable<MediaUploadSessionResponse['directUpload']>,
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (onProgress && typeof XMLHttpRequest !== 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open(direct.method || 'PUT', direct.url);
          for (const [key, value] of Object.entries(direct.headers ?? {})) {
            request.setRequestHeader(key, value);
          }
          request.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
              onProgress(Math.min(0.99, event.loaded / event.total));
            }
          };
          request.onerror = () => reject(new ApiError('Media upload failed', 0, 'NETWORK_ERROR'));
          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              onProgress(0.99);
              resolve();
            } else {
              reject(new ApiError(`Upload failed (${request.status})`, request.status));
            }
          };
          request.send(blob);
        });
      } else {
        const response = await fetch(direct.url, {
          method: direct.method || 'PUT',
          headers: direct.headers,
          body: blob,
        });
        if (!response.ok) await throwUploadResponse(response);
      }
      return;
    } catch (error) {
      lastError = error;
      if (
        error instanceof ApiError
        && error.status >= 400
        && error.status < 500
        && error.status !== 408
        && error.status !== 429
      ) {
        throw error;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ApiError('Media upload failed', 0, 'NETWORK_ERROR');
}

async function uploadResumableAsset(
  session: MediaUploadSessionResponse['uploadSession'],
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const authHeaders = await assertUploadAuthHeaders();
  const chunkSize = 4 * 1024 * 1024;
  let offset = Math.max(0, Math.min(session.bytesUploaded ?? 0, blob.size));
  onProgress?.(Math.min(0.99, offset / blob.size));
  while (offset < blob.size) {
    const chunk = blob.slice(offset, Math.min(offset + chunkSize, blob.size));
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(
          `${resolveApiBaseUrl()}${session.chunkUrl.replace(/^\/v1/, '')}?offset=${offset}`,
          {
            method: 'PUT',
            headers: {
              ...authHeaders,
              'Content-Type': 'application/octet-stream',
            },
            body: chunk,
          },
        );
        if (response.ok || response.status < 500) break;
      } catch {
        if (attempt === 2) {
          throw new ApiError('Media chunk upload failed', 0, 'NETWORK_ERROR');
        }
      }
    }
    if (!response?.ok) {
      if (response) {
        const error = await readUploadResponseError(response);
        const expectedOffset =
          error.details
          && typeof error.details === 'object'
          && 'expectedOffset' in error.details
            ? Number((error.details as { expectedOffset?: unknown }).expectedOffset)
            : Number.NaN;
        if (
          response.status === 409
          && error.code === 'UPLOAD_OFFSET_MISMATCH'
          && Number.isInteger(expectedOffset)
          && expectedOffset >= 0
          && expectedOffset <= blob.size
          && expectedOffset !== offset
        ) {
          offset = expectedOffset;
          onProgress?.(Math.min(0.99, offset / blob.size));
          continue;
        }
        throw error;
      }
      throw new ApiError('Media chunk upload failed', 0, 'NETWORK_ERROR');
    }
    offset += chunk.size;
    onProgress?.(Math.min(0.99, offset / blob.size));
  }
}

async function uploadListingAsset(
  localUri: string,
  mimeType = 'image/jpeg',
  fileName = 'photo.jpg',
  onProgress?: (progress: number) => void,
): Promise<string> {
  const prepared = await prepareMediaForUpload(localUri, fileName);
  const normalizedMime = inferUploadMimeType(prepared.fileName, mimeType);
  const blob = await readUploadBlob(prepared.uri);
  const mediaType = normalizedMime.startsWith('video/') ? 'video' : 'image';
  const resumeKey = [
    'heymarket:media-upload',
    mediaType,
    blob.size,
    encodeURIComponent(prepared.fileName),
    encodeURIComponent(prepared.uri.slice(-160)),
  ].join(':');
  let created: MediaUploadSessionResponse | null = null;
  if (mediaType === 'video') {
    const previousSessionId = await AsyncStorage.getItem(resumeKey);
    if (previousSessionId) {
      try {
        const resumable = await apiRequest<MediaUploadSessionResponse>(
          `/media/upload-sessions/${encodeURIComponent(previousSessionId)}`,
        );
        if (
          resumable.uploadSession.totalBytes === blob.size
          && ['PENDING_UPLOAD', 'UPLOADING', 'UPLOADED'].includes(
            resumable.uploadSession.status,
          )
        ) {
          created = resumable;
        } else {
          await AsyncStorage.removeItem(resumeKey);
        }
      } catch {
        // An expired or inaccessible server session cannot be resumed.
        await AsyncStorage.removeItem(resumeKey);
      }
    }
  }
  if (!created) {
    created = await apiRequest<MediaUploadSessionResponse>('/media/upload-sessions', {
      method: 'POST',
      body: {
        mediaType,
        contentType: normalizedMime,
        filename: prepared.fileName,
        fileSize: blob.size,
        // Prefer object-storage direct upload for a fresh video. If a previous
        // resumable session exists, it is restored above; local storage also
        // naturally falls back to the offset-checked chunk endpoint.
        resumablePreferred: mediaType === 'video',
      },
      timeoutMs: 30_000,
    });
    if (mediaType === 'video') {
      await AsyncStorage.setItem(resumeKey, created.uploadSession.id);
    }
  }
  let completed: MediaUploadSessionResponse;
  if (created.directUpload) {
    try {
      await uploadDirectAsset(created.directUpload, blob, onProgress);
      completed = await apiRequest<MediaUploadSessionResponse>(
        `/media/upload-sessions/${encodeURIComponent(created.uploadSession.id)}/complete`,
        {
          method: 'POST',
          body: { originalUrl: created.directUpload.publicUrl },
          timeoutMs: 30_000,
        },
      );
    } catch (directUploadError) {
      if (mediaType !== 'video') throw directUploadError;
      // A failed object-storage upload has no confirmed partial offset. Switch
      // the same durable session to the offset-checked multipart endpoint; any
      // later interruption resumes from the server-confirmed byte count.
      await AsyncStorage.setItem(resumeKey, created.uploadSession.id);
      await uploadResumableAsset(created.uploadSession, blob, onProgress);
      completed = await apiRequest<MediaUploadSessionResponse>(
        `/media/upload-sessions/${encodeURIComponent(created.uploadSession.id)}/finalize`,
        { method: 'POST', timeoutMs: 30_000 },
      );
    }
  } else {
    await uploadResumableAsset(created.uploadSession, blob, onProgress);
    completed = await apiRequest<MediaUploadSessionResponse>(
      `/media/upload-sessions/${encodeURIComponent(created.uploadSession.id)}/finalize`,
      { method: 'POST', timeoutMs: 30_000 },
    );
  }
  completed = await waitForMediaProcessing(completed);
  const url = completed.variants?.preview ?? completed.originalUrl;
  if (!url) {
    throw new ApiError('Media processing did not return a listing URL', 500, 'UPLOAD_INVALID_RESPONSE');
  }
  if (mediaType === 'video') {
    await AsyncStorage.removeItem(resumeKey);
  }
  onProgress?.(1);
  return assertPersistedUploadUrl(url);
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
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!isLoggedIn) throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  const headers = await getAuthRequestHeaders();
  if (!headers.Authorization) {
    throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  }
  return uploadListingAsset(localUri, mimeType, fileName, onProgress);
}

export async function uploadListingVideo(
  localUri: string,
  isLoggedIn: boolean,
  mimeType = 'video/mp4',
  fileName = 'video.mp4',
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!isLoggedIn) throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  const headers = await getAuthRequestHeaders();
  if (!headers.Authorization) {
    throw new Error('LISTING_UPLOAD_REQUIRES_AUTH');
  }
  return uploadListingAsset(localUri, mimeType, fileName, onProgress);
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
