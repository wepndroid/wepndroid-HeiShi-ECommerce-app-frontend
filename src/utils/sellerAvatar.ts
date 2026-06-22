import { personAvatarUrlForKey } from '../data/avatarPhotos';

/** Portrait URL for a seller or user when the API has no profile photo. */
export function resolveSellerAvatarUrl(
  sellerKey: string,
  seller: string,
  avatarUrl?: string,
  displaySize = 40,
): string {
  if (avatarUrl) return avatarUrl;
  return personAvatarUrlForKey(sellerKey || seller, displaySize);
}

export function resolveUserAvatarUrl(userId: string, avatarUrl?: string, displaySize = 68): string {
  if (avatarUrl) return avatarUrl;
  return personAvatarUrlForKey(userId, displaySize);
}