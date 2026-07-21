import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { pickVideoFromLibrary } from '../services/mediaPicker';
import { uploadListingVideo } from '../services/listingsService';

export function useListingVideo(
  isLoggedIn: boolean,
  onToast: (message: string) => void,
) {
  const { t } = useTranslation();
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const addVideoFromLibrary = useCallback(async () => {
    if (uploadingVideo) return;
    if (!isLoggedIn) {
      onToast(t('toast.loginRequired'));
      return;
    }
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const picked = await pickVideoFromLibrary();
      if (!picked) return;
      const url = await uploadListingVideo(
        picked.uri,
        isLoggedIn,
        picked.mimeType,
        picked.fileName,
        setVideoUploadProgress,
      );
      setVideoUrls([url]);
      onToast(t('toast.videoAdded'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        onToast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof ApiError && error.code === 'MEDIA_PROCESSING_FAILED') {
        onToast(t('toast.videoProcessingFailed'));
      } else if (error instanceof ApiError && error.code === 'MEDIA_REJECTED') {
        onToast(t('toast.mediaRejected', { reason: error.message }));
      } else if (error instanceof ApiError && error.code === 'MEDIA_MODERATION_PENDING') {
        onToast(t('toast.mediaModerationPending'));
      } else {
        onToast(t('toast.videoUploadFailed'));
      }
    } finally {
      setUploadingVideo(false);
    }
  }, [isLoggedIn, onToast, t, uploadingVideo]);

  return {
    videoUrls,
    setVideoUrls,
    uploadingVideo,
    videoUploadProgress,
    addVideoFromLibrary,
  };
}
