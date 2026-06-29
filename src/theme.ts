import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/** v7-aligned palette — yellow reserved for active state, primary CTAs, key hints */
export const colors = {
  bg: '#F7F5EF',
  paper: '#FFFFFF',
  card: '#FFFFFF',
  text: '#161616',
  sub: '#62656A',
  muted: '#999DA3',
  line: '#E8E1D3',
  /** Primary CTA yellow (v7 --hs-yellow) */
  brand: '#FFD92E',
  /** Accent icons, active nav, spinners */
  brand2: '#FFAA00',
  /** Soft yellow chips — active filters only */
  brand3: '#FFF7D5',
  /** Platform trust notices and hints (v7 green-soft) */
  trustSoft: '#EAF8F1',
  trustBorder: '#CDEEDC',
  trustText: '#24563E',
  /** Neutral fills — avatars, list icons (not brand yellow) */
  surfaceMuted: '#FBFAF6',
  green: '#20B878',
  /** Price / alert red */
  red: '#FF4D4F',
  /** Buy-now / payment orange */
  purchase: '#FF5000',
  blue: '#108EE9',
  stage: '#EBEEEF',
  /** Empty / unfilled star rating fill */
  starEmpty: '#bcc5d3',
  phoneBorder: '#111111',
  searchFill: '#FFFFFF',
  searchHint: '#9C9C9D',
  searchIcon: '#B2B2B2',
  placeholder: '#B3B3B3',
  loginBar: '#222222',
};

/** Xianyu-style radii — compact cards; pills for search/buttons. Input fields keep formControls.radius. */
export const radius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  amazing: 8,
  pill: 999,
  phone: 38,
  /** Bottom sheet top corners — aligned with v7 sheet but slightly tighter than 28dp demo HTML */
  bottomSheet: 20,
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

/** Product card preview — v7 feed uses 1:1 square tiles on 390dp width. */
export const CARD_PREVIEW_ASPECT_RATIO = 1;

/** Feed product card corner radius (v7 --hs-radius-md). */
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
  titleLineHeight: 15,
  priceSize: 12,
  tagSize: 8,
  metaSize: 9,
  locSize: 8,
} as const;

/** Local service row card — match listing card density (Category, Search). */
export const serviceCardTokens = {
  titleSize: productCardTokens.titleSize,
  titleLineHeight: productCardTokens.titleLineHeight,
  descSize: 10,
  descLineHeight: 13,
  metaSize: productCardTokens.metaSize,
  tagSize: productCardTokens.tagSize,
  thumbSize: 44,
  paddingVertical: 8,
  paddingHorizontal: 10,
  rowGap: 8,
  marginBottom: 4,
} as const;

/** Home feed tab bar text sizes. */
export const homeScreenTokens = {
  tabSize: 13,
  /** Header PNG logo width (Home + Profile top bar). */
  logoWidth: 100,
} as const;

/** Full-bleed home/profile header row — logo sits at the screen edge. */
export const headerTopBleedStyle: ViewStyle = {
  marginHorizontal: -spacing.screenPadding,
  paddingLeft: 0,
  paddingRight: spacing.screenPadding,
};

/** Shared section header spacing and feed-list title scale (Home, Local, Search results, …). */
export const sectionHeadTokens = {
  marginTop: 10,
  marginBottom: 10,
  feedTitleSize: 14,
  feedActionSize: 10,
} as const;

/** Profile page text sizes and layout. */
export const profileScreenTokens = {
  nameSize: 15,
  sectionTitleSize: 13,
  idLineSize: 10,
  avatarSize: 46,
  statValueSize: 14,
  statLabelSize: 8,
  statsMarginTop: 8,
  statsRadius: 8,
  editBtnHeight: 30,
  bannerActionWidth: 56,
  bannerActionHeight: 28,
  bannerActionRight: 14,
  bannerActionRadius: 14,
  /** Equal vertical gap before/after the profile promo banner. */
  bannerGap: 12,
} as const;

