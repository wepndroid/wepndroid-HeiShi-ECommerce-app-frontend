import { Product } from '../types';
import { localServices, LocalService } from './services';
import { productById, products } from './products';

/** Detail route ids for local services (101 = moving, 102 = cleaning, …). */
export const SERVICE_DETAIL_BASE = 100;

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
    titleKey: service.titleKey || undefined,
    descKey: service.descKey || undefined,
    visualKey: service.titleKey || undefined,
    apiTitle: service.apiTitle,
    apiDesc: service.apiDesc,
    apiVisual: service.apiTitle,
  };
}

export function resolveDetailProduct(id: number): Product | undefined {
  const catalog = productById(id);
  if (catalog) return catalog;

  const service = localServices.find((s) => SERVICE_DETAIL_BASE + s.id === id);
  if (!service) return undefined;

  const fallbackImage = products[0]?.imageUrl ?? '';
  return serviceDetailProduct(service, fallbackImage);
}
