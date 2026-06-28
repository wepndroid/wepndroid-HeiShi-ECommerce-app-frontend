/** Full-width home promo banner artwork (English). */
export const HOME_PROMO_BANNER_EN = require('./home-promo-banner-en.png');

/** Full-width home promo banner artwork (Chinese). */
export const HOME_PROMO_BANNER_ZH = require('./home-promo-banner-zh.png');

/** width:height of promo banner PNGs (EN 2163x727, ZH 2172x724). */
export const HOME_PROMO_BANNER_ASPECT = 2163 / 727;

export function homePromoBannerForLanguage(language: string): number {
  return language.startsWith('zh') ? HOME_PROMO_BANNER_ZH : HOME_PROMO_BANNER_EN;
}