/** Messages inbox list typography and row layout. */
export const messagesScreenTokens = {
  titleSize: 14,
  previewSize: 12,
  timeSize: 11,
  unreadSize: 9,
  groupBodySize: 12,
  groupBodyLineHeight: 15,
  emptySize: 13,
  rowPaddingVertical: 8,
  rowGap: 10,
  avatarSize: 40,
  previewGap: 0,
  listCardPaddingVertical: 4,
  groupBodyLines: 2,
} as const;

/** Publish hub page text sizes. */
export const publishScreenTokens = {
  hubTitleSize: 13,
  hubSubSize: 11,
  hubBtnSize: 11,
  optTitleSize: 13,
  optDescSize: 10,
  stepTitleSize: 10,
  stepSubSize: 8,
  /** Single-line inputs and selects on publish forms. */
  inputRadius: 8,
} as const;

/** Product detail page text sizes. */
export const detailPageTokens = {
  priceSize: 22,
  titleSize: 15,
  titleLineHeight: 20,
  bodySize: 13,
  bodyLineHeight: 18,
  cardHeadingSize: 14,
  sectionTitleSize: 14,
  sectionActionSize: 10,
  authorNameSize: 13,
  authorSubSize: 11,
  tagSize: 9,
  galleryMetaSize: 10,
  bundlePriceSize: 20,
  bundleHeadingSize: 14,
  bundleItemTitleSize: 13,
  bundleMetaSize: 11,
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
  fill: colors.paper,
  borderColor: colors.line,
  /** v7 boxed inputs — 10dp radius */
  radius: 8,
  rowPaddingVertical: 8,
  labelWidth: 86,
  iconWidth: 20,
  rowGap: 6,
  controlMinHeight: 28,
  controlLineHeight: 15,
  controlPaddingH: 8,
  /** Single-line inputs: vertical centering via box, not input padding */
  controlPaddingV: 0,
  /** Multiline inner padding once user types */
  multilinePaddingV: 4,
  /** Auto-growing multiline fields cap before inner scroll. */
  multilineMaxHeight: 84,
  /** Starts as two rows, then grows via onContentSizeChange. */
  multilineInitialRows: 2,
  fontSize: typography.formField,
  labelFontSize: typography.formLabel,
  chevronColor: colors.muted,
  placeholderColor: colors.placeholder,
} as const;

/** Min pixel height for multiline fields at initial row count. */
export const multilineInitialHeight =
  formControls.multilinePaddingV * 2 +
  formControls.controlLineHeight * formControls.multilineInitialRows;

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

/** Project-wide shadows — nearly flat; use these tokens everywhere instead of ad-hoc values. */
export const shadows = {
  card: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.055,
    shadowRadius: 9,
    elevation: 2,
  },
  navBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
  },
  accent: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.012,
    shadowRadius: 1,
    elevation: 0,
  },
  knob: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.012,
    shadowRadius: 1,
    elevation: 0,
  },
} as const satisfies Record<string, ViewStyle>;

/** @deprecated Use `shadows.card` — kept for existing imports. */
export const cardShadow: ViewStyle = shadows.card;

/** @deprecated Use `shadows.navBar` — kept for existing imports. */
export const navBarShadow: ViewStyle = shadows.navBar;

/** Search capsule — compact height, pill outline */
export const searchBarTokens = {
  height: 30,
  radius: 15,
  borderWidth: 1.5,
  btnSize: 24,
  fontSize: typography.formField,
  lineHeight: 15,
} as const;

/** Search capsule — white fill, rounded outline */
export const searchBarSurface: ViewStyle = {
  backgroundColor: colors.searchFill,
  borderWidth: searchBarTokens.borderWidth,
  borderColor: colors.phoneBorder,
  borderRadius: searchBarTokens.radius,
  overflow: 'hidden',
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
  shadows,
  CARD_PREVIEW_ASPECT_RATIO,
  PRODUCT_CARD_RADIUS,
  searchBarTokens,
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

/** Shared TextInput defaults — no focus ring / outline (especially on web). */
export const plainTextInput: TextStyle = {
  fontSize: formControls.fontSize,
  lineHeight: formControls.controlLineHeight,
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
