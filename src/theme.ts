import { ViewStyle } from 'react-native';

export const colors = {
  bg: '#F5F5F5',
  paper: '#ffffff',
  card: '#ffffff',
  text: '#151515',
  sub: '#777777',
  muted: '#a2a2a2',
  line: '#eeeeea',
  brand: '#ffc400',
  brand2: '#ff7a2f',
  brand3: '#fff2be',
  green: '#2abf75',
  red: '#f04438',
  blue: '#3a7afe',
  stage: '#ededed',
  phoneBorder: '#111111',
};

export const radius = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 24,
  amazing: 34,
  pill: 999,
  phone: 38,
};

export const spacing = {
  screenPadding: 14,
  screenBottomNav: 88,
  screenBottomNoNav: 24,
  statusHeight: 34,
  bottomNavHeight: 78,
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

export const amazingStyleBg = '#f5f5f5';

/** Layered drop shadow — RN approximation of the design “amazing style”. */
export const amazingStyleShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 4,
};

/** Inset top highlight paired with `amazingStyle`. */
export const amazingStyleHighlight: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  backgroundColor: '#ffffff',
};

/** Base amazing style surface — extend with layout, padding, or radius as needed. */
export const amazingStyle: ViewStyle = {
  backgroundColor: amazingStyleBg,
  borderRadius: radius.amazing,
  overflow: 'hidden',
  ...amazingStyleShadow,
};

/** Pill-shaped amazing style (e.g. region selector). */
export const amazingStylePill: ViewStyle = {
  ...amazingStyle,
  borderRadius: 60,
};

/** White filter-icon chip with a soft drop shadow (home/category category row). */
export const filterIconTile: ViewStyle = {
  backgroundColor: colors.paper,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

/** Muted gray-brown for filter icon glyphs and labels. */
export const filterIconColor = '#5c5349';
export const filterIconLabelColor = '#444444';
