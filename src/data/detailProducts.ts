import { Product } from '../types';
import { isDemoCatalogListing } from './catalogDemo';
import { demoBundleMeta } from './bundle';
import { localServices, LocalService } from './services';
import { productById, products } from './products';

/** Demo clearance bundle listing id (matches backend seed). */
export const BUNDLE_DETAIL_ID = 200;

/** Detail route ids for local services (101 = moving, 102 = cleaning, …). */
export const SERVICE_DETAIL_BASE = 100;

/** Seeded demo listings only — not real API ids above 100 (e.g. user-published #131). */
export function isLocalDetailListing(id: number): boolean {
  return isDemoCatalogListing(id) || id === BUNDLE_DETAIL_ID;
}

export function serviceDetailProduct(service: LocalService, imageUrl: string): Product {
  return {
    id: SERVICE_DETAIL_BASE + service.id,
    price: service.listPrice,
    catKey: 'services',
    tagKey: 'localService',
    sellerKey: service.sellerKey,
    seller: service.seller,
    loc: service.area,
    height: '',
    imageUrl,
    imageUrls: [imageUrl],
    titleKey: service.titleKey || undefined,
    descKey: service.descKey || undefined,
    visualKey: service.titleKey || undefined,
    apiTitle: service.apiTitle,
    apiDesc: service.apiDesc,
    apiVisual: service.apiTitle,
    favoriteCount: 0,
  };
}

export function resolveDetailProduct(id: number): Product | undefined {
  if (id === BUNDLE_DETAIL_ID) {
    const bundleMeta = demoBundleMeta();
    const coverUrl = bundleMeta.coverImageUrls?.[0] ?? products[0].imageUrl;
    return {
      id: BUNDLE_DETAIL_ID,
      price: bundleMeta.fullPrice,
      catKey: 'home',
      tagKey: 'bundleSet',
      sellerKey: 'amy',
      seller: 'Amy',
      loc: 'Clayton',
      height: 'tall',
      imageUrl: coverUrl,
      imageUrls: bundleMeta.coverImageUrls?.length ? bundleMeta.coverImageUrls : [coverUrl],
      apiTitle: 'Clayton 2BR whole-home clearance',
      apiDesc: 'Near Monash, pickup by Jun 28. Buy separately or as a bundle.',
      listingType: 'bundle',
      bundleMeta,
      favoriteCount: 12,
    };
  }

  const catalog = productById(id);
  if (catalog) return catalog;

  const service = localServices.find((s) => SERVICE_DETAIL_BASE + s.id === id);
  if (!service) return undefined;

  const fallbackImage = products[0]?.imageUrl ?? '';
  return serviceDetailProduct(service, fallbackImage);
}
