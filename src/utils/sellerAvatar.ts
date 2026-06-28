import { Platform } from 'react-native';
import { resolveApiBaseUrl } from '../api/config';
import { isDemoCatalogListing } from '../data/catalogDemo';
import { avatarKeyFromId, personAvatarUrlForKey } from '../data/avatarPhotos';
import { resolveSellerUserId } from '../data/follows';
import type { AuthUser } from '../data/auth';
import type { Product } from '../types';

function apiMediaRoot(): string {
  return resolveApiBaseUrl().replace(/\/v1\/?$/, '');
}

function rewriteUploadUrl(trimmed: string): string | null {
  if (trimmed.startsWith('/uploads/')) {
    return `${apiMediaRoot()}${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      const root = new URL(`${apiMediaRoot()}/`);
      return `${root.origin}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // not an absolute URL
  }
  if (trimmed.startsWith('http://localhost/')) {
    const path = trimmed.slice('http://localhost'.length);
    return `${apiMediaRoot()}${path}`;
  }
  return null;
}

/** Normalize avatar/listing media URLs for display (LDPlayer + web dev port/host). */
export function normalizeAvatarUrl(url?: string | null): string | undefined {
  if (!url?.trim() || url.startsWith('file://') || url.startsWith('content://')) return undefined;

  const trimmed = url.trim();
  const uploadUrl = rewriteUploadUrl(trimmed);
  if (uploadUrl) return uploadUrl;

  if (Platform.OS !== 'web' && trimmed.includes('://localhost:')) {
    return trimmed.replace('://localhost:', '://127.0.0.1:');
  }
  if (Platform.OS === 'web' && trimmed.includes('://127.0.0.1:')) {
    try {
      const root = new URL(`${apiMediaRoot()}/`);
      if (root.hostname === 'localhost') {
        return trimmed.replace('://127.0.0.1:', '://localhost:');
      }
    } catch {
      // keep original
    }
  }

  return trimmed;
}

/** True when the URL can be stored and loaded on other devices (not a local picker URI). */
export function isPersistedAvatarUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/')
  );
}

export function isCurrentUserSeller(
  user: AuthUser,
  sellerUserId?: string,
  sellerKey?: string,
  sellerName?: string,
): boolean {
  if (sellerUserId && sellerUserId === user.id) return true;
  if (sellerKey) {
    if (sellerKey === user.id) return true;
    if (resolveSellerUserId(sellerKey) === user.id) return true;
  }
  return false;
}

/** Attach session avatar + seller id when the signed-in user owns the listing. */
export function enrichSelfSellerProduct(product: Product, user: AuthUser | null): Product {
  if (!user || !isCurrentUserSeller(user, product.sellerUserId, product.sellerKey, product.seller)) {
    return product;
  }
  const avatar = user.avatarUrl ?? product.sellerAvatarUrl;
  return {
    ...product,
    sellerUserId: product.sellerUserId ?? user.id,
    sellerAvatarUrl: avatar,
  };
}

/** Portrait URL for a seller when the API provides a profile photo or demo catalog listing. */
export function resolveSellerAvatarUrl(
  sellerKey: string,
  seller: string,
  avatarUrl?: string,
  displaySize = 40,
  listingId?: number,
  fallbackAvatarUrl?: string,
): string | undefined {
  const normalized = normalizeAvatarUrl(avatarUrl) ?? normalizeAvatarUrl(fallbackAvatarUrl);
  if (normalized) return normalized;
  if (listingId != null && isDemoCatalogListing(listingId)) {
    return personAvatarUrlForKey(sellerKey || seller, displaySize);
  }
  return undefined;
}

export function resolveUserAvatarUrl(
  userId: string,
  avatarUrl?: string,
  displaySize = 68,
  fallbackAvatarUrl?: string,
): string | undefined {
  const normalized = normalizeAvatarUrl(avatarUrl) ?? normalizeAvatarUrl(fallbackAvatarUrl);
  if (normalized) return normalized;
  const demoKey = avatarKeyFromId(userId);
  if (demoKey !== 'default') {
    return personAvatarUrlForKey(userId, displaySize);
  }
  return undefined;
}
