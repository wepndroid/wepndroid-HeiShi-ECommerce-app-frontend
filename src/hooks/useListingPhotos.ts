import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_LISTING_PHOTOS, pickImagesFromLibrary } from '../services/mediaPicker';
import { ApiError } from '../api/client';
import { uploadListingImage } from '../services/listingsService';

export function useListingPhotos(
  isLoggedIn: boolean,
  onToast: (message: string) => void,
  maxPhotos = MAX_LISTING_PHOTOS,
) {
  const { t } = useTranslation();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addPhotosFromLibrary = useCallback(async () => {
    if (uploading) return;
    if (!isLoggedIn) {
      onToast(t('toast.loginRequired'));
      return;
    }
    const remaining = maxPhotos - imageUrls.length;
    const replaceSingle = maxPhotos === 1 && imageUrls.length >= 1;

    if (remaining <= 0 && !replaceSingle) {
      onToast(t('toast.photoLimit', { count: maxPhotos }));
      return;
    }

    setUploading(true);
    try {
      const picked = await pickImagesFromLibrary({
        max: replaceSingle ? 1 : remaining,
        allowsMultiple: !replaceSingle && remaining > 1,
      });
      if (!picked.length) return;

      const uploaded: string[] = [];
      for (const asset of picked) {
        const url = await uploadListingImage(
          asset.uri,
          isLoggedIn,
          asset.mimeType,
          asset.fileName,
        );
        uploaded.push(url);
      }
      setImageUrls((prev) => (replaceSingle ? uploaded : [...prev, ...uploaded]));
      onToast(t('toast.photoAdded'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        onToast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof Error && error.message === 'LISTING_UPLOAD_REQUIRES_AUTH') {
        onToast(t('toast.loginRequired'));
      } else if (error instanceof ApiError) {
        if (error.status === 401) {
          onToast(t('toast.loginRequired'));
        } else if (error.code === 'VALIDATION_ERROR' || error.status === 400) {
          onToast(t('toast.uploadFailed'));
        } else {
          onToast(t('toast.uploadFailed'));
        }
      } else if (error instanceof Error && error.name === 'AbortError') {
        onToast(t('toast.uploadFailed'));
      } else {
        onToast(t('toast.uploadFailed'));
      }
    } finally {
      setUploading(false);
    }
  }, [imageUrls.length, isLoggedIn, maxPhotos, onToast, t, uploading]);

  return {
    imageUrls,
    setImageUrls,
    uploading,
    addPhotosFromLibrary,
    maxPhotos,
  };
}