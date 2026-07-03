import { router, type Href } from 'expo-router';
import i18n from '../i18n';
import { isTabScreen, ROOT_PATH, screenPath } from '../routing/paths';
import type { ScreenId } from '../types';
import { useAuthStore } from './authStore';
import { useCheckoutStore } from './checkoutStore';
import { useSearchStore } from './searchStore';
import { toast } from './uiStore';

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
    toast(i18n.t('toast.loginRequired'));
    nav('login');
    return;
  }
  nav(id);
}

export function openOrderCheckout(bundleItemId?: string): void {
  useCheckoutStore.getState().setCheckoutBundleItemId(bundleItemId ?? null);
  requireAuthNav('order');
}
