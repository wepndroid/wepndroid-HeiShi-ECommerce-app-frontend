import type { HomeCategoryKey } from './homeCategories';

/** Photo-style product thumbnails for the home promo banner (distinct from top 3D icons). */
export const HOME_BANNER_CATEGORY_IMAGES: Record<HomeCategoryKey, number> = {
  digital: require('./banner-categories/banner-digital.png'),
  home: require('./banner-categories/banner-home.png'),
  fashion: require('./banner-categories/banner-fashion.png'),
  beauty: require('./banner-categories/banner-beauty.png'),
  misc: require('./banner-categories/banner-misc.png'),
};