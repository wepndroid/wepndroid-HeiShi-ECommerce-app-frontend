import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { saveSession } from '../data/auth';
import { bootstrapAuth } from '../services/authService';
import { fetchUserProfile } from '../services/userService';
import { bootstrapFavorites, bootstrapFollows } from '../services/userDataService';
import { bootstrapPaymentSelection, listCheckoutPaymentMethods } from '../services/paymentsService';
import { getAppCacheSizeLabel } from '../services/settingsService';
import { registerNotificationOpenHandler } from '../services/messageNotifications';
import { loadPublishBundleDraft, shouldResumePublishBundle } from '../data/publishBundleDraft';
import { setAppLanguage } from '../i18n';
import { useCatalogRevision } from '../utils/catalogSync';
import { useFeed } from '../hooks/useFeed';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import { toast } from './uiStore';
import { useAuthStore } from './authStore';
import { useCatalogStore, applySelfAvatarToProducts, fetchListingsByIds } from './catalogStore';
import { useFavoritesStore } from './favoritesStore';
import { useRegionStore } from './regionStore';
import { useSearchStore } from './searchStore';
import { useChatStore } from './chatStore';
import { useCheckoutStore } from './checkoutStore';
import { useSettingsStore } from './settingsStore';
import { nav } from './navigation';

