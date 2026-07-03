import { create } from 'zustand';
import i18n from '../i18n';
import { resolveSellerUserId, setFavorite, setFollow } from '../services/userDataService';
import { isCurrentUserSeller } from '../utils/sellerAvatar';
import { useAuthStore } from './authStore';
import { useCatalogStore } from './catalogStore';
import { nav } from './navigation';
import { toast } from './uiStore';

// Favorites (listing ids) + follows (seller user ids), with optimistic updates
// and rollback — same behavior the AppContext version had.
interface FavoritesState {
  favs: Set<number>;
  follows: Set<string>;
  setFavs: (favs: Set<number>) => void;
  setFollows: (follows: Set<string>) => void;
  toggleFavoriteById: (listingId: number) => Promise<void>;
  toggleFav: () => void;
  toggleFollow: (sellerKey: string, sellerUserId?: string, sellerName?: string) => Promise<void>;
  isFollowingSeller: (sellerKey: string) => boolean;
  isSelfSeller: (sellerKey: string, sellerUserId?: string, sellerName?: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favs: new Set<number>(),
  follows: new Set<string>(),
  setFavs: (favs) => set({ favs }),
  setFollows: (follows) => set({ follows }),

  toggleFavoriteById: async (listingId) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast(i18n.t('toast.loginRequired'));
      nav('login');
      return;
    }
    const isFav = get().favs.has(listingId);
    const delta = isFav ? -1 : 1;
    const bump = (count: number) => Math.max(0, count + delta);

    set((state) => {
      const next = new Set(state.favs);
      if (isFav) next.delete(listingId);
      else next.add(listingId);
      return { favs: next };
    });
    const catalog = useCatalogStore.getState();
    catalog.setProducts((prev) =>
      prev.map((p) => (p.id === listingId ? { ...p, favoriteCount: bump(p.favoriteCount ?? 0) } : p)),
    );
    catalog.setCurrentItem((prev) =>
      prev.id === listingId ? { ...prev, favoriteCount: bump(prev.favoriteCount ?? 0) } : prev,
    );

    try {
      const next = await setFavorite(listingId, !isFav, user != null);
      set({ favs: next });
      toast(i18n.t(isFav ? 'toast.unfavorited' : 'toast.favorited'));
    } catch {
      set((state) => {
        const reverted = new Set(state.favs);
        if (isFav) reverted.add(listingId);
        else reverted.delete(listingId);
        return { favs: reverted };
      });
      catalog.setProducts((prev) =>
        prev.map((p) =>
          p.id === listingId ? { ...p, favoriteCount: Math.max(0, (p.favoriteCount ?? 0) - delta) } : p,
        ),
      );
      catalog.setCurrentItem((prev) =>
        prev.id === listingId ? { ...prev, favoriteCount: Math.max(0, (prev.favoriteCount ?? 0) - delta) } : prev,
      );
      toast(i18n.t('toast.favoriteFailed'));
    }
  },

  toggleFav: () => {
    void get().toggleFavoriteById(useCatalogStore.getState().currentItem.id);
  },

  toggleFollow: async (sellerKey, sellerUserId, sellerName) => {
    const { authReady, user } = useAuthStore.getState();
    if (!authReady) return;
    if (!user) {
      toast(i18n.t('toast.loginRequired'));
      nav('login');
      return;
    }
    if (isCurrentUserSeller(user, sellerUserId, sellerKey, sellerName)) return;
    const userId = sellerUserId ?? resolveSellerUserId(sellerKey);
    const isFollowing = get().follows.has(userId);
    try {
      const next = await setFollow(sellerKey, !isFollowing, user != null);
      set({ follows: next });
      toast(i18n.t(isFollowing ? 'toast.unfollowedSeller' : 'toast.followedSeller'));
    } catch {
      toast(i18n.t('toast.followFailed'));
    }
  },

  isFollowingSeller: (sellerKey) => get().follows.has(resolveSellerUserId(sellerKey)),
  isSelfSeller: (sellerKey, sellerUserId, sellerName) => {
    const user = useAuthStore.getState().user;
    return user != null && isCurrentUserSeller(user, sellerUserId, sellerKey, sellerName);
  },
}));
