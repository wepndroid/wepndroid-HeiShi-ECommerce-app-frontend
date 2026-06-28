import { useCallback, useState } from 'react';
import { pickImagesFromLibrary } from '../services/mediaPicker';
import { uploadAvatarImage } from '../services/listingsService';

export function useAvatarUpload(isLoggedIn: boolean) {
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    if (uploading) return null;

    setUploading(true);
    try {
      const picked = await pickImagesFromLibrary({ max: 1 });
      if (!picked.length) return null;

      const asset = picked[0];
      return await uploadAvatarImage(
        asset.uri,
        isLoggedIn,
        asset.mimeType,
        asset.fileName ?? 'avatar.jpg',
      );
    } finally {
      setUploading(false);
    }
  }, [isLoggedIn, uploading]);

  return { pickAndUpload, uploading };
}
