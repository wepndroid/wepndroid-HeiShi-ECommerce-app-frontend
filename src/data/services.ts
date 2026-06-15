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
  },
];

import { ALL_AREAS } from './region';

export function serviceInRegion(area: string, regionArea: string): boolean {
  if (regionArea === ALL_AREAS) return true;
  if (regionArea === 'Melbourne CBD') return area.includes('CBD') || area.includes('Melbourne');
  return area.includes(regionArea);
}
