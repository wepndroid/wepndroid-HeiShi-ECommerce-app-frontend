import { HomeTabKey, Product, ProductCatKey } from '../types';
import { productInRegion, RegionSelection, ALL_AREAS, regionData, allKnownAreas } from '../data/region';
import { products } from '../data/products';

const HOME_TAB_CAT: Partial<Record<HomeTabKey, ProductCatKey>> = {
  digital: 'digital',
  services: 'services',
  tickets: 'tickets',
};

const CATEGORY_HOME_TAB: Partial<Record<ProductCatKey, HomeTabKey>> = {
  digital: 'digital',
  services: 'services',
  tickets: 'tickets',
};

/** Pick home tab + optional category when a category shortcut is tapped. */
export function homeFilterForCategory(
  catKey: ProductCatKey,
  currentTab: HomeTabKey,
): { tab: HomeTabKey; category: ProductCatKey | null } {
  const tab = CATEGORY_HOME_TAB[catKey];
  if (tab) return { tab, category: null };
  return { tab: currentTab, category: catKey };
}

export function categoryProducts(list: Product[], tab: HomeTabKey): Product[] {
  if (tab === 'recommended') return list;
  if (tab === 'newArrivals') return [...list].sort((a, b) => b.id - a.id);
  if (tab === 'jobs') return list.filter((p) => p.listingType === 'job');
  if (tab === 'rentals') return list.filter((p) => p.listingType === 'rental');
  if (tab === 'secondhand') {
    return list.filter((p) => !p.listingType || p.listingType === 'product' || p.listingType === 'bundle');
  }
  const cat = HOME_TAB_CAT[tab];
  return cat ? list.filter((p) => p.catKey === cat) : list;
}

export function filterByCat(list: Product[], catKey: ProductCatKey): Product[] {
  return list.filter((p) => p.catKey === catKey);
}

export function regionProducts(list: Product[], region: RegionSelection): Product[] {
  return list.filter((p) => productInRegion(p.loc, region));
}

/** Minimum feed size before other-city listings are shown as spillover. */
const FEED_MIN_RESULTS = 6;

/** Resolve which supported city a listing location belongs to (null if unknown). */
function cityForLoc(loc: string): string | null {
  if (!loc) return null;
  const normalized = loc === 'CBD' ? 'Melbourne CBD' : loc;
  for (const group of regionData) {
    for (const city of group.cities) {
      if (normalized === city.name || normalized.includes(city.name)) return city.name;
      if (allKnownAreas(city).some((area) => normalized === area || normalized.includes(area))) {
        return city.name;
      }
    }
  }
  return null;
}

/**
 * City-first ranking with spillover (PRD §5.2): the selected city (and area, when a
 * specific one is chosen) ranks first; if there are fewer than FEED_MIN_RESULTS, listings
 * from other cities are appended so the feed is never sparse.
 */
export function cityFirstWithSpillover(pool: Product[], region: RegionSelection): Product[] {
  const inCity = pool.filter((p) => {
    if (cityForLoc(p.loc) !== region.city) return false;
    if (region.area === ALL_AREAS) return true;
    return productInRegion(p.loc, region);
  });
  if (inCity.length >= FEED_MIN_RESULTS) return inCity;
  const spillover = pool.filter((p) => !inCity.includes(p));
  return [...inCity, ...spillover];
}

export function homeFeedProducts(region: RegionSelection, tab: HomeTabKey): Product[] {
  return cityFirstWithSpillover(categoryProducts(products, tab), region);
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

export const ESCROW_FEE = 0;
