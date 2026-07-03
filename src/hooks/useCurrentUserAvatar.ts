import { useAuthStore } from '../store/authStore';
import { isCurrentUserSeller, normalizeAvatarUrl } from '../utils/sellerAvatar';

const useSessionUser = () => useAuthStore((s) => s.user);
const useProfileAvatarUrl = () => useAuthStore((s) => s.profileAvatarUrl);

/** Avatar URL for the signed-in user when they are the seller/author being rendered. */
export function useSellerAvatarFallback(
  sellerUserId?: string,
  sellerKey?: string,
  sellerName?: string,
): string | undefined {
  const user = useSessionUser();
  const profileAvatarUrl = useProfileAvatarUrl();
  if (!user || !isCurrentUserSeller(user, sellerUserId, sellerKey, sellerName)) {
    return undefined;
  }
  return normalizeAvatarUrl(user.avatarUrl ?? profileAvatarUrl);
}

export function useSessionAvatarUrl(): string | undefined {
  const user = useSessionUser();
  const profileAvatarUrl = useProfileAvatarUrl();
  return normalizeAvatarUrl(user?.avatarUrl ?? profileAvatarUrl);
}

/** @deprecated Use useSellerAvatarFallback */
export function useCurrentUserAvatar(userId?: string): string | undefined {
  const user = useSessionUser();
  const profileAvatarUrl = useProfileAvatarUrl();
  if (!userId || !user || userId !== user.id) return undefined;
  return normalizeAvatarUrl(user.avatarUrl ?? profileAvatarUrl);
}

export { isCurrentUserSeller } from '../utils/sellerAvatar';