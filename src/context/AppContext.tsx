import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ALL_AREAS,
  DEFAULT_REGION,
  formatAreaLabel,
  regionLabel,
  RegionSelection,
} from '../data/region';
import { products as defaultProducts } from '../data/products';
import { resolveDetailProduct } from '../data/detailProducts';
import { isBundleListingProduct } from '../data/bundle';
import { ApiError } from '../api/client';
import { mergeProducts } from '../api/mappers';
import {
  fetchListingsByIds,
  mockCatalogProducts,
  resolveListingDetail,
} from '../services/catalogService';
import { fetchMyListingDetail } from '../services/listingsService';
import { fetchUserProfile } from '../services/userService';
import { setAppLanguage } from '../i18n';
import {
  bootstrapFavorites,
  bootstrapFollows,
  recordListingView,
  resolveSellerUserId,
  setFavorite,
  setFollow,
} from '../services/userDataService';
import { useFeed } from '../hooks/useFeed';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import { registerNotificationOpenHandler } from '../services/messageNotifications';
import {
  AuthErrorKey,
  AuthUser,
  saveSession,
} from '../data/auth';
import {
  bootstrapAuth,
  loginWithAuth,
  logoutWithAuth,
  registerWithAuth,
} from '../services/authService';
import {
  isTabScreen,
  pathnameToScreenId,
  ROOT_PATH,
  screenPath,
} from '../routing/paths';
import { HomeTabKey, LoadProductResult, Product, ProductCatKey, ScreenId, TabScreenId, ChatListingContext, UiConversation } from '../types';
import type { PaymentMethodDto } from '../api/types';
import {
  bootstrapPaymentSelection,
  listPaymentMethods,
  selectPaymentMethod,
} from '../services/paymentsService';
import { openConversation, listConversations } from '../services/messagesService';
import { resolveChatListing, buildChatListingFromId, chatListingFromConversation } from '../services/chatListingService';
import { clearAppCache, getAppCacheSizeLabel } from '../services/settingsService';
import { invalidateCatalog, useCatalogRevision } from '../utils/catalogSync';
import {
  loadPublishBundleDraft,
  shouldResumePublishBundle,
} from '../data/publishBundleDraft';
import { enrichSelfSellerProduct, isCurrentUserSeller } from '../utils/sellerAvatar';

