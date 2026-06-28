/** Full-width profile page promo banner artwork (English). */
export const PROFILE_PAGE_BANNER_EN = require('./profile-page-banner-en.png');

/** Full-width profile page promo banner artwork (Chinese). */
export const PROFILE_PAGE_BANNER_ZH = require('./profile-page-banner-zh.png');

/** width:height of profile page banner PNGs (2170x725). */
export const PROFILE_PAGE_BANNER_ASPECT = 2170 / 725;

export function profilePageBannerForLanguage(language: string): number {
  return language.startsWith('zh') ? PROFILE_PAGE_BANNER_ZH : PROFILE_PAGE_BANNER_EN;
}
