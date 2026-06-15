import { ScreenId, TabScreenId } from '../types';

/** Application root URL path (home feed). */
export const ROOT_PATH = '/' as const;

export type AppPath = (typeof ROUTE_PATHS)[ScreenId];

/** Canonical URL path for each screen (web + deep links). */
export const ROUTE_PATHS = {
  home: ROOT_PATH,
  category: '/category',
  publish: '/publish',
  messages: '/messages',
  profile: '/profile',
  search: '/search',
  detail: '/detail',
  order: '/order',
  uploadProduct: '/publish/product',
  publishService: '/publish/service',
  resale: '/resale',
  chat: '/chat',
  settings: '/settings',
  editProfile: '/profile/edit',
  address: '/profile/address',
  accountSafety: '/settings/account-safety',
  paymentSettings: '/settings/payment',
  payoutSettings: '/settings/payout',
  transactionReminder: '/settings/transaction-reminders',
  notificationSettings: '/settings/notifications',
  privacySettings: '/settings/privacy',
  about: '/settings/about',
  agreement: '/settings/agreement',
  privacyPolicy: '/settings/privacy-policy',
  help: '/help',
  login: '/login',
  register: '/register',
  authCenter: '/auth',
  creditProfile: '/profile/credit',
  reviewManage: '/profile/reviews',
  safetyCenter: '/safety',
  orders: '/profile/orders',
  myListings: '/profile/listings',
  sold: '/profile/sold',
  myServices: '/profile/services',
  favorites: '/profile/favorites',
  history: '/profile/history',
  following: '/profile/following',
  coupons: '/profile/coupons',
} as const satisfies Record<ScreenId, string>;

const TAB_SCREENS = new Set<TabScreenId>([
  'home',
  'category',
  'publish',
  'messages',
  'profile',
]);

/** Screens that hide the bottom tab bar. */
export const NO_NAV_PATH_PREFIXES = [
  '/search',
  '/detail',
  '/order',
  '/publish/product',
  '/publish/service',
  '/resale',
  '/chat',
  '/settings',
  '/auth',
  '/login',
  '/register',
  '/profile/edit',
  '/profile/address',
  '/profile/listings',
  '/profile/sold',
  '/profile/services',
  '/profile/favorites',
  '/profile/history',
  '/profile/following',
  '/profile/coupons',
  '/profile/orders',
  '/profile/credit',
  '/profile/reviews',
  '/help',
  '/safety',
] as const;

/** Path → screen id (longest prefix match for nested routes). */
const PATH_TO_SCREEN: { path: string; screen: ScreenId }[] = Object.entries(ROUTE_PATHS)
  .map(([screen, path]) => ({ path, screen: screen as ScreenId }))
  .sort((a, b) => b.path.length - a.path.length);

export function isRootPath(pathname: string): boolean {
  return normalizePathname(pathname) === ROOT_PATH;
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return ROOT_PATH;
  const trimmed = pathname.replace(/\/+$/, '') || ROOT_PATH;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function screenPath(screen: ScreenId, params?: { productId?: number }): string {
  if (screen === 'detail' && params?.productId != null) {
    return `${ROUTE_PATHS.detail}/${params.productId}`;
  }
  return ROUTE_PATHS[screen];
}

export function pathnameToScreenId(pathname: string): ScreenId {
  const path = normalizePathname(pathname);

  if (path.startsWith(`${ROUTE_PATHS.detail}/`)) {
    return 'detail';
  }

  for (const { path: routePath, screen } of PATH_TO_SCREEN) {
    if (routePath === ROOT_PATH) {
      if (path === ROOT_PATH) return 'home';
      continue;
    }
    if (path === routePath || path.startsWith(`${routePath}/`)) {
      return screen;
    }
  }

  return 'home';
}

export function showBottomNav(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (path === ROOT_PATH) return true;
  return !NO_NAV_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function isTabScreen(screen: ScreenId): screen is TabScreenId {
  return TAB_SCREENS.has(screen as TabScreenId);
}

export function productIdFromPathname(pathname: string): number | null {
  const path = normalizePathname(pathname);
  const prefix = `${ROUTE_PATHS.detail}/`;
  if (!path.startsWith(prefix)) return null;
  const id = Number(path.slice(prefix.length).split('/')[0]);
  return Number.isFinite(id) ? id : null;
}