interface AppContextValue {
  current: ScreenId;
  nav: (id: ScreenId) => void;
  openSearch: () => void;
  requireAuthNav: (id: ScreenId) => void;
  goBack: () => void;
  toast: (msg: string) => void;
  toastMessage: string;
  toastVisible: boolean;
  products: Product[];
  currentItem: Product;
  openDetail: (p: Product, options?: { orderContext?: boolean }) => void;
  openSellerProfile: (sellerKey: string) => void;
  loadProduct: (id: number) => Promise<LoadProductResult>;
  mergeProductDetail: (product: Product) => void;
  mergeCatalogProducts: (products: Product[]) => void;
  favs: Set<number>;
  toggleFav: () => void;
  toggleFavoriteById: (listingId: number) => void;
  favCount: number;
  follows: Set<string>;
  toggleFollow: (sellerKey: string, sellerUserId?: string, sellerName?: string) => void;
  isFollowingSeller: (sellerKey: string) => boolean;
  isSelfSeller: (sellerKey: string, sellerUserId?: string, sellerName?: string) => boolean;
  followCount: number;
  homeTabKey: HomeTabKey;
  setHomeTabKey: (key: HomeTabKey) => void;
  homeCategory: ProductCatKey | null;
  setHomeCategory: (cat: ProductCatKey | null) => void;
  homeFeed: Product[];
  homeFeedLoading: boolean;
  homeFeedError: boolean;
  reloadHomeFeed: () => void;
  refreshCatalog: () => void;
  region: RegionSelection;
  regionLabelText: string;
  setRegion: (region: RegionSelection) => void;
  regionSheetVisible: boolean;
  openRegionSheet: () => void;
  closeRegionSheet: () => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  imageSearchResults: Product[] | null;
  imageSearchPreviewUri: string | null;
  imageSearchLoading: boolean;
  imageSearchError: boolean;
  clearImageSearch: () => void;
  setImageSearchLoading: (loading: boolean) => void;
  setImageSearchError: (failed: boolean) => void;
  setImageSearchSession: (items: Product[], previewUri: string, suggestedQuery: string) => void;
  chatTitle: string;
  chatConversationId: string | null;
  chatListing: ChatListingContext | null;
  chatListingId: number | null;
  chatCounterpartKey: string;
  chatCounterpartAvatarUrl?: string;
  openChat: (params: {
    conversationId?: string;
    listingId?: number;
    counterpartUserId?: string;
    counterpartName?: string;
    listingTitle?: string;
  }) => Promise<void>;
  hydrateChatFromConversationId: (conversationId: string) => Promise<void>;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentMethodId?: string;
  paymentMethods: PaymentMethodDto[];
  selectPaymentMethodById: (id: string) => void;
  refreshPaymentMethods: () => Promise<PaymentMethodDto[]>;
  deliveryMethod: string;
  setDeliveryMethod: (v: string) => void;
  checkoutBundleItemId: string | null;
  setCheckoutBundleItemId: (id: string | null) => void;
  openOrderCheckout: (bundleItemId?: string) => void;
  cacheSize: string;
  clearCache: () => Promise<void>;
  refreshCacheSize: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  profileAvatarUrl?: string;
  activeTab: TabScreenId | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  authReady: boolean;
  login: (phone: string, password: string) => Promise<{ error?: AuthErrorKey }>;
  register: (input: {
    nickname: string;
    phone: string;
    password: string;
    confirmPassword: string;
    verificationCode: string;
    avatarUri: string;
    avatarMimeType?: string;
    avatarFileName?: string;
    city: string;
  }) => Promise<{ error?: AuthErrorKey }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const TAB_MAP: Partial<Record<ScreenId, TabScreenId>> = {
  home: 'home',
  category: 'category',
  publish: 'publish',
  messages: 'messages',
  profile: 'profile',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const current = pathnameToScreenId(pathname);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadProductSeqRef = useRef(0);
  const detailSummaryIdRef = useRef<number | null>(null);
  const detailSummaryProductRef = useRef<Product | null>(null);
  const bundleResumeCheckedRef = useRef(false);
  const pendingChatConversationIdRef = useRef<string | null>(null);
  const [currentItem, setCurrentItem] = useState<Product>(defaultProducts[0]);
  const [products, setProducts] = useState<Product[]>(mockCatalogProducts());
  const productsRef = useRef(products);
  productsRef.current = products;
  const [favs, setFavs] = useState<Set<number>>(new Set());
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [homeTabKey, setHomeTabKey] = useState<HomeTabKey>('recommended');
  const [homeCategory, setHomeCategory] = useState<ProductCatKey | null>(null);
  const [region, setRegionState] = useState<RegionSelection>(DEFAULT_REGION);
  const [regionSheetVisible, setRegionSheetVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<Product[] | null>(null);
  const [imageSearchPreviewUri, setImageSearchPreviewUri] = useState<string | null>(null);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatListing, setChatListing] = useState<ChatListingContext | null>(null);
  const [chatListingId, setChatListingId] = useState<number | null>(null);
  const [chatCounterpartKey, setChatCounterpartKey] = useState('');
  const [chatCounterpartAvatarUrl, setChatCounterpartAvatarUrl] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [checkoutBundleItemId, setCheckoutBundleItemId] = useState<string | null>(null);
  const [cacheSize, setCacheSize] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | undefined>();

  const { items: homeFeed, loading: homeFeedLoading, error: homeFeedError, reload: reloadHomeFeed } = useFeed(
    region,
    homeTabKey,
    homeCategory,
  );
  const catalogRevision = useCatalogRevision();

  const refreshCatalog = useCallback(() => {
    invalidateCatalog();
  }, []);

  React.useEffect(() => {
    bootstrapAuth()
      .then(setUser)
      .finally(() => setAuthReady(true));
  }, []);

  React.useEffect(() => {
    if (!authReady) return;
    fetchUserProfile(user, user != null).then((profile) => {
      setProfileAvatarUrl(profile.avatarUrl);
      if (user != null && profile.avatarUrl && profile.avatarUrl !== user.avatarUrl) {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, avatarUrl: profile.avatarUrl };
          void saveSession(next);
          return next;
        });
      }
      if (user != null && (profile.language === 'en' || profile.language === 'zh')) {
        void setAppLanguage(profile.language);
      }
    });
  }, [authReady, user?.id]);

  React.useEffect(() => {
    if (!authReady) return;
    bootstrapFavorites(user != null).then(setFavs);
    bootstrapFollows(user != null).then(setFollows);
  }, [authReady, user]);

  const applySelfAvatarToProducts = useCallback(
    (items: Product[]): Product[] => {
      if (!user?.id) return items;
      const avatar = user.avatarUrl ?? profileAvatarUrl;
      if (!avatar) return items;
      return items.map((p) =>
        isCurrentUserSeller(user, p.sellerUserId, p.sellerKey, p.seller)
          ? { ...p, sellerAvatarUrl: avatar, sellerUserId: p.sellerUserId ?? user.id }
          : p,
      );
    },
    [user, profileAvatarUrl],
  );

  React.useEffect(() => {
    if (!user?.id) return;
    const avatar = user.avatarUrl ?? profileAvatarUrl;
    if (!avatar) return;

    setProducts((prev) => applySelfAvatarToProducts(prev));
    setCurrentItem((prev) => applySelfAvatarToProducts([prev])[0] ?? prev);
  }, [user?.id, user?.avatarUrl, user?.nickname, profileAvatarUrl, applySelfAvatarToProducts]);

  React.useEffect(() => {
    if (homeFeed.length) {
      setProducts((prev) => applySelfAvatarToProducts(mergeProducts(prev, homeFeed)));
    }
  }, [homeFeed, applySelfAvatarToProducts]);

  React.useEffect(() => {
    if (!authReady) return;
    listPaymentMethods(user != null).then(async (methods) => {
      setPaymentMethods(methods);
      if (!methods.length) {
        setPaymentMethodId(undefined);
        setPaymentMethod('');
        return;
      }
      const selected = await bootstrapPaymentSelection(methods);
      if (selected) {
        setPaymentMethodId(selected.id);
        setPaymentMethod(selected.label);
      } else {
        setPaymentMethodId(undefined);
        setPaymentMethod('');
      }
    });
  }, [authReady, user, i18n.language]);

  React.useEffect(() => {
    void getAppCacheSizeLabel().then(setCacheSize);
  }, [i18n.language]);

  React.useEffect(() => {
    if (!authReady || favs.size === 0) return;
    fetchListingsByIds([...favs]).then((items) => {
      if (items.length) {
        setProducts((prev) => applySelfAvatarToProducts(mergeProducts(prev, items)));
      }
    });
  }, [authReady, favs, i18n.language, applySelfAvatarToProducts, catalogRevision]);

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 1700);
  }, []);

  const clearImageSearch = useCallback(() => {
    setImageSearchResults(null);
    setImageSearchPreviewUri(null);
    setImageSearchLoading(false);
    setImageSearchError(false);
  }, []);

  React.useEffect(() => {
    setDeliveryMethod((prev) => prev || 'meetup');
  }, []);

  React.useEffect(() => {
    clearImageSearch();
  }, [i18n.language, clearImageSearch]);

  const setImageSearchSession = useCallback((items: Product[], previewUri: string, suggestedQuery: string) => {
    setImageSearchResults(items);
    setImageSearchPreviewUri(previewUri);
    setImageSearchLoading(false);
    setImageSearchError(false);
    if (suggestedQuery) setSearchValue(suggestedQuery);
  }, []);

  const nav = useCallback((id: ScreenId) => {
    const href = screenPath(id) as Href;
    if (isTabScreen(id)) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, []);

  React.useEffect(() => {
    if (!authReady || bundleResumeCheckedRef.current) return;
    bundleResumeCheckedRef.current = true;
    void loadPublishBundleDraft().then((draft) => {
      if (!draft || !shouldResumePublishBundle(draft)) return;
      nav('publishBundle');
    });
  }, [authReady, nav]);

  const openSearch = useCallback(() => {
    clearImageSearch();
    setSearchValue('');
    nav('search');
  }, [clearImageSearch, nav]);

  const requireAuthNav = useCallback(
    (id: ScreenId) => {
      if (!authReady) return;
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      nav(id);
    },
    [authReady, nav, t, toast, user],
  );

  const openOrderCheckout = useCallback(
    (bundleItemId?: string) => {
      setCheckoutBundleItemId(bundleItemId ?? null);
      requireAuthNav('order');
    },
    [requireAuthNav],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROOT_PATH);
  }, []);

  const loadProduct = useCallback(
    async (id: number): Promise<LoadProductResult> => {
      const seq = ++loadProductSeqRef.current;
      let networkFailed = false;
      if (detailSummaryIdRef.current !== null && detailSummaryIdRef.current !== id) {
        detailSummaryIdRef.current = null;
        detailSummaryProductRef.current = null;
      }
      const cached = resolveDetailProduct(id);
      if (cached && seq === loadProductSeqRef.current) {
        setCurrentItem(enrichSelfSellerProduct(cached, user));
      }

      const summaryHint =
        detailSummaryProductRef.current?.id === id ? detailSummaryProductRef.current : null;
      const catalogHint = productsRef.current.find((p) => p.id === id);
      const needsBundleMeta = isBundleListingProduct(cached ?? summaryHint ?? catalogHint ?? {});

      if (needsBundleMeta && summaryHint) {
        const cachedWithMeta = productsRef.current.find(
          (p) => p.id === id && p.bundleMeta != null,
        );
        if (!cachedWithMeta) {
          setCurrentItem(enrichSelfSellerProduct(summaryHint, user));
        }
        recordListingView(id, user != null);
        void (async () => {
          try {
            const fetched = await resolveListingDetail(id, user != null);
            if (seq !== loadProductSeqRef.current) return;
            if (fetched?.bundleMeta != null) {
              const enriched = enrichSelfSellerProduct(fetched, user);
              setCurrentItem(enriched);
              setProducts((prev) => mergeProducts(prev, [enriched]));
              detailSummaryIdRef.current = null;
              detailSummaryProductRef.current = null;
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
        if (seq !== loadProductSeqRef.current) {
          return 'error';
        }
        const fetched = await resolveListingDetail(id, user != null);
        if (fetched === undefined) {
          networkFailed = true;
        }
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

      if (seq !== loadProductSeqRef.current) {
        return 'error';
      }
      if (detail?.bundleMeta != null || (detail && !needsBundleMeta)) {
        detailSummaryIdRef.current = null;
        detailSummaryProductRef.current = null;
        const enriched = enrichSelfSellerProduct(detail, user);
        setCurrentItem(enriched);
        setProducts((prev) => mergeProducts(prev, [enriched]));
        recordListingView(id, user != null);
        return 'ok';
      }
      if (detail === null) {
        if (user) {
          const owned = await fetchMyListingDetail(id, true);
          if (owned) {
            detailSummaryIdRef.current = null;
            detailSummaryProductRef.current = null;
            const enriched = enrichSelfSellerProduct(owned, user);
            setCurrentItem(enriched);
            setProducts((prev) => mergeProducts(prev, [enriched]));
            recordListingView(id, true);
            return 'ok';
          }
        }
        if (summaryHint || detailSummaryIdRef.current === id) {
          detailSummaryIdRef.current = null;
          detailSummaryProductRef.current = null;
          if (summaryHint) {
            setCurrentItem(enrichSelfSellerProduct(summaryHint, user));
            recordListingView(id, user != null);
            return 'ok';
          }
        }
        detailSummaryIdRef.current = null;
        detailSummaryProductRef.current = null;
        return 'not_found';
      }
      if (cached?.bundleMeta != null) {
        recordListingView(id, user != null);
        return 'ok';
      }
      if (needsBundleMeta && (detailSummaryIdRef.current === id || summaryHint)) {
        if (summaryHint) setCurrentItem(enrichSelfSellerProduct(summaryHint, user));
        else if (detail) setCurrentItem(enrichSelfSellerProduct(detail, user));
        recordListingView(id, user != null);
        return 'ok';
      }
      if (detailSummaryIdRef.current === id || summaryHint) {
        detailSummaryIdRef.current = null;
        detailSummaryProductRef.current = null;
        if (summaryHint) setCurrentItem(enrichSelfSellerProduct(summaryHint, user));
        else if (detail) setCurrentItem(enrichSelfSellerProduct(detail, user));
        recordListingView(id, user != null);
        return 'ok';
      }
      return networkFailed ? 'error' : 'not_found';
    },
    [user],
  );

  const mergeProductDetail = useCallback(
    (product: Product) => {
      const enriched = enrichSelfSellerProduct(product, user);
      setCurrentItem(enriched);
      setProducts((prev) => mergeProducts(prev, [enriched]));
    },
    [user],
  );

  const mergeCatalogProducts = useCallback(
    (items: Product[]) => {
      if (!items.length) return;
      setProducts((prev) => applySelfAvatarToProducts(mergeProducts(prev, items)));
    },
    [applySelfAvatarToProducts],
  );

  const openDetail = useCallback(
    (p: Product, options?: { orderContext?: boolean }) => {
      detailSummaryIdRef.current = p.id;
      const enriched = enrichSelfSellerProduct(p, user);
      detailSummaryProductRef.current = enriched;
      setCurrentItem(enriched);
      router.push(
        screenPath('detail', {
          productId: enriched.id,
          ...(options?.orderContext ? { context: 'order' } : {}),
        }) as Href,
      );
    },
    [user],
  );

  const openSellerProfile = useCallback((sellerKey: string) => {
    const sellerUserId = resolveSellerUserId(sellerKey);
    router.push(screenPath('sellerProfile', { sellerUserId }) as Href);
  }, []);

  const toggleFavoriteById = useCallback(
    async (listingId: number) => {
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      const isFav = favs.has(listingId);
      const delta = isFav ? -1 : 1;

      const bumpFavoriteCount = (count: number) => Math.max(0, count + delta);

      setFavs((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === listingId
            ? { ...p, favoriteCount: bumpFavoriteCount(p.favoriteCount ?? 0) }
            : p,
        ),
      );
      setCurrentItem((prev) =>
        prev.id === listingId
          ? { ...prev, favoriteCount: bumpFavoriteCount(prev.favoriteCount ?? 0) }
          : prev,
      );

      try {
        const next = await setFavorite(listingId, !isFav, user != null);
        setFavs(next);
        toast(t(isFav ? 'toast.unfavorited' : 'toast.favorited'));
      } catch {
        setFavs((prev) => {
          const reverted = new Set(prev);
          if (isFav) reverted.add(listingId);
          else reverted.delete(listingId);
          return reverted;
        });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === listingId
              ? { ...p, favoriteCount: Math.max(0, (p.favoriteCount ?? 0) - delta) }
              : p,
          ),
        );
        setCurrentItem((prev) =>
          prev.id === listingId
            ? { ...prev, favoriteCount: Math.max(0, (prev.favoriteCount ?? 0) - delta) }
            : prev,
        );
        toast(t('toast.favoriteFailed'));
      }
    },
    [favs, nav, t, toast, user],
  );

  const toggleFav = useCallback(() => {
    void toggleFavoriteById(currentItem.id);
  }, [currentItem.id, toggleFavoriteById]);

  const isFollowingSeller = useCallback(
    (sellerKey: string) => follows.has(resolveSellerUserId(sellerKey)),
    [follows],
  );

  const isSelfSeller = useCallback(
    (sellerKey: string, sellerUserId?: string, sellerName?: string) =>
      user != null && isCurrentUserSeller(user, sellerUserId, sellerKey, sellerName),
    [user],
  );

  const toggleFollow = useCallback(
    async (sellerKey: string, sellerUserId?: string, sellerName?: string) => {
      if (!authReady) return;
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      if (isCurrentUserSeller(user, sellerUserId, sellerKey, sellerName)) return;
      const userId = sellerUserId ?? resolveSellerUserId(sellerKey);
      const isFollowing = follows.has(userId);
      try {
        const next = await setFollow(sellerKey, !isFollowing, user != null);
        setFollows(next);
        toast(t(isFollowing ? 'toast.unfollowedSeller' : 'toast.followedSeller'));
      } catch {
        toast(t('toast.followFailed'));
      }
    },
    [authReady, follows, nav, t, toast, user],
  );

  const setRegion = useCallback(
    (next: RegionSelection) => {
      setRegionState(next);
      toast(
        next.area === ALL_AREAS
          ? t('toast.regionCity', { city: next.city })
          : t('toast.regionArea', { area: formatAreaLabel(next.area) }),
      );
    },
    [t, toast],
  );

  const openRegionSheet = useCallback(() => setRegionSheetVisible(true), []);
  const closeRegionSheet = useCallback(() => setRegionSheetVisible(false), []);

  const clearCache = useCallback(async () => {
    try {
      await clearAppCache(user != null);
      clearImageSearch();
      invalidateCatalog();
      setCacheSize(await getAppCacheSizeLabel());
      toast(t('toast.cacheCleared'));
    } catch {
      setCacheSize(await getAppCacheSizeLabel());
      toast(t('toast.cacheClearFailed'));
    }
  }, [t, toast, user, clearImageSearch]);

  const refreshCacheSize = useCallback(async () => {
    setCacheSize(await getAppCacheSizeLabel());
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveSession(next);
      return next;
    });
    if (patch.avatarUrl !== undefined) {
      setProfileAvatarUrl(patch.avatarUrl);
    }
  }, []);

  const selectPaymentMethodById = useCallback(
    async (id: string) => {
      const method = paymentMethods.find((m) => m.id === id);
      if (!method) return;
      setPaymentMethodId(method.id);
      setPaymentMethod(method.label);
      await selectPaymentMethod(method);
    },
    [paymentMethods],
  );

  const refreshPaymentMethods = useCallback(async () => {
    if (!authReady) return [];
    const methods = await listPaymentMethods(user != null);
    setPaymentMethods(methods);
    if (!methods.length) {
      setPaymentMethodId(undefined);
      setPaymentMethod('');
      return methods;
    }
    const currentId = paymentMethodId;
    if (currentId && methods.some((m) => m.id === currentId)) {
      const match = methods.find((m) => m.id === currentId);
      if (match) setPaymentMethod(match.label);
      return methods;
    }
    const selected = await bootstrapPaymentSelection(methods);
    if (selected) {
      setPaymentMethodId(selected.id);
      setPaymentMethod(selected.label);
    }
    return methods;
  }, [authReady, paymentMethodId, user]);

  const applyChatSession = useCallback(
    (
      conversation: UiConversation,
      listing: ChatListingContext | null,
      listingId: number | null | undefined,
      params?: { counterpartName?: string },
    ) => {
      setChatConversationId(conversation.id);
      setChatTitle(params?.counterpartName ?? conversation.counterpartName);
      setChatCounterpartKey(conversation.counterpartKey);
      setChatCounterpartAvatarUrl(conversation.counterpartAvatarUrl);
      setChatListing(listing);
      setChatListingId(listing?.listingId ?? listingId ?? conversation.listingId ?? null);
    },
    [],
  );

  const resolveListingForChat = useCallback(
    async (
      conversation: UiConversation,
      params: { listingId?: number; listingTitle?: string },
    ): Promise<{ listing: ChatListingContext | null; listingId: number | null | undefined }> => {
      let listing = await resolveChatListing(conversation, params, currentItem, products);
      if (!listing) {
        listing = chatListingFromConversation(conversation, products);
      }
      const listingId = params.listingId ?? conversation.listingId;
      if (!listing && listingId != null) {
        listing =
          buildChatListingFromId(
            listingId,
            products,
            params.listingTitle ?? conversation.listingTitle,
          ) ??
          chatListingFromConversation(conversation, products) ??
          (conversation.listingTitle
            ? {
                listingId,
                title: conversation.listingTitle,
                imageUrl: conversation.listingImageUrl ?? '',
                price: conversation.listingPrice ?? 0,
                location: conversation.listingLocation ?? '',
              }
            : null);
      }
      return { listing, listingId };
    },
    [currentItem, products],
  );

  const openChat = useCallback(
    async (params: {
      conversationId?: string;
      listingId?: number;
      counterpartUserId?: string;
      counterpartName?: string;
      listingTitle?: string;
    }) => {
      if (!authReady) return;
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      try {
        const conversation = await openConversation(params, user != null);
        const { listing, listingId } = await resolveListingForChat(conversation, params);
        applyChatSession(conversation, listing, listingId, params);
        if (listing?.listingId) void loadProduct(listing.listingId);
        router.push(screenPath('chat', { chatId: conversation.id }) as Href);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'INVALID_STATE') {
          toast(t('toast.listingUnavailable'));
        } else {
          toast(t('toast.chatLoadFailed'));
        }
      }
    },
    [applyChatSession, authReady, nav, resolveListingForChat, t, toast, user, loadProduct],
  );

  const handleForegroundChatMessage = useCallback(
    (conv: { counterpartName: string; lastMessage: string }) => {
      toast(t('notifications.newMessageTitle', { name: conv.counterpartName }));
    },
    [t, toast],
  );

  useMessageNotifications(user != null, authReady, chatConversationId, handleForegroundChatMessage);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    return registerNotificationOpenHandler((payload) => {
      if (payload.type === 'order') {
        const filter = payload.filter ?? 'pendingShip';
        router.push(`/profile/sold?filter=${filter}` as Href);
        return;
      }
      if (!authReady || !user) {
        pendingChatConversationIdRef.current = payload.conversationId;
        return;
      }
      void openChat({ conversationId: payload.conversationId });
    });
  }, [openChat, authReady, user]);

  React.useEffect(() => {
    if (!authReady || !user) return;
    const pending = pendingChatConversationIdRef.current;
    if (!pending) return;
    pendingChatConversationIdRef.current = null;
    void openChat({ conversationId: pending });
  }, [authReady, user, openChat]);

  const hydrateChatFromConversationId = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      if (chatConversationId === conversationId && chatTitle && (chatListing || chatListingId != null)) {
        return;
      }
      try {
        const conversations = await listConversations(user != null);
        const existing = conversations.find((c) => c.id === conversationId);
        const conversation =
          existing ?? (await openConversation({ conversationId }, user != null));
        const { listing, listingId } = await resolveListingForChat(conversation, {});
        applyChatSession(conversation, listing, listingId);
        if (listing?.listingId) void loadProduct(listing.listingId);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'INVALID_STATE') {
          toast(t('toast.listingUnavailable'));
        } else {
          toast(t('toast.chatLoadFailed'));
        }
      }
    },
    [
      applyChatSession,
      chatConversationId,
      chatTitle,
      chatListing,
      chatListingId,
      resolveListingForChat,
      t,
      toast,
      user,
      loadProduct,
      mergeProductDetail,
    ],
  );

  const login = useCallback(async (phone: string, password: string) => {
    const result = await loginWithAuth(phone, password);
    if ('error' in result) return { error: result.error };
    setUser(result.user);
    return {};
  }, []);

  const register = useCallback(
    async (input: {
      nickname: string;
      phone: string;
      password: string;
      confirmPassword: string;
      verificationCode: string;
      avatarUri: string;
      avatarMimeType?: string;
      avatarFileName?: string;
      city: string;
    }) => {
      const result = await registerWithAuth(input);
      if ('error' in result) return { error: result.error };
      setUser(result.user);
      return {};
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutWithAuth();
    setUser(null);
    setProfileAvatarUrl(undefined);
    setChatConversationId(null);
    setChatTitle('');
    setChatListing(null);
    setChatListingId(null);
    setChatCounterpartKey('');
    setChatCounterpartAvatarUrl(undefined);
    setPaymentMethodId(undefined);
    setPaymentMethod('');
    setPaymentMethods([]);
    toast(t('toast.loggedOut'));
    router.replace(ROOT_PATH);
  }, [t, toast]);

  const activeTab = TAB_MAP[current] ?? null;

  const value = useMemo(
    () => ({
      current,
      nav,
      openSearch,
      requireAuthNav,
      goBack,
      toast,
      toastMessage,
      toastVisible,
      products,
      currentItem,
      openDetail,
      openSellerProfile,
      loadProduct,
      mergeProductDetail,
      mergeCatalogProducts,
      favs,
      toggleFav,
      toggleFavoriteById,
      favCount: favs.size,
      follows,
      toggleFollow,
      isFollowingSeller,
      isSelfSeller,
      followCount: follows.size,
      homeTabKey,
      setHomeTabKey,
      homeCategory,
      setHomeCategory,
      homeFeed,
      homeFeedLoading,
      homeFeedError,
      reloadHomeFeed,
      refreshCatalog,
      region,
      regionLabelText: regionLabel(region),
      setRegion,
      regionSheetVisible,
      openRegionSheet,
      closeRegionSheet,
      searchValue,
      setSearchValue,
      imageSearchResults,
      imageSearchPreviewUri,
      imageSearchLoading,
      imageSearchError,
      clearImageSearch,
      setImageSearchLoading,
      setImageSearchError,
      setImageSearchSession,
      chatTitle,
      chatConversationId,
      chatListing,
      chatListingId,
      chatCounterpartKey,
      chatCounterpartAvatarUrl,
      openChat,
      hydrateChatFromConversationId,
      paymentMethod,
      setPaymentMethod,
      paymentMethodId,
      paymentMethods,
      selectPaymentMethodById,
      refreshPaymentMethods,
      deliveryMethod,
      setDeliveryMethod,
      checkoutBundleItemId,
      setCheckoutBundleItemId,
      openOrderCheckout,
      cacheSize,
      clearCache,
      refreshCacheSize,
      updateUser,
      profileAvatarUrl,
      activeTab,
      user,
      isLoggedIn: user != null,
      authReady,
      login,
      register,
      logout,
    }),
    [
      current,
      nav,
      openSearch,
      requireAuthNav,
      goBack,
      toast,
      toastMessage,
      toastVisible,
      products,
      currentItem,
      openDetail,
      openSellerProfile,
      loadProduct,
      mergeProductDetail,
      mergeCatalogProducts,
      favs,
      toggleFav,
      toggleFavoriteById,
      follows,
      toggleFollow,
      isFollowingSeller,
      isSelfSeller,
      homeTabKey,
      homeCategory,
      homeFeed,
      homeFeedLoading,
      homeFeedError,
      reloadHomeFeed,
      refreshCatalog,
      region,
      i18n.language,
      setRegion,
      regionSheetVisible,
      openRegionSheet,
      closeRegionSheet,
      searchValue,
      imageSearchResults,
      imageSearchPreviewUri,
      imageSearchLoading,
      imageSearchError,
      clearImageSearch,
      setImageSearchLoading,
      setImageSearchError,
      setImageSearchSession,
      chatTitle,
      chatConversationId,
      chatListing,
      chatListingId,
      chatCounterpartKey,
      chatCounterpartAvatarUrl,
      openChat,
      hydrateChatFromConversationId,
      paymentMethod,
      paymentMethodId,
      paymentMethods,
      selectPaymentMethodById,
      refreshPaymentMethods,
      deliveryMethod,
      checkoutBundleItemId,
      openOrderCheckout,
      cacheSize,
      clearCache,
      refreshCacheSize,
      updateUser,
      profileAvatarUrl,
      activeTab,
      user,
      authReady,
      login,
      register,
      logout,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
