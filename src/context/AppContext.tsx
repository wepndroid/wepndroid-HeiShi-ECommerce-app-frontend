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
import {
  bootstrapFavorites,
  recordListingView,
  setFavorite,
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
import { HomeTabKey, Product, ProductCatKey, ScreenId, TabScreenId } from '../types';
import type { PaymentMethodDto } from '../api/types';
import {
  bootstrapPaymentSelection,
  listPaymentMethods,
  selectPaymentMethod,
} from '../services/paymentsService';
import { openConversation } from '../services/messagesService';
import { clearAppCache } from '../services/settingsService';

interface AppContextValue {
  current: ScreenId;
  nav: (id: ScreenId) => void;
  requireAuthNav: (id: ScreenId) => void;
  goBack: () => void;
  toast: (msg: string) => void;
  toastMessage: string;
  toastVisible: boolean;
  products: Product[];
  currentItem: Product;
  openDetail: (p: Product) => void;
  loadProduct: (id: number) => Promise<void>;
  favs: Set<number>;
  toggleFav: () => void;
  favCount: number;
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
  chatTitle: string;
  chatConversationId: string | null;
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
  const [homeTabKey, setHomeTabKey] = useState<HomeTabKey>('recommended');
  const [homeCategory, setHomeCategory] = useState<ProductCatKey | null>(null);
  const [region, setRegionState] = useState<RegionSelection>(DEFAULT_REGION);
  const [regionSheetVisible, setRegionSheetVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [chatTitle, setChatTitle] = useState('');
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Visa / Mastercard');
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [cacheSize, setCacheSize] = useState('28.6 MB');
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
    bootstrapFavorites(user != null).then(setFavs);
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
  }, [authReady, user]);

  React.useEffect(() => {
    if (!authReady || favs.size === 0) return;
    fetchListingsByIds([...favs]).then((items) => {
      if (items.length) setProducts((prev) => mergeProducts(prev, items));
    });
  }, [authReady, favs]);

  React.useEffect(() => {
    setSearchValue(t('screens.search.defaultQuery'));
    setDeliveryMethod(t('screens.order.pickup'));
  }, [t, i18n.language]);

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 1700);
  }, []);

  const nav = useCallback((id: ScreenId) => {
    const href = screenPath(id) as Href;
    if (isTabScreen(id)) {
      router.replace(href);
      return;
    }
    router.push(href);
  }, []);

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

  const toggleFav = useCallback(async () => {
    const isFav = favs.has(currentItem.id);
    try {
      const next = await setFavorite(currentItem.id, !isFav, user != null);
      setFavs(next);
      toast(t(isFav ? 'toast.unfavorited' : 'toast.favorited'));
    } catch {
      toast(t(isFav ? 'toast.unfavorited' : 'toast.favorited'));
    }
  }, [currentItem.id, favs, t, toast, user]);

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
        setChatConversationId(conversation.id);
        setChatTitle(params.counterpartName ?? conversation.counterpartName);
        nav('chat');
      } catch {
        toast(t('toast.sendFailed'));
      }
    },
    [nav, t, toast, user],
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
    toast(t('toast.loggedOut'));
    router.replace(ROOT_PATH);
  }, [t, toast]);

  const activeTab = TAB_MAP[current] ?? null;

  const value = useMemo(
    () => ({
      current,
      nav,
      requireAuthNav,
      goBack,
      toast,
      toastMessage,
      toastVisible,
      products,
      currentItem,
      openDetail,
      loadProduct,
      favs,
      toggleFav,
      favCount: favs.size,
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
      chatTitle,
      chatConversationId,
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
      requireAuthNav,
      goBack,
      toast,
      toastMessage,
      toastVisible,
      products,
      currentItem,
      openDetail,
      loadProduct,
      favs,
      toggleFav,
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
      chatTitle,
      chatConversationId,
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
