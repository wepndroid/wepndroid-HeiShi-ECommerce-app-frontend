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

/** Product card preview width:height — reference 211×275 (~4:5.2 portrait). */
export const CARD_PREVIEW_ASPECT_RATIO = 211 / 275;

/** Feed product card corner radius — subtle rounding. */
export const PRODUCT_CARD_RADIUS = radius.md;

/** Type scale (sp) */
export const typography = {
  nav: 10,
  badge: 10,
  meta: 11,
  bodySm: 12,
  /** Inline form labels (Title, Category, Description, …) */
  formLabel: 12,
  /** All text inputs and picker values app-wide */
  formField: 13,
  body: 14,
  section: 16,
  title: 17,
  priceFeed: 14,
  priceDetail: 24,
  hero: 20,
};

/** Feed product card text sizes. */
export const productCardTokens = {
  titleSize: 12,
  titleLineHeight: 16,
  priceSize: typography.priceFeed,
  metaSize: 10,
  locSize: 9,
} as const;

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

/** Shared form field tokens (inputs, selects, switches). */
export const formControls = {
  iconColor: colors.brand2,
  fill: '#FAFAFA',
  borderColor: colors.line,
  radius: radius.md,
  rowPaddingVertical: 13,
  labelWidth: 86,
  iconWidth: 20,
  rowGap: 6,
  controlMinHeight: 38,
  controlPaddingH: 12,
  fontSize: typography.formField,
  labelFontSize: typography.formLabel,
  chevronColor: colors.muted,
  placeholderColor: colors.placeholder,
} as const;

/** Icon sizes and tints — use AppIcon with these tokens, not ad-hoc hex colors. */
export const iconTokens = {
  /** List rows, settings, messages, detail highlights */
  accent: colors.brand2,
  /** Default chrome icons (nav, toolbars) */
  default: colors.text,
  muted: colors.muted,
  onBrand: colors.text,
  onDark: colors.paper,
  sizes: {
    sm: 16,
    md: 18,
    lg: 22,
    xl: 28,
  },
} as const;

/** Product / status tag chips (Badge component). */
export const badgeTokens = {
  fill: '#FFF0F0',
  text: colors.red,
  radius: radius.pill,
  paddingH: 6,
  paddingV: 2,
  fontSize: typography.badge,
} as const;

/** Empty list / no-results blocks. */
export const emptyStateTokens = {
  borderColor: colors.line,
  radius: radius.md,
  paddingH: 12,
  paddingV: 16,
  textColor: colors.sub,
  fontSize: typography.body,
  hintFontSize: typography.bodySm,
  hintColor: colors.muted,
} as const;

/** Loading spinners and status copy. */
export const loadingStateTokens = {
  spinnerColor: colors.brand2,
  spinnerColorOnDark: colors.paper,
  textColor: colors.sub,
  fontSize: typography.bodySm,
  gap: 8,
  paddingV: 24,
} as const;

export const amazingStyleBg = '#FFFFFF';

/** Soft card elevation */
export const cardShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

/** Single import surface for new screens — re-exports core tokens. */
export const designSystem = {
  colors,
  typography,
  radius,
  spacing,
  fonts,
  formControls,
  iconTokens,
  badgeTokens,
  emptyStateTokens,
  loadingStateTokens,
  cardShadow,
  CARD_PREVIEW_ASPECT_RATIO,
  PRODUCT_CARD_RADIUS,
} as const;

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
  fontSize: formControls.fontSize,
  color: colors.text,
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
