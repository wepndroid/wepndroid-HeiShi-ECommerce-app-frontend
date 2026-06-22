/** Full-width local (Category) page banner artwork (English). */
export const LOCAL_PAGE_BANNER_EN = require('./local-page-banner-en.png');

/** Full-width local (Category) page banner artwork (Chinese). */
export const LOCAL_PAGE_BANNER_ZH = require('./local-page-banner-zh.png');

/** width:height of local page banner PNGs (2172x724 EN, 2048x768 ZH). */
export const LOCAL_PAGE_BANNER_ASPECT = 3;

export function localPageBannerForLanguage(language: string): number {
  return language.startsWith('zh') ? LOCAL_PAGE_BANNER_ZH : LOCAL_PAGE_BANNER_EN;
}
