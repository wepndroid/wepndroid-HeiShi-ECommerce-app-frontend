/** Shared media URL normalization for avatars, listing photos, etc. (LDPlayer-safe). */

import { normalizeAvatarUrl, isPersistedAvatarUrl } from './sellerAvatar';

export { normalizeAvatarUrl as normalizeMediaUrl, isPersistedAvatarUrl as isPersistedMediaUrl };

export function normalizeMediaUrls(urls?: string[] | null): string[] {
  return (urls ?? [])
    .map((url) => normalizeAvatarUrl(url))
    .filter((url): url is string => Boolean(url));
}

/** Merge imageUrl + images from API, normalize, and dedupe (LDPlayer-safe). */
export function collectMediaUrls(
  ...sources: Array<string | null | undefined | (string | null | undefined)[]>
): string[] {
  const raw: string[] = [];
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      for (const url of source) {
        if (url?.trim()) raw.push(url.trim());
      }
    } else if (source.trim()) {
      raw.push(source.trim());
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of normalizeMediaUrls(raw)) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}