import React from 'react';
import { useTranslation } from 'react-i18next';
import { catalogApi, type PlatformBannerDto } from '../api/endpoints/catalog';
import { normalizeMediaUrl } from '../utils/mediaUrls';

export function useHomeBanners(position = 'home') {
  const { i18n } = useTranslation();
  const [banner, setBanner] = React.useState<PlatformBannerDto | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void catalogApi
      .getBanners(position)
      .then((result) => {
        if (cancelled) return;
        const first = result.items[0];
        if (!first?.imageUrl) {
          setBanner(null);
          return;
        }
        setBanner({
          ...first,
          imageUrl: normalizeMediaUrl(first.imageUrl) ?? first.imageUrl,
        });
      })
      .catch(() => {
        if (!cancelled) setBanner(null);
      });
    return () => {
      cancelled = true;
    };
  }, [i18n.language, position]);

  return banner;
}