// Runs the app-wide side effects that used to live in AppProvider: auth
// bootstrap, profile/avatar/payment hydration, feed wiring, and notifications.
// Renders nothing — it just orchestrates stores. Mount once under providers.
export function AppBootstrap() {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const profileAvatarUrl = useAuthStore((s) => s.profileAvatarUrl);
  const favs = useFavoritesStore((s) => s.favs);
  const region = useRegionStore((s) => s.region);
  const homeTabKey = useCatalogStore((s) => s.homeTabKey);
  const homeCategory = useCatalogStore((s) => s.homeCategory);
  const chatConversationId = useChatStore((s) => s.chatConversationId);
  const catalogRevision = useCatalogRevision();

  const pendingChatConversationIdRef = useRef<string | null>(null);
  const bundleResumeCheckedRef = useRef(false);

  // Feed lives in a hook (region/tab/category driven); push results into store.
  const { items: homeFeed, loading: homeFeedLoading, error: homeFeedError, reload } = useFeed(
    region,
    homeTabKey,
    homeCategory,
  );
  useEffect(() => {
    useCatalogStore.getState().setHomeFeedResult(homeFeed, homeFeedLoading, homeFeedError);
  }, [homeFeed, homeFeedLoading, homeFeedError]);
  useEffect(() => {
    useCatalogStore.getState().setHomeFeedReload(reload);
  }, [reload]);
  useEffect(() => {
    if (homeFeed.length) useCatalogStore.getState().mergeCatalogProducts(homeFeed);
  }, [homeFeed]);

  // Auth bootstrap on mount.
  useEffect(() => {
    bootstrapAuth()
      .then((u) => useAuthStore.getState().setUser(u))
      .finally(() => useAuthStore.getState().setAuthReady(true));
  }, []);

  // Resolve profile avatar + preferred language once authed.
  useEffect(() => {
    if (!authReady) return;
    fetchUserProfile(user, user != null).then((profile) => {
      useAuthStore.getState().setProfileAvatarUrl(profile.avatarUrl);
      if (user != null && profile.avatarUrl && profile.avatarUrl !== user.avatarUrl) {
        const prev = useAuthStore.getState().user;
        if (prev) {
          const next = { ...prev, avatarUrl: profile.avatarUrl };
          void saveSession(next);
          useAuthStore.getState().setUser(next);
        }
      }
      if (user != null && (profile.language === 'en' || profile.language === 'zh')) {
        void setAppLanguage(profile.language);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  // Favorites + follows.
  useEffect(() => {
    if (!authReady) return;
    bootstrapFavorites(user != null).then((f) => useFavoritesStore.getState().setFavs(f));
    bootstrapFollows(user != null).then((f) => useFavoritesStore.getState().setFollows(f));
  }, [authReady, user]);

  // Checkout payment options + default selection.
  useEffect(() => {
    if (!authReady) return;
    listCheckoutPaymentMethods(user != null).then(async (methods) => {
      const checkout = useCheckoutStore.getState();
      checkout.setPaymentMethods(methods);
      if (!methods.length) {
        checkout.applyPaymentSelection(undefined, '');
        return;
      }
      const selected = await bootstrapPaymentSelection(methods);
      if (selected) checkout.applyPaymentSelection(selected.id, selected.label);
      else checkout.applyPaymentSelection(undefined, '');
    });
  }, [authReady, user, language]);

  // Cache size label.
  useEffect(() => {
    void getAppCacheSizeLabel().then((s) => useSettingsStore.getState().setCacheSize(s));
  }, [language]);

  // Hydrate favorite listings into the catalog.
  useEffect(() => {
    if (!authReady || favs.size === 0) return;
    fetchListingsByIds([...favs]).then((items) => {
      if (items.length) useCatalogStore.getState().mergeCatalogProducts(items);
    });
  }, [authReady, favs, language, catalogRevision]);

  // Stamp the current user's avatar onto their own listings.
  useEffect(() => {
    if (!user?.id) return;
    const avatar = user.avatarUrl ?? profileAvatarUrl;
    if (!avatar) return;
    const catalog = useCatalogStore.getState();
    catalog.setProducts((prev) => applySelfAvatarToProducts(prev, user, profileAvatarUrl));
    catalog.setCurrentItem((prev) => applySelfAvatarToProducts([prev], user, profileAvatarUrl)[0] ?? prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.avatarUrl, user?.nickname, profileAvatarUrl]);

  // Default delivery method once.
  useEffect(() => {
    const checkout = useCheckoutStore.getState();
    if (!checkout.deliveryMethod) checkout.setDeliveryMethod('meetup');
  }, []);

  // Clear image-search session when the language changes.
  useEffect(() => {
    useSearchStore.getState().clearImageSearch();
  }, [language]);

  // Foreground chat notification toast + inbox polling.
  const handleForegroundChatMessage = useCallback(
    (conv: { counterpartName: string; lastMessage: string }) => {
      toast(i18n.t('notifications.newMessageTitle', { name: conv.counterpartName }));
    },
    [i18n],
  );
  useMessageNotifications(user != null, authReady, chatConversationId, handleForegroundChatMessage);

  // Tapping a push notification.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    return registerNotificationOpenHandler((payload) => {
      if (payload.type === 'deepLink') {
        router.push(payload.path as Href);
        return;
      }
      if (payload.type === 'order') {
        const filter = payload.filter ?? 'pendingShip';
        router.push(`/profile/sold?filter=${filter}` as Href);
        return;
      }
      if (!authReady || !user) {
        pendingChatConversationIdRef.current = payload.conversationId;
        return;
      }
      void useChatStore.getState().openChat({ conversationId: payload.conversationId });
    });
  }, [authReady, user]);

  // Flush a chat that arrived before auth was ready.
  useEffect(() => {
    if (!authReady || !user) return;
    const pending = pendingChatConversationIdRef.current;
    if (!pending) return;
    pendingChatConversationIdRef.current = null;
    void useChatStore.getState().openChat({ conversationId: pending });
  }, [authReady, user]);

  // Resume an in-progress bundle draft after bootstrap.
  useEffect(() => {
    if (!authReady || bundleResumeCheckedRef.current) return;
    bundleResumeCheckedRef.current = true;
    void loadPublishBundleDraft().then((draft) => {
      if (!draft || !shouldResumePublishBundle(draft)) return;
      nav('publishBundle');
    });
  }, [authReady]);

  return null;
}
