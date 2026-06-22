import React, { RefObject } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NO_NAV_SCREENS } from '../data/productsNav';
import { AmazingSurface } from './AmazingSurface';
import { MarqueePlaceholder } from './MarqueeText';
import { colors, fonts, radius, searchBarSurface, spacing, typography } from '../theme';
import { useApp } from '../context/AppContext';
import { ScreenId, TabScreenId } from '../types';
import { AppIcon, AppIconName } from './AppIcon';
import { LOGO_ASPECT, LOGO_EN, LOGO_ZH } from '../assets/logos';

const TAB_ITEMS: { id: TabScreenId; icon: AppIconName; labelKey: string; publish?: boolean }[] = [
  { id: 'home', icon: 'home', labelKey: 'nav.home' },
  { id: 'category', icon: 'compass', labelKey: 'nav.category' },
  { id: 'publish', icon: 'add', labelKey: 'nav.publish', publish: true },
  { id: 'messages', icon: 'messages', labelKey: 'nav.messages' },
  { id: 'profile', icon: 'personCircle', labelKey: 'nav.profile' },
];

export function BottomNav(_props: { blurTarget?: RefObject<View | null> }) {
  const { nav, requireAuthNav, activeTab } = useApp();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomWrap,
        {
          height: spacing.bottomNavHeight + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.bottomRow}>
        {TAB_ITEMS.map((item) => {
        const active = activeTab === item.id;
        if (item.publish) {
          return (
            <Pressable key={item.id} style={styles.navItemPublish} onPress={() => requireAuthNav(item.id)}>
              <View style={styles.publishCircle}>
                <View style={styles.publishCircleIconWrap} pointerEvents="none">
                  <AppIcon name={item.icon} size={20} color={colors.phoneBorder} />
                </View>
                <Text style={styles.publishCircleLabel} numberOfLines={1}>
                  {t(item.labelKey)}
                </Text>
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable key={item.id} style={styles.navItem} onPress={() => nav(item.id)}>
            <AppIcon name={item.icon} size={22} color={active ? colors.brand2 : colors.text} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

export function Toast() {
  const { toastMessage, toastVisible } = useApp();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(25)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: toastVisible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: toastVisible ? 0 : 25,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toastVisible, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={styles.toastText} numberOfLines={1}>
        {toastMessage}
      </Text>
    </Animated.View>
  );
}

export function ScreenScroll({
  screenId,
  children,
  style,
  contentBottomInset = 0,
}: {
  screenId: ScreenId;
  children: React.ReactNode;
  style?: ViewStyle;
  contentBottomInset?: number;
}) {
  const noNav = NO_NAV_SCREENS.has(screenId);
  const baseBottom = noNav ? spacing.screenBottomNoNav : spacing.screenBottomNav;
  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={{
        padding: spacing.screenPadding,
        paddingBottom: contentBottomInset > 0 ? contentBottomInset : baseBottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const height = size;
  const width = height * LOGO_ASPECT;

  return (
    <View style={styles.logoWrap}>
      <Image
        source={isZh ? LOGO_ZH : LOGO_EN}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={isZh ? '嘿市' : 'HeyMarket'}
      />
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  dot,
  active,
}: {
  icon?: AppIconName;
  label?: string;
  onPress?: () => void;
  dot?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      style={[styles.iconbtn, active && styles.iconbtnActive]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      {icon ? (
        <AppIcon name={icon} size={18} color={active ? '#ffffff' : colors.text} />
      ) : (
        <Text style={[styles.iconbtnText, active && styles.iconbtnTextActive]}>{label}</Text>
      )}
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const { goBack } = useApp();
  return (
    <Pressable style={styles.back} onPress={onPress ?? goBack}>
      <AppIcon name="chevronBack" size={22} color={colors.text} />
    </Pressable>
  );
}

export function TitleBar({
  title,
  center,
  left,
  right,
}: {
  title?: string;
  center?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.titlebar}>
      {left ?? (title ? <Text style={styles.titlebarH1}>{title}</Text> : <BackButton />)}
      {center ? <Text style={styles.titlebarCenter}>{center}</Text> : null}
      {right ?? (title ? null : <View style={{ width: 38 }} />)}
    </View>
  );
}

export function SearchBar({
  placeholder,
  buttonLabel,
  value,
  onChangeText,
  onPress,
  onSubmit,
  readonly,
  showCamera,
  onCameraPress,
}: {
  placeholder: string;
  buttonLabel?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  onPress?: () => void;
  onSubmit?: () => void;
  readonly?: boolean;
  showCamera?: boolean;
  onCameraPress?: () => void;
}) {
  const { t } = useTranslation();

  const inner = (
    <View style={[searchBarSurface, styles.search]}>
      <AppIcon name="search" size={16} color={colors.searchIcon} />
      {readonly || !onChangeText ? (
        value ? (
          <Text style={styles.searchInput} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          <MarqueePlaceholder
            text={placeholder}
            style={[styles.searchInputText, styles.searchPlaceholder]}
            containerStyle={styles.searchInputWrap}
            always
          />
        )
      ) : (
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchInputField}
            placeholder={placeholder}
            placeholderTextColor={colors.searchHint}
            value={value}
            onChangeText={onChangeText}
            underlineColorAndroid="transparent"
          />
        </View>
      )}
      {showCamera ? (
        <Pressable
          onPress={onCameraPress}
          hitSlop={8}
          disabled={!onCameraPress}
          accessibilityRole="button"
          accessibilityLabel={t('common.a11y.searchByPhoto')}
        >
          <AppIcon name="camera" size={18} color={colors.searchIcon} />
        </Pressable>
      ) : null}
      <Pressable style={styles.searchBtn} onPress={onSubmit}>
        <AppIcon name="search" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}

export function SectionHead({
  title,
  action,
  subtitle,
  onAction,
}: {
  title: string;
  action?: string;
  subtitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[styles.sectionHead, subtitle && styles.sectionHeadStacked]}>
      <View style={styles.sectionHeadMain}>
        <Text style={styles.sectionTitle} numberOfLines={subtitle ? undefined : 1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} style={styles.sectionActionWrap} disabled={!onAction}>
          <Text style={styles.sectionAction} numberOfLines={onAction ? 1 : 2}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

export function Notice({
  text,
  action,
  onAction,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.notice}>
      <Text style={[styles.noticeText, styles.noticeTextFlex]}>{text}</Text>
      {action ? (
        <Pressable style={styles.noticeBtn} onPress={onAction}>
          <Text style={styles.noticeBtnText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <AmazingSurface style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </AmazingSurface>
  );
}

export function ListRowIcon({ icon }: { icon: AppIconName }) {
  return (
    <View style={styles.listIco}>
      <AppIcon name={icon} size={16} color="#b87000" />
    </View>
  );
}

/** Fixed footprint so Follow / Following stay the same size when toggled. */
export const followPillStyle: ViewStyle = {
  minWidth: 92,
  paddingVertical: 10,
  paddingHorizontal: 14,
};

export function PillButton({
  label,
  icon,
  onPress,
  variant = 'default',
  style,
  full,
  flex,
}: {
  label: string;
  icon?: AppIconName;
  onPress?: () => void;
  variant?: 'default' | 'light' | 'brand' | 'teal' | 'warn' | 'purchase';
  style?: ViewStyle;
  full?: boolean;
  flex?: boolean;
}) {
  const layoutStyle = flex ? styles.pillbtnFlex : undefined;
  const variantStyle =
    variant === 'brand'
      ? styles.pillbtnBrand
      : variant === 'light'
        ? styles.pillbtnLight
        : variant === 'teal'
          ? styles.pillbtnTeal
          : variant === 'warn'
            ? styles.pillbtnWarn
            : variant === 'purchase'
              ? styles.pillbtnPurchase
              : styles.pillbtnDefault;
  const textStyle =
    variant === 'purchase'
      ? styles.pillbtnPurchaseText
      : variant === 'brand' || variant === 'teal'
        ? styles.pillbtnBrandText
        : variant === 'light'
          ? styles.pillbtnLightText
          : variant === 'warn'
            ? styles.pillbtnWarnText
            : styles.pillbtnDefaultText;
  const iconColor =
    variant === 'teal' ? colors.paper : variant === 'warn' ? colors.text : colors.text;

  return (
    <Pressable
      style={[
        styles.pillbtn,
        variantStyle,
        icon && styles.pillbtnWithIcon,
        layoutStyle,
        full && { width: '100%' },
        style,
      ]}
      onPress={onPress}
    >
      {icon ? <AppIcon name={icon} size={18} color={iconColor} /> : null}
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bottomRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.paper,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    gap: 2,
  },
  navItemPublish: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 2,
    gap: 2,
  },
  navLabel: {
    fontSize: typography.nav,
    fontWeight: fonts.weights.medium,
    color: colors.text,
    textAlign: 'center',
  },
  navLabelActive: {
    color: colors.brand2,
    fontWeight: fonts.weights.bold,
  },
  publishCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    borderWidth: 4,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    paddingHorizontal: 3,
    marginTop: -22,
    marginBottom: 2,
  },
  publishCircleIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishCircleLabel: {
    fontSize: typography.nav,
    fontWeight: fonts.weights.bold,
    color: colors.phoneBorder,
    textAlign: 'center',
    zIndex: 1,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.screenBottomNav + 8,
    backgroundColor: '#333333',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    zIndex: 100,
  },
  toastText: {
    color: '#ffffff',
    fontSize: typography.bodySm,
    fontWeight: fonts.weights.medium,
  },
  logoWrap: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  logoFallback: {
    fontWeight: fonts.weights.bold,
    letterSpacing: -1,
    color: colors.text,
  },
  iconbtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.paper,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  iconbtnActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  iconbtnText: {
    fontSize: typography.section,
    color: colors.text,
  },
  iconbtnTextActive: {
    color: '#ffffff',
  },
  dot: {
    position: 'absolute',
    right: 4,
    top: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  titlebar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 10,
    minHeight: 34,
    position: 'relative',
  },
  titlebarH1: {
    fontSize: typography.title,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  titlebarCenter: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -50 }],
    fontSize: typography.section,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  search: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 4,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
  },
  searchInputText: {
    fontSize: typography.body,
    color: colors.text,
  },
  searchInputField: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.body,
    color: colors.text,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  searchPlaceholder: {
    color: colors.searchHint,
    fontSize: typography.bodySm,
    lineHeight: 16,
  },
  searchBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.phoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
    marginHorizontal: 0,
    gap: 8,
  },
  sectionHeadStacked: {
    alignItems: 'flex-start',
  },
  sectionHeadMain: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: typography.section,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: typography.meta,
    lineHeight: 15,
    color: colors.muted,
    fontWeight: fonts.weights.medium,
  },
  sectionActionWrap: {
    flexShrink: 0,
    maxWidth: '46%',
  },
  sectionAction: {
    fontSize: typography.meta,
    color: colors.muted,
    fontWeight: fonts.weights.medium,
    textAlign: 'right',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFF0F0',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: typography.badge,
    fontWeight: fonts.weights.medium,
    color: colors.red,
  },
  noticeTextFlex: {
    flex: 1,
    minWidth: 0,
  },
  notice: {
    backgroundColor: colors.brand3,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noticeText: {
    color: colors.text,
    fontSize: typography.bodySm,
    fontWeight: fonts.weights.medium,
    lineHeight: 16,
  },
  noticeBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noticeBtnText: {
    fontWeight: fonts.weights.bold,
    fontSize: typography.bodySm,
    color: colors.text,
  },
  emptyState: {
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    color: colors.sub,
    fontSize: typography.body,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
  listIco: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.brand3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillbtn: {
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  pillbtnDefault: {
    backgroundColor: colors.bg,
  },
  pillbtnDefaultText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: typography.bodySm,
  },
  pillbtnFlex: {
    flex: 1,
  },
  pillbtnWithIcon: {
    flexDirection: 'row',
    gap: 6,
  },
  pillbtnLight: {
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pillbtnLightText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: typography.bodySm,
  },
  pillbtnBrand: {
    backgroundColor: colors.brand,
    borderWidth: 0,
  },
  pillbtnBrandText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: typography.body,
  },
  pillbtnPurchase: {
    backgroundColor: colors.red,
    borderWidth: 0,
  },
  pillbtnPurchaseText: {
    fontWeight: fonts.weights.bold,
    color: '#FFFFFF',
    fontSize: typography.bodySm,
  },
  pillbtnTeal: {
    backgroundColor: colors.green,
  },
  pillbtnWarn: {
    backgroundColor: colors.brand3,
  },
  pillbtnWarnText: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
});
