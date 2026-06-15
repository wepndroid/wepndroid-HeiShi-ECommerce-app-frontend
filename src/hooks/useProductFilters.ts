import { HomeTabKey, Product, ProductCatKey } from '../types';
import { productInRegion, RegionSelection, ALL_AREAS } from '../data/region';
import { products } from '../data/products';

const HOME_TAB_CAT: Partial<Record<HomeTabKey, ProductCatKey>> = {
  digital: 'digital',
  services: 'services',
  tickets: 'tickets',
};

export function categoryProducts(list: Product[], tab: HomeTabKey): Product[] {
  if (tab === 'recommended') return list;
  if (tab === 'newArrivals') return [...list].sort((a, b) => b.id - a.id);
  const cat = HOME_TAB_CAT[tab];
  return cat ? list.filter((p) => p.catKey === cat) : list;
}

export function filterByCat(list: Product[], catKey: ProductCatKey): Product[] {
  return list.filter((p) => p.catKey === catKey);
}

export function regionProducts(list: Product[], region: RegionSelection): Product[] {
  return list.filter((p) => productInRegion(p.loc, region));
}

export function homeFeedProducts(region: RegionSelection, tab: HomeTabKey): Product[] {
  return categoryProducts(regionProducts(products, region), tab);
}

export function feedTitleKey(tab: HomeTabKey, region: RegionSelection): string {
  const base =
    tab === 'recommended'
      ? 'home.feedTitleRecommended'
      : `homeTabs.${tab}`;
  if (region.area === ALL_AREAS) return base;
  return `${base}Area`;
}

export function resalePrice(price: number): number {
  return Math.round(price * 0.75);
}

export const ESCROW_FEE = 0.99;
