import { create } from 'zustand';
import { router, type Href } from 'expo-router';
import { products as defaultProducts } from '../data/products';
import { resolveDetailProduct } from '../data/detailProducts';
import { isBundleListingProduct } from '../data/bundle';
import { mergeProducts } from '../api/mappers';
import {
  fetchListingsByIds,
  mockCatalogProducts,
  resolveListingDetail,
} from '../services/catalogService';
import { fetchMyListingDetail } from '../services/listingsService';
import {
  recordListingView,
  resolveSellerUserId,
} from '../services/userDataService';
import { invalidateCatalog } from '../utils/catalogSync';
import { screenPath } from '../routing/paths';
import { enrichSelfSellerProduct, isCurrentUserSeller } from '../utils/sellerAvatar';
import type { AuthUser } from '../data/auth';
import type { HomeTabKey, LoadProductResult, Product, ProductCatKey } from '../types';
import { useAuthStore } from './authStore';

// Lazy accessor breaks the import cycle: chatStore imports catalogStore. Only used
// at runtime inside actions, never at module load.
const getChatStore = () => (require('./chatStore') as typeof import('./chatStore')).useChatStore;

// Sequencing/scratch refs for loadProduct — module-scoped so the async retry
// loop can detect a stale request the same way the old AppContext ref did.
let loadProductSeq = 0;
let detailSummaryId: number | null = null;
let detailSummaryProduct: Product | null = null;

/** Stamp the current user's avatar onto their own listings (self-seller). */
export function applySelfAvatarToProducts(
  items: Product[],
  user: AuthUser | null,
  profileAvatarUrl?: string,
): Product[] {
  if (!user?.id) return items;
  const avatar = user.avatarUrl ?? profileAvatarUrl;
  if (!avatar) return items;
  return items.map((p) =>
    isCurrentUserSeller(user, p.sellerUserId, p.sellerKey, p.seller)
      ? { ...p, sellerAvatarUrl: avatar, sellerUserId: p.sellerUserId ?? user.id }
      : p,
  );
}

interface CatalogState {
  products: Product[];
  currentItem: Product;
  homeTabKey: HomeTabKey;
  homeCategory: ProductCatKey | null;
  homeFeed: Product[];
  homeFeedLoading: boolean;
  homeFeedError: boolean;
  setHomeTabKey: (key: HomeTabKey) => void;
  setHomeCategory: (cat: ProductCatKey | null) => void;
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  setCurrentItem: (updater: Product | ((prev: Product) => Product)) => void;
  mergeCatalogProducts: (items: Product[]) => void;
  mergeProductDetail: (product: Product) => void;
  loadProduct: (id: number) => Promise<LoadProductResult>;
  openDetail: (p: Product, options?: { orderContext?: boolean }) => void;
  openSellerProfile: (sellerKey: string) => void;
  publishListingPriceChange: (listingId: number, newPrice: number) => Promise<void>;
  refreshCatalog: () => void;
  // Home feed plumbing — AppBootstrap runs the useFeed hook and pushes results in.
  setHomeFeedResult: (items: Product[], loading: boolean, error: boolean) => void;
  setHomeFeedReload: (reload: () => void) => void;
  reloadHomeFeed: () => void;
}

