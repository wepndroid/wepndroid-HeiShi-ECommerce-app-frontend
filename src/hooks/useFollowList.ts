import React from 'react';
import i18n from '../i18n';
import { followsApi } from '../api';
import type { FollowDto } from '../api/types';
import { API_USE_MOCK_FALLBACK } from '../api/config';

export function useFollowList(isLoggedIn: boolean) {
  const [items, setItems] = React.useState<FollowDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const all: FollowDto[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 25) {
          const result = await followsApi.list({ page, pageSize: 100 });
          all.push(...result.items);
          hasMore = result.hasMore;
          page += 1;
        }
        if (!cancelled) setItems(all);
      } catch {
        if (!cancelled && !API_USE_MOCK_FALLBACK) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, i18n.language]);

  return { items, loading };
}
