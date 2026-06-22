import type { ProductCatKey } from '../types';

/** Homepage category shortcut icons (Xianyu-style 3D assets). */
export const HOME_CATEGORY_ICONS: Record<
  'digital' | 'home' | 'fashion' | 'beauty' | 'misc',
  number
> = {
  digital: require('./home-categories/cat-digital.png'),
  home: require('./home-categories/cat-home.png'),
  fashion: require('./home-categories/cat-fashion.png'),
  beauty: require('./home-categories/cat-beauty.png'),
  misc: require('./home-categories/cat-misc.png'),
};

export type HomeCategoryKey = keyof typeof HOME_CATEGORY_ICONS;

export function homeCategoryIcon(catKey: ProductCatKey): number | undefined {
  if (catKey in HOME_CATEGORY_ICONS) {
    return HOME_CATEGORY_ICONS[catKey as HomeCategoryKey];
  }
  return undefined;
}