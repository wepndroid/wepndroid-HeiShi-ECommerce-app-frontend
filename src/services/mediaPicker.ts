import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type PickedMedia = {
  uri: string;
  mimeType?: string;
  fileName?: string;
  type?: 'image' | 'video';
};

export const MAX_LISTING_PHOTOS = 9;

export class MediaPermissionError extends Error {
  constructor() {
    super('permission_denied');
    this.name = 'MediaPermissionError';
  }
}

function hasMediaLibraryAccess(response: ImagePicker.MediaLibraryPermissionResponse): boolean {
  if (response.granted) return true;
  if (response.status === ImagePicker.PermissionStatus.GRANTED) return true;
  if (response.accessPrivileges === 'all' || response.accessPrivileges === 'limited') return true;
  return false;
}

/** iOS/Android may require photo-library permission before the picker returns a readable URI. */
async function ensureLibraryPermission(): Promise<void> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (hasMediaLibraryAccess(current)) return;

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (hasMediaLibraryAccess(requested)) return;

  throw new MediaPermissionError();
}

export async function pickImagesFromLibrary(options: {
  max?: number;
  allowsMultiple?: boolean;
}): Promise<PickedMedia[]> {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    await ensureLibraryPermission();
  }

  const max = options.max ?? 1;
  const allowsMultiple = options.allowsMultiple ?? max > 1;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: allowsMultiple,
    selectionLimit: max,
    quality: 0.85,
    // LDPlayer / older Android: PickVisualMedia may be unavailable; legacy intent still works.
    ...(Platform.OS === 'android' ? { legacy: true } : {}),
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.slice(0, max).map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? undefined,
    fileName: asset.fileName ?? undefined,
    type: 'image' as const,
  }));
}

export async function pickVideoFromLibrary(): Promise<PickedMedia | undefined> {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    await ensureLibraryPermission();
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: false,
    quality: 1,
    videoMaxDuration: 600,
    ...(Platform.OS === 'android' ? { legacy: true } : {}),
  });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return undefined;
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? undefined,
    fileName: asset.fileName ?? undefined,
    type: 'video',
  };
}

/** Android gallery returns content:// URIs that RN fetch FormData cannot read — copy to cache first. */
function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

export async function prepareMediaForUpload(
  uri: string,
  fileName = 'photo.jpg',
): Promise<{ uri: string; fileName: string }> {
  const safeName = fileName?.match(/\.(jpe?g|png|webp|gif|mp4|mov|webm)$/i)
    ? fileName
    : `${(fileName ?? 'photo').replace(/\.\w+$/, '') || 'photo'}.jpg`;

  if (Platform.OS === 'web') {
    return { uri, fileName: safeName };
  }

  const needsCopy =
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    (Platform.OS === 'android' && !uri.startsWith('file://'));

  if (needsCopy) {
    if (!FileSystem.cacheDirectory) {
      throw new Error('upload_cache_unavailable');
    }
    const ext = safeName.match(/\.\w+$/)?.[0] ?? '.jpg';
    const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    const copied = await FileSystem.getInfoAsync(dest);
    if (!copied.exists) {
      throw new Error('upload_prepare_failed');
    }
    return { uri: ensureFileUri(dest), fileName: safeName };
  }

  return { uri: ensureFileUri(uri), fileName: safeName };
}
