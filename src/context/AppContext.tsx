import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { mergeProducts } from '../api/mappers';
import {
  fetchListingDetail,
  fetchListingsByIds,
  mockCatalogProducts,
} from '../services/catalogService';
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
import { HomeTabKey, Product, ProductCatKey, ScreenId, TabScreenId, ChatListingContext } from '../types';
import type { PaymentMethodDto } from '../api/types';
import {
  bootstrapPaymentSelection,
  listPaymentMethods,
  selectPaymentMethod,
} from '../services/paymentsService';
import { openConversation } from '../services/messagesService';
import { resolveChatListing } from '../services/chatListingService';
import { clearAppCache } from '../services/settingsService';

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
  openDetail: (p: Product) => void;
  openSellerProfile: (sellerKey: string) => void;
  loadProduct: (id: number) => Promise<void>;
  favs: Set<number>;
  toggleFav: () => void;
  toggleFavoriteById: (listingId: number) => void;
  favCount: number;
  follows: Set<string>;
  toggleFollow: (sellerKey: string) => void;
  isFollowingSeller: (sellerKey: string) => boolean;
  followCount: number;
  homeTabKey: HomeTabKey;
  setHomeTabKey: (key: HomeTabKey) => void;
  homeCategory: ProductCatKey | null;
  setHomeCategory: (cat: ProductCatKey | null) => void;
  homeFeed: Product[];
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
  clearImageSearch: () => void;
  setImageSearchLoading: (loading: boolean) => void;
  setImageSearchSession: (items: Product[], previewUri: string, suggestedQuery: string) => void;
  chatTitle: string;
  chatConversationId: string | null;
  chatListing: ChatListingContext | null;
  openChat: (params: {
    conversationId?: string;
    listingId?: number;
    counterpartName?: string;
    listingTitle?: string;
  }) => Promise<void>;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentMethodId?: string;
  paymentMethods: PaymentMethodDto[];
  selectPaymentMethodById: (id: string) => void;
  deliveryMethod: string;
  setDeliveryMethod: (v: string) => void;
  cacheSize: string;
  clearCache: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
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
  const [currentItem, setCurrentItem] = useState<Product>(defaultProducts[0]);
  const [products, setProducts] = useState<Product[]>(mockCatalogProducts());
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
  const [chatTitle, setChatTitle] = useState('');
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatListing, setChatListing] = useState<ChatListingContext | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [cacheSize, setCacheSize] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const { items: homeFeed } = useFeed(region, homeTabKey, homeCategory);

  React.useEffect(() => {
    bootstrapAuth()
      .then(setUser)
      .finally(() => setAuthReady(true));
  }, []);

  React.useEffect(() => {
    if (!authReady) return;
    fetchUserProfile(user, user != null).then((profile) => {
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

  React.useEffect(() => {
    if (homeFeed.length) {
      setProducts((prev) => mergeProducts(prev, homeFeed));
    }
  }, [homeFeed]);

  React.useEffect(() => {
    if (!authReady) return;
    listPaymentMethods(user != null).then(async (methods) => {
      setPaymentMethods(methods);
      const selected = await bootstrapPaymentSelection(methods);
      if (selected) {
        setPaymentMethodId(selected.id);
        setPaymentMethod(selected.label);
      }
    });
  }, [authReady, user, i18n.language]);

  React.useEffect(() => {
    setCacheSize(t('common.cacheDemoSize'));
  }, [t, i18n.language]);

  React.useEffect(() => {
    if (!authReady || favs.size === 0) return;
    fetchListingsByIds([...favs]).then((items) => {
      if (items.length) setProducts((prev) => mergeProducts(prev, items));
    });
  }, [authReady, favs, i18n.language]);

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
  }, []);

  React.useEffect(() => {
    setDeliveryMethod(t('screens.order.pickup'));
    clearImageSearch();
  }, [t, i18n.language, clearImageSearch]);

  const setImageSearchSession = useCallback((items: Product[], previewUri: string, suggestedQuery: string) => {
    setImageSearchResults(items);
    setImageSearchPreviewUri(previewUri);
    setImageSearchLoading(false);
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

  const openSearch = useCallback(() => {
    clearImageSearch();
    setSearchValue('');
    nav('search');
  }, [clearImageSearch, nav]);

  const requireAuthNav = useCallback(
    (id: ScreenId) => {
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      nav(id);
    },
    [nav, t, toast, user],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROOT_PATH);
  }, []);

  const loadProduct = useCallback(
    async (id: number) => {
      const cached = resolveDetailProduct(id);
      if (cached) setCurrentItem(cached);

      const fetched = await fetchListingDetail(id);
      if (fetched) {
        setCurrentItem(fetched);
        setProducts((prev) => mergeProducts(prev, [fetched]));
      }
      recordListingView(id, user != null);
    },
    [user],
  );

  const openDetail = useCallback((p: Product) => {
    setCurrentItem(p);
    router.push(screenPath('detail', { productId: p.id }) as Href);
  }, []);

  const openSellerProfile = useCallback((sellerKey: string) => {
    const sellerUserId = resolveSellerUserId(sellerKey);
    router.push(screenPath('sellerProfile', { sellerUserId }) as Href);
  }, []);

  const toggleFavoriteById = useCallback(
    async (listingId: number) => {
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
      }
    },
    [favs, t, toast, user],
  );

  const toggleFav = useCallback(() => {
    void toggleFavoriteById(currentItem.id);
  }, [currentItem.id, toggleFavoriteById]);

  const isFollowingSeller = useCallback(
    (sellerKey: string) => follows.has(resolveSellerUserId(sellerKey)),
    [follows],
  );

  const toggleFollow = useCallback(
    async (sellerKey: string) => {
      const userId = resolveSellerUserId(sellerKey);
      const isFollowing = follows.has(userId);
      try {
        const next = await setFollow(sellerKey, !isFollowing, user != null);
        setFollows(next);
        toast(t(isFollowing ? 'toast.unfollowedSeller' : 'toast.followedSeller'));
      } catch {
        toast(t(isFollowing ? 'toast.unfollowedSeller' : 'toast.followedSeller'));
      }
    },
    [follows, t, toast, user],
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
      const nextSize = await clearAppCache(user != null);
      setCacheSize(nextSize);
    } catch {
      setCacheSize('0 MB');
    }
    toast(t('toast.cacheCleared'));
  }, [t, toast, user]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveSession(next);
      return next;
    });
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

  const openChat = useCallback(
    async (params: {
      conversationId?: string;
      listingId?: number;
      counterpartName?: string;
      listingTitle?: string;
    }) => {
      if (!user) {
        toast(t('toast.loginRequired'));
        nav('login');
        return;
      }
      try {
        const conversation = await openConversation(params, user != null);
        const listing = await resolveChatListing(conversation, params, currentItem, products);
        setChatConversationId(conversation.id);
        setChatTitle(params.counterpartName ?? conversation.counterpartName);
        setChatListing(listing);
        if (listing?.listingId) void loadProduct(listing.listingId);
        nav('chat');
      } catch {
        toast(t('toast.sendFailed'));
      }
    },
    [nav, t, toast, user, currentItem, products, loadProduct],
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
    setChatConversationId(null);
    setChatTitle('');
    setChatListing(null);
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
      favs,
      toggleFav,
      toggleFavoriteById,
      favCount: favs.size,
      follows,
      toggleFollow,
      isFollowingSeller,
      followCount: follows.size,
      homeTabKey,
      setHomeTabKey,
      homeCategory,
      setHomeCategory,
      homeFeed,
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
      clearImageSearch,
      setImageSearchLoading,
      setImageSearchSession,
      chatTitle,
      chatConversationId,
      chatListing,
      openChat,
      paymentMethod,
      setPaymentMethod,
      paymentMethodId,
      paymentMethods,
      selectPaymentMethodById,
      deliveryMethod,
      setDeliveryMethod,
      cacheSize,
      clearCache,
      updateUser,
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
      favs,
      toggleFav,
      toggleFavoriteById,
      follows,
      toggleFollow,
      isFollowingSeller,
      homeTabKey,
      homeCategory,
      homeFeed,
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
      clearImageSearch,
      setImageSearchSession,
      chatTitle,
      chatConversationId,
      chatListing,
      openChat,
      paymentMethod,
      paymentMethodId,
      paymentMethods,
      selectPaymentMethodById,
      deliveryMethod,
      cacheSize,
      clearCache,
      updateUser,
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
