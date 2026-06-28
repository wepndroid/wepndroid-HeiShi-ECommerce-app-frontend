import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { searchCatalogByImage } from '../services/catalogService';
import { pickImagesFromLibrary } from '../services/mediaPicker';

export function usePhotoSearch() {
  const { t } = useTranslation();
  const {
    region,
    nav,
    toast,
    clearImageSearch,
    setImageSearchLoading,
    setImageSearchError,
    setImageSearchSession,
  } = useApp();

  return useCallback(async () => {
    try {
      const picked = await pickImagesFromLibrary({ max: 1 });
      if (!picked.length) return;

      clearImageSearch();
      setImageSearchLoading(true);
      setImageSearchError(false);
      nav('search');

      const { items, suggestedQuery, matchCount } = await searchCatalogByImage(region, picked[0]);
      setImageSearchSession(items, picked[0].uri, suggestedQuery);
      toast(t('toast.imageSearchDone', { count: matchCount }));
    } catch (error) {
      setImageSearchLoading(false);
      setImageSearchError(true);
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else {
        toast(t('toast.imageSearchFailed'));
      }
    }
  }, [
    region,
    nav,
    toast,
    clearImageSearch,
    setImageSearchLoading,
    setImageSearchError,
    setImageSearchSession,
    t,
  ]);
}
