import { router, type Href } from 'expo-router';
import i18n from '../i18n';
import { isTabScreen, ROOT_PATH, screenPath } from '../routing/paths';
import type { ScreenId } from '../types';
import { useAuthStore } from './authStore';
import { useCheckoutStore } from './checkoutStore';
import { useSearchStore } from './searchStore';
import { toast } from './uiStore';
import {
  consumePendingAction,
  createPendingAction,
  type PendingActionContext,
} from '../services/pendingActionService';
import { setFavorite } from '../services/userDataService';

// Imperative navigation helpers. expo-router's `router` works outside React, so
// these live as plain functions callable from stores, services, or components.
export function nav(id: ScreenId): void {
  const href = screenPath(id) as Href;
  if (isTabScreen(id)) {
    router.replace(href);
    return;
  }
  router.push(href);
}

export function goBack(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(ROOT_PATH);
}

export function openSearch(): void {
  useSearchStore.getState().clearImageSearch();
  useSearchStore.getState().setSearchValue('');
  nav('search');
}

export function requireAuthNav(id: ScreenId): void {
  const { authReady, user } = useAuthStore.getState();
  if (!authReady) return;
  if (!user) {
    useAuthStore.getState().setPendingAuthPath(screenPath(id));
    void createPendingAction(screenPath(id)).catch(() => undefined);
    toast(i18n.t('toast.loginRequired'));
    nav('login');
    return;
  }
  nav(id);
}

export function resumePendingAuthAction(fallback: ScreenId = 'profile'): void {
  const pendingPath = useAuthStore.getState().consumePendingAuthPath();
  void consumePendingAction()
    .then((pendingAction) => {
      const destination = pendingAction?.returnPath ?? pendingPath;
      if (destination) {
        router.replace(destination as Href);
        if (pendingAction) void replayPendingAction(pendingAction);
        return;
      }
      nav(fallback);
    })
    .catch(() => {
      if (pendingPath) {
        router.replace(pendingPath as Href);
        return;
      }
      nav(fallback);
    });
}

async function replayPendingAction(action: PendingActionContext): Promise<void> {
  // Replaying a favorite is safe and idempotent because the desired final state
  // is explicit. Messaging/following need additional target or draft context,
  // so those actions return to their originating screen without guessing.
  if (action.actionType !== 'favorite_listing') return;
  const listingId = Number(action.returnPath.match(/^\/detail\/(\d+)(?:[/?#]|$)/)?.[1]);
  if (!Number.isInteger(listingId) || listingId <= 0) return;
  try {
    const favorites = await setFavorite(listingId, true, true);
    const { useFavoritesStore } = await import('./favoritesStore');
    useFavoritesStore.getState().setFavs(favorites);
    toast(i18n.t('toast.favorited'));
  } catch {
    toast(i18n.t('toast.favoriteFailed'));
  }
}

export function openOrderCheckout(bundleItemId?: string): void {
  useCheckoutStore.getState().setCheckoutBundleItemId(bundleItemId ?? null);
  requireAuthNav('order');
}
