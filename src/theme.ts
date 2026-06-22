import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/** Xianyu-aligned palette */
export const colors = {
  bg: '#F5F5F5',
  paper: '#FFFFFF',
  card: '#FFFFFF',
  text: '#222222',
  sub: '#777777',
  muted: '#999999',
  line: '#EEEEEE',
  /** Primary CTA yellow */
  brand: '#FFE400',
  brand2: '#FFAA00',
  /** Light brand tint for badges, avatars, highlights */
  brand3: '#FFF9E0',
  green: '#29AB91',
  /** Price / alert red */
  red: '#FF4D4F',
  /** Buy-now / payment orange */
  purchase: '#FF5000',
  blue: '#108EE9',
  stage: '#EBEEEF',
  phoneBorder: '#111111',
  searchFill: '#F0F0F0',
  searchHint: '#9C9C9D',
  searchIcon: '#B2B2B2',
  placeholder: '#B3B3B3',
  loginBar: '#222222',
};

/** Xianyu-style radii — 12–16dp cards, pills for search/buttons */
export const radius = {
  sm: 6,
  md: 12,
  lg: 14,
  xl: 16,
  amazing: 12,
  pill: 999,
  phone: 38,
};

/** 16dp gutter; 56dp bottom nav */
export const spacing = {
  screenPadding: 16,
  screenBottomNav: 64,
  screenBottomNoNav: 24,
  statusHeight: 34,
  bottomNavHeight: 56,
};

/** Standard horizontal inset for full-bleed screens (e.g. chat composer). */
export const screenHorizontalInset: ViewStyle = {
  paddingHorizontal: spacing.screenPadding,
};

/** Product card preview width:height — reference 211×329 (~2:3 portrait). */
export const CARD_PREVIEW_ASPECT_RATIO = 211 / 329;

/** Feed product card corner radius — subtle rounding. */
export const PRODUCT_CARD_RADIUS = radius.md;

/** Type scale (sp) */
export const typography = {
  nav: 10,
  badge: 10,
  meta: 11,
  bodySm: 12,
  body: 14,
  section: 16,
  title: 17,
  priceFeed: 16,
  priceDetail: 24,
  hero: 20,
};

export const fonts = {
  regular: 'System',
  en: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    bold: 'Inter_700Bold',
  },
  weights: {
    medium: '500' as const,
    bold: '700' as const,
  },
};

export const amazingStyleBg = '#FFFFFF';

/** Soft card elevation */
export const cardShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export const amazingStyleShadow: ViewStyle = cardShadow;

/** No inset highlight on flat cards */
export const amazingStyleHighlight: ViewStyle = {
  display: 'none',
};

export const amazingStyle: ViewStyle = {
  backgroundColor: amazingStyleBg,
  borderRadius: radius.amazing,
  overflow: 'hidden',
  ...amazingStyleShadow,
};

export const amazingStylePill: ViewStyle = {
  backgroundColor: colors.paper,
  borderRadius: radius.pill,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.line,
  overflow: 'hidden',
};

/** Category shortcut tile */
export const filterIconTile: ViewStyle = {
  backgroundColor: colors.paper,
};

export const filterIconColor = colors.sub;
export const filterIconLabelColor = colors.text;

/** Search capsule — gray fill, no outline */
export const searchBarSurface: ViewStyle = {
  backgroundColor: colors.searchFill,
  borderWidth: 0,
  borderRadius: radius.pill,
};

/** Shared TextInput defaults — no focus ring / outline (especially on web). */
export const plainTextInput: TextStyle = {
  borderWidth: 0,
  backgroundColor: 'transparent',
  padding: 0,
  margin: 0,
  ...(Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
      } as TextStyle)
    : null),
};
