import { HOME_PROMO_BANNER_EN, HOME_PROMO_BANNER_ZH } from './homeBanner';
import { LOCAL_PAGE_BANNER_EN, LOCAL_PAGE_BANNER_ZH } from './localBanner';
import { PROFILE_PAGE_BANNER_EN, PROFILE_PAGE_BANNER_ZH } from './profileBanner';

/** Known width:height ratios for bundled banner PNGs (web-safe; no resolveAssetSource). */
const BANNER_ASPECT_BY_SOURCE: Record<number, number> = {
  [HOME_PROMO_BANNER_EN]: 2163 / 727,
  [HOME_PROMO_BANNER_ZH]: 2172 / 724,
  [LOCAL_PAGE_BANNER_EN]: 2172 / 724,
  [LOCAL_PAGE_BANNER_ZH]: 2172 / 724,
  [PROFILE_PAGE_BANNER_EN]: 2170 / 725,
  [PROFILE_PAGE_BANNER_ZH]: 2170 / 725,
};

const DEFAULT_BANNER_ASPECT = 3;

export function bannerArtworkAspectRatio(source: number): number {
  return BANNER_ASPECT_BY_SOURCE[source] ?? DEFAULT_BANNER_ASPECT;
}