let homeFeedReload: () => void = () => {};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: mockCatalogProducts(),
  currentItem: defaultProducts[0],
  homeTabKey: 'recommended',
  homeCategory: null,
  homeFeed: [],
  homeFeedLoading: false,
  homeFeedError: false,

  setHomeTabKey: (key) => set({ homeTabKey: key }),
  setHomeCategory: (cat) => set({ homeCategory: cat }),
  setProducts: (updater) => set((state) => ({ products: updater(state.products) })),
  setCurrentItem: (updater) =>
    set((state) => ({
      currentItem: typeof updater === 'function' ? (updater as (p: Product) => Product)(state.currentItem) : updater,
    })),

  mergeCatalogProducts: (items) => {
    if (!items.length) return;
    const { user, profileAvatarUrl } = useAuthStore.getState();
    set((state) => ({
      products: applySelfAvatarToProducts(mergeProducts(state.products, items), user, profileAvatarUrl),
    }));
  },

  mergeProductDetail: (product) => {
    const user = useAuthStore.getState().user;
    const enriched = enrichSelfSellerProduct(product, user);
    set((state) => ({ currentItem: enriched, products: mergeProducts(state.products, [enriched]) }));
  },

  loadProduct: async (id) => {
    const user = useAuthStore.getState().user;
    const seq = ++loadProductSeq;
    let networkFailed = false;
    if (detailSummaryId !== null && detailSummaryId !== id) {
      detailSummaryId = null;
      detailSummaryProduct = null;
    }
    const cached = resolveDetailProduct(id);
    if (cached && seq === loadProductSeq) {
      set({ currentItem: enrichSelfSellerProduct(cached, user) });
    }

    const summaryHint = detailSummaryProduct?.id === id ? detailSummaryProduct : null;
    const catalogHint = get().products.find((p) => p.id === id);
    const needsBundleMeta = isBundleListingProduct(cached ?? summaryHint ?? catalogHint ?? {});

    if (needsBundleMeta && summaryHint) {
      const cachedWithMeta = get().products.find((p) => p.id === id && p.bundleMeta != null);
      if (!cachedWithMeta) {
        set({ currentItem: enrichSelfSellerProduct(summaryHint, user) });
      }
      recordListingView(id, user != null);
      void (async () => {
        try {
          const fetched = await resolveListingDetail(id, user != null);
          if (seq !== loadProductSeq) return;
          if (fetched?.bundleMeta != null) {
            const enriched = enrichSelfSellerProduct(fetched, user);
            set((state) => ({ currentItem: enriched, products: mergeProducts(state.products, [enriched]) }));
            detailSummaryId = null;
            detailSummaryProduct = null;
          }
        } catch {
          // DetailScreen bundle loader surfaces retry UI
        }
      })();
      return 'ok';
    }

    let detail: Product | null | undefined;
    const maxAttempts = needsBundleMeta ? 4 : 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (seq !== loadProductSeq) return 'error';
      const fetched = await resolveListingDetail(id, user != null);
      if (fetched === undefined) networkFailed = true;
      if (fetched === null) {
        detail = null;
        break;
      }
      if (fetched && (!needsBundleMeta || fetched.bundleMeta != null)) {
        detail = fetched;
        break;
      }
      detail = fetched;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    if (seq !== loadProductSeq) return 'error';
    if (detail?.bundleMeta != null || (detail && !needsBundleMeta)) {
      detailSummaryId = null;
      detailSummaryProduct = null;
      const enriched = enrichSelfSellerProduct(detail, user);
      set((state) => ({ currentItem: enriched, products: mergeProducts(state.products, [enriched]) }));
      recordListingView(id, user != null);
      return 'ok';
    }
    if (detail === null) {
      if (user) {
        const owned = await fetchMyListingDetail(id, true);
        if (owned) {
          detailSummaryId = null;
          detailSummaryProduct = null;
          const enriched = enrichSelfSellerProduct(owned, user);
          set((state) => ({ currentItem: enriched, products: mergeProducts(state.products, [enriched]) }));
          recordListingView(id, true);
          return 'ok';
        }
      }
      if (summaryHint || detailSummaryId === id) {
        detailSummaryId = null;
        detailSummaryProduct = null;
        if (summaryHint) {
          set({ currentItem: enrichSelfSellerProduct(summaryHint, user) });
          recordListingView(id, user != null);
          return 'ok';
        }
      }
      detailSummaryId = null;
      detailSummaryProduct = null;
      return 'not_found';
    }
    if (cached?.bundleMeta != null) {
      recordListingView(id, user != null);
      return 'ok';
    }
    if (needsBundleMeta && (detailSummaryId === id || summaryHint)) {
      if (summaryHint) set({ currentItem: enrichSelfSellerProduct(summaryHint, user) });
      else if (detail) set({ currentItem: enrichSelfSellerProduct(detail, user) });
      recordListingView(id, user != null);
      return 'ok';
    }
    if (detailSummaryId === id || summaryHint) {
      detailSummaryId = null;
      detailSummaryProduct = null;
      if (summaryHint) set({ currentItem: enrichSelfSellerProduct(summaryHint, user) });
      else if (detail) set({ currentItem: enrichSelfSellerProduct(detail, user) });
      recordListingView(id, user != null);
      return 'ok';
    }
    return networkFailed ? 'error' : 'not_found';
  },

  openDetail: (p, options) => {
    const user = useAuthStore.getState().user;
    detailSummaryId = p.id;
    const enriched = enrichSelfSellerProduct(p, user);
    detailSummaryProduct = enriched;
    set({ currentItem: enriched });
    if (p.isPinned || p.isRecommended) {
      void import('../api').then(({ catalogApi }) => {
        catalogApi.recordPromotionClick(p.id).catch(() => undefined);
      });
    }
    router.push(
      screenPath('detail', {
        productId: enriched.id,
        ...(options?.orderContext ? { context: 'order' } : {}),
      }) as Href,
    );
  },

  openSellerProfile: (sellerKey) => {
    const sellerUserId = resolveSellerUserId(sellerKey);
    router.push(screenPath('sellerProfile', { sellerUserId }) as Href);
  },

  publishListingPriceChange: async (listingId, newPrice) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === listingId ? { ...p, price: newPrice } : p)),
      currentItem:
        state.currentItem.id === listingId ? { ...state.currentItem, price: newPrice } : state.currentItem,
    }));
    getChatStore().getState().patchListingPrice(listingId, newPrice);
    invalidateCatalog();
  },

  refreshCatalog: () => invalidateCatalog(),

  setHomeFeedResult: (items, loading, error) =>
    set({ homeFeed: items, homeFeedLoading: loading, homeFeedError: error }),
  setHomeFeedReload: (reload) => {
    homeFeedReload = reload;
  },
  reloadHomeFeed: () => homeFeedReload(),
}));

export { fetchListingsByIds };
