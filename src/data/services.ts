import { productImageUrls } from './productImages';
import type { ProductCatKey } from '../types';

export interface LocalService {
  id: number;
  titleKey: string;
  priceKey: string;
  listPrice: number;
  sellerKey: string;
  seller: string;
  descKey: string;
  area: string;
  icon: 'truck' | 'broom' | 'cameraService';
  /** Preview photo for the service card and detail hero. */
  imageUrl?: string;
  /** When set, prefer API strings over i18n keys. */
  apiTitle?: string;
  apiDesc?: string;
  apiPriceLabel?: string;
}

export const localServices: LocalService[] = [
  {
    id: 1,
    titleKey: 'services.moving.title',
    priceKey: 'services.moving.price',
    listPrice: 60,
    sellerKey: 'allen',
    seller: 'Allen',
    descKey: 'services.moving.desc',
    area: 'Clayton / Box Hill',
    icon: 'truck',
    imageUrl: productImageUrls[11],
  },
  {
    id: 2,
    titleKey: 'services.cleaning.title',
    priceKey: 'services.cleaning.price',
    listPrice: 120,
    sellerKey: 'lily',
    seller: 'Lily',
    descKey: 'services.cleaning.desc',
    area: 'CBD / Southbank',
    icon: 'broom',
    imageUrl: productImageUrls[10],
  },
  {
    id: 3,
    titleKey: 'services.photo.title',
    priceKey: 'services.photo.price',
    listPrice: 80,
    sellerKey: 'mia',
    seller: 'Mia_墨尔本',
    descKey: 'services.photo.desc',
    area: 'Melbourne',
    icon: 'cameraService',
    imageUrl: productImageUrls[4],
  },
];

import { ALL_AREAS } from './region';

export function serviceInRegion(area: string, regionArea: string): boolean {
  if (regionArea === ALL_AREAS) return true;
  if (regionArea === 'Melbourne CBD') return area.includes('CBD') || area.includes('Melbourne');
  return area.includes(regionArea);
}

/** Match mock/local service cards to a product category shortcut. */
export function serviceMatchesCategory(service: LocalService, catKey: ProductCatKey): boolean {
  if (catKey === 'services') return true;
  if (catKey === 'home') return service.icon === 'truck' || service.icon === 'broom';
  if (catKey === 'beauty') return service.icon === 'cameraService';
  return false;
}

export function resolveServiceIcon(serviceTypeKey: string): LocalService['icon'] {
  if (serviceTypeKey === 'cleaning') return 'broom';
  if (serviceTypeKey === 'photography') return 'cameraService';
  return 'truck';
}

export function serviceTypeKeyFromIcon(icon?: string): string {
  if (icon === 'broom') return 'cleaning';
  if (icon === 'cameraService') return 'photography';
  return 'moving';
}
