import { products } from './products';

/** Seeded demo listings — titles/sellers must come from i18n in Chinese mode. */
export const DEMO_PRODUCT_MAX_ID = 12;

export const DEMO_SERVICE_LISTING_IDS = [101, 102, 103] as const;

const SELLER_KEY_BY_LISTING = new Map<number, string>(
  products.map((product) => [product.id, product.sellerKey]),
);

const SERVICE_SELLER_KEY: Record<number, string> = {
  101: 'allen',
  102: 'lily',
  103: 'mia',
};

const SERVICE_I18N_KEYS: Record<number, { titleKey: string; descKey: string }> = {
  101: { titleKey: 'services.moving.title', descKey: 'services.moving.desc' },
  102: { titleKey: 'services.cleaning.title', descKey: 'services.cleaning.desc' },
  103: { titleKey: 'services.photo.title', descKey: 'services.photo.desc' },
};

export function sellerKeyFromUserId(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  if (userId.startsWith('seller-')) return userId.slice('seller-'.length);
  return undefined;
}

export function isDemoCatalogListing(id: number): boolean {
  return (id >= 1 && id <= DEMO_PRODUCT_MAX_ID) || id in SERVICE_SELLER_KEY;
}

export function resolveDemoSellerKey(listingId: number): string | undefined {
  return SELLER_KEY_BY_LISTING.get(listingId) ?? SERVICE_SELLER_KEY[listingId];
}

export function getDemoListingI18nKeys(
  listingId: number,
): { titleKey: string; descKey: string; visualKey: string } | null {
  if (listingId >= 1 && listingId <= DEMO_PRODUCT_MAX_ID) {
    return {
      titleKey: `products.items.${listingId}.title`,
      descKey: `products.items.${listingId}.desc`,
      visualKey: `products.items.${listingId}.visual`,
    };
  }
  const service = SERVICE_I18N_KEYS[listingId];
  if (service) {
    return { ...service, visualKey: service.titleKey };
  }
  return null;
}

export function shouldUseDemoI18n(language: string, listingId: number): boolean {
  return language.startsWith('zh') && isDemoCatalogListing(listingId);
}