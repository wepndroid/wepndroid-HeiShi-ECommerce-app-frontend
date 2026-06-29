import React, { RefObject, useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
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
import { colors, fonts, formControls, iconTokens, emptyStateTokens, loadingStateTokens, badgeTokens, radius, searchBarSurface, searchBarTokens, spacing, typography, detailPageTokens, homeScreenTokens, profileScreenTokens, sectionHeadTokens, navBarShadow } from '../theme';
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
                  <AppIcon name={item.icon} size={18} color={colors.phoneBorder} />
                </View>
                <Text style={styles.publishCircleLabel} numberOfLines={1}>
                  {t(item.labelKey)}
                </Text>
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={item.id}
            style={styles.navItem}
            onPress={() =>
              item.id === 'messages' || item.id === 'profile' || item.id === 'category'
                ? requireAuthNav(item.id)
                : nav(item.id)
            }
          >
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
      removeClippedSubviews={false}
    >
      {children}
    </ScrollView>
  );
}

export function Logo({
  width = homeScreenTokens.logoWidth,
  size,
}: {
  /** Logo width in px (default header size). */
  width?: number;
  /** Optional fixed height (e.g. login/about); width derived from aspect ratio. */
  size?: number;
}) {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const logoHeight = size ?? width / LOGO_ASPECT;
  const logoWidth = size != null ? size * LOGO_ASPECT : width;

  return (
    <View style={styles.logoWrap}>
      <Image
        source={isZh ? LOGO_ZH : LOGO_EN}
        style={{ width: logoWidth, height: logoHeight }}
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
  badgeCount,
  active,
}: {
  icon?: AppIconName;
  label?: string;
  onPress?: () => void;
  dot?: boolean;
  badgeCount?: number;
  active?: boolean;
}) {
  const showBadge = badgeCount != null && badgeCount > 0;
  const badgeLabel =
    badgeCount != null && badgeCount > 99 ? '99+' : String(badgeCount ?? '');

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
      {showBadge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText} numberOfLines={1}>
            {badgeLabel}
          </Text>
        </View>
      ) : dot ? (
        <View style={styles.dot} />
      ) : null}
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
  compact,
}: {
  title?: string;
  center?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Smaller centered title (e.g. publish hub). */
  compact?: boolean;
}) {
  if (center != null) {
    return (
      <View style={styles.titlebar}>
        <View style={styles.titlebarSlot}>{left ?? <View style={styles.titlebarSlotSpacer} />}</View>
        <View style={styles.titlebarCenterWrap}>
          {typeof center === 'string' ? (
            <Text
              style={[styles.titlebarCenter, compact && styles.titlebarCenterCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {center}
            </Text>
          ) : (
            center
          )}
        </View>
        <View style={[styles.titlebarSlot, styles.titlebarSlotRight]}>
          {right ?? <View style={styles.titlebarSlotSpacer} />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.titlebar}>
      {left ?? (title ? <Text style={styles.titlebarH1}>{title}</Text> : <BackButton />)}
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
  compact,
  plain,
  connectTop,
}: {
  title: string;
  action?: string;
  subtitle?: string;
  onAction?: () => void;
  compact?: boolean;
  /** Smaller, regular-weight title (e.g. profile section labels). */
  plain?: boolean;
  /** Omit top margin when spacing is provided by the block above. */
  connectTop?: boolean;
}) {
  return (
    <View
      style={[
        styles.sectionHead,
        subtitle && styles.sectionHeadStacked,
        connectTop && styles.sectionHeadConnectTop,
      ]}
    >
      <View style={styles.sectionHeadMain}>
        <Text
          style={[
            styles.sectionTitle,
            compact && styles.sectionTitleCompact,
            plain && styles.sectionTitlePlain,
          ]}
          numberOfLines={subtitle ? undefined : 1}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} style={styles.sectionActionWrap} disabled={!onAction}>
          <Text
            style={[styles.sectionAction, compact && styles.sectionActionCompact]}
            numberOfLines={onAction ? 1 : 2}
          >
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({
  text,
  compact,
  fontSize,
}: {
  text: string;
  compact?: boolean;
  fontSize?: number;
}) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text
        style={[
          styles.badgeText,
          compact && styles.badgeTextCompact,
          fontSize != null && { fontSize },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function Notice({
  text,
  action,
  onAction,
  whiteAction,
  onPress,
  chevron,
  flush,
  dismissible,
  onDismiss,
  dismissHint,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
  /** White pill for action (e.g. messages enable). Default: brand yellow. */
  whiteAction?: boolean;
  onPress?: () => void;
  /** Trailing chevron (v7 chat-safe banner). */
  chevron?: boolean;
  /** Remove default bottom margin (stacked layouts). */
  flush?: boolean;
  /** Swipe left or right to dismiss (mobile). */
  dismissible?: boolean;
  onDismiss?: () => void;
  dismissHint?: string;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  const panResponder = React.useMemo(() => {
    if (!dismissible || !onDismiss) return null;
    const isHorizontalSwipe = (dx: number, dy: number) =>
      Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy) * 1.05;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        isHorizontalSwipe(gesture.dx, gesture.dy),
      onMoveShouldSetPanResponder: (_event, gesture) =>
        isHorizontalSwipe(gesture.dx, gesture.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_event, gesture) => {
        translateX.setValue(gesture.dx);
        opacity.setValue(1 - Math.min(Math.abs(gesture.dx) / 180, 0.5));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (Math.abs(gesture.dx) > 8 || Math.abs(gesture.vx) > 0.08) {
          const offScreen = gesture.dx >= 0 ? 420 : -420;
          Animated.parallel([
            Animated.timing(translateX, { toValue: offScreen, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          ]).start(() => {
            translateX.setValue(0);
            opacity.setValue(1);
            onDismiss();
          });
          return;
        }
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
          Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
          Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      },
    });
  }, [dismissible, onDismiss, opacity, translateX]);

  const body = (
    <View style={[styles.notice, (flush || dismissible) && styles.noticeFlush]}>
      <Text style={[styles.noticeText, styles.noticeTextFlex]} numberOfLines={3}>
        {text}
      </Text>
      {action ? (
        <Pressable style={[styles.noticeBtn, whiteAction && styles.noticeBtnWhite]} onPress={onAction}>
          <Text style={[styles.noticeBtnText, whiteAction && styles.noticeBtnTextRegular]}>{action}</Text>
        </Pressable>
      ) : null}
      {chevron ? <Text style={styles.noticeChevron}>›</Text> : null}
    </View>
  );
  let content: React.ReactNode = body;
  if (onPress) {
    content = (
      <Pressable onPress={onPress} accessibilityRole="button">
        {body}
      </Pressable>
    );
  }
  if (dismissible && onDismiss && panResponder) {
    return (
      <Animated.View
        style={[styles.noticeDismissWrap, { transform: [{ translateX }], opacity }]}
        accessibilityHint={dismissHint}
        {...panResponder.panHandlers}
      >
        {content}
      </Animated.View>
    );
  }
  return content;
}

export type DismissibleModalPlacement = 'bottom' | 'center' | 'fill';

/** Modal with a tappable backdrop — closes when the user presses outside `children`. */
export function DismissibleModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
  placement = 'bottom',
  contentStyle,
  statusBarTranslucent,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  placement?: DismissibleModalPlacement;
  contentStyle?: ViewStyle;
  statusBarTranslucent?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const blockBackdropCloseRef = useRef(false);
  const resolvedStatusBarTranslucent = statusBarTranslucent ?? placement === 'bottom';
  // Transparent Android modals with animationType="slide" often size to content height,
  // leaving a gap above the system nav bar — use none/fade at the Modal layer instead.
  const resolvedAnimationType =
    placement === 'bottom' && animationType === 'slide' ? 'none' : animationType;

  useEffect(() => {
    if (!visible) return;
    blockBackdropCloseRef.current = true;
    const timer = setTimeout(() => {
      blockBackdropCloseRef.current = false;
    }, 320);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleBackdropPress = () => {
    if (blockBackdropCloseRef.current) return;
    onClose();
  };

  if (placement === 'fill') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType={animationType}
        onRequestClose={onClose}
        statusBarTranslucent={statusBarTranslucent}
      >
        <View style={styles.dismissModalFillRoot} pointerEvents="box-none">
          <Pressable
            style={styles.dismissModalFillBackdrop}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel={t('common.closeModal')}
          />
          <View style={[styles.dismissModalFillContent, contentStyle]} pointerEvents="box-none">
            {children}
          </View>
        </View>
      </Modal>
    );
  }

  if (placement === 'bottom') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType={resolvedAnimationType}
        onRequestClose={onClose}
        statusBarTranslucent={resolvedStatusBarTranslucent}
      >
        <Pressable
          style={styles.dismissModalBottomBackdrop}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel={t('common.closeModal')}
        >
          <Pressable style={[styles.dismissModalCardStop, contentStyle]} onPress={() => undefined}>
            <View
              style={[
                styles.dismissModalBottomSheetSurface,
                { paddingBottom: insets.bottom },
              ]}
            >
              {children}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <Pressable
        style={[styles.dismissModalBackdropPress, styles.dismissModalBackdropCenter]}
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.closeModal')}
      >
        <Pressable style={[styles.dismissModalCardStop, contentStyle]} onPress={() => undefined}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <AmazingSurface style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </AmazingSurface>
  );
}

/** Inline no-results hint (search, filters) — centered muted copy. */
export function EmptyHint({ text }: { text: string }) {
  return <Text style={styles.emptyHint}>{text}</Text>;
}

/** Standard loading row — spinner + optional label. */
export function LoadingState({
  text,
  compact,
  spinnerColor = loadingStateTokens.spinnerColor,
}: {
  text?: string;
  compact?: boolean;
  spinnerColor?: string;
}) {
  const { t } = useTranslation();
  const label = text ?? t('common.loading');
  return (
    <View style={[styles.loadingState, compact && styles.loadingStateCompact]}>
      <ActivityIndicator color={spinnerColor} />
      <Text style={styles.loadingStateText}>{label}</Text>
    </View>
  );
}

export function ListRowIcon({ icon }: { icon: AppIconName }) {
  return (
    <View style={styles.listIco}>
      <AppIcon name={icon} size={iconTokens.sizes.sm} color={iconTokens.accent} />
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
  disabled,
}: {
  label: string;
  icon?: AppIconName;
  onPress?: () => void;
  variant?: 'default' | 'light' | 'brand' | 'teal' | 'warn' | 'purchase';
  style?: ViewStyle;
  full?: boolean;
  flex?: boolean;
  disabled?: boolean;
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
      disabled={disabled}
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
    ...navBarShadow,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    paddingHorizontal: 3,
    marginTop: -18,
    marginBottom: 2,
  },
  publishCircleIconWrap: {
    ...StyleSheet.absoluteFill,
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
  iconBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  iconBadgeText: {
    fontSize: 10,
    fontWeight: fonts.weights.bold,
    color: '#FFFFFF',
    lineHeight: 12,
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
    fontSize: typography.section,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  titlebarCenterWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  titlebarSlot: {
    width: 38,
    minWidth: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titlebarSlotRight: {
    alignItems: 'flex-end',
  },
  titlebarSlotSpacer: {
    width: 34,
    height: 34,
  },
  titlebarCenterCompact: {
    fontSize: sectionHeadTokens.feedTitleSize,
  },
  search: {
    height: searchBarTokens.height,
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
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
    color: colors.text,
  },
  searchInputText: {
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
    color: colors.text,
  },
  searchInputField: {
    flex: 1,
    minWidth: 0,
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
    color: colors.text,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  searchPlaceholder: {
    color: colors.searchHint,
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
  },
  searchBtn: {
    width: searchBarTokens.btnSize,
    height: searchBarTokens.btnSize,
    borderRadius: searchBarTokens.btnSize / 2,
    backgroundColor: colors.phoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: sectionHeadTokens.marginTop,
    marginBottom: sectionHeadTokens.marginBottom,
    marginHorizontal: 0,
    gap: 8,
  },
  sectionHeadConnectTop: {
    marginTop: 0,
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
  sectionTitleCompact: {
    fontSize: sectionHeadTokens.feedTitleSize,
  },
  sectionTitlePlain: {
    fontSize: profileScreenTokens.sectionTitleSize,
    fontWeight: '400',
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
  sectionActionCompact: {
    fontSize: sectionHeadTokens.feedActionSize,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: badgeTokens.radius,
    paddingHorizontal: badgeTokens.paddingH,
    paddingVertical: badgeTokens.paddingV,
    backgroundColor: badgeTokens.fill,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: badgeTokens.fontSize,
    fontWeight: fonts.weights.medium,
    color: badgeTokens.text,
  },
  badgeCompact: {
    paddingHorizontal: 3,
    paddingVertical: 0,
  },
  badgeTextCompact: {
    fontSize: typography.nav,
  },
  noticeTextFlex: {
    flex: 1,
    minWidth: 0,
  },
  noticeDismissWrap: {
    marginBottom: 8,
  },
  notice: {
    backgroundColor: colors.trustSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.trustBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noticeFlush: {
    marginBottom: 0,
  },
  noticeText: {
    color: colors.trustText,
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
  noticeBtnWhite: {
    backgroundColor: colors.paper,
  },
  noticeBtnText: {
    fontWeight: fonts.weights.bold,
    fontSize: typography.bodySm,
    color: colors.text,
  },
  noticeBtnTextRegular: {
    fontWeight: '400',
  },
  noticeChevron: {
    flexShrink: 0,
    fontSize: 16,
    lineHeight: 16,
    color: colors.trustText,
    fontWeight: fonts.weights.bold,
    paddingLeft: 4,
  },
  dismissModalBackdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dismissModalBackdropBottom: {
    justifyContent: 'flex-end',
  },
  dismissModalBackdropCenter: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dismissModalBottomBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dismissModalBottomSheetSurface: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    overflow: 'hidden',
  },
  dismissModalCardStop: {
    width: '100%',
  },
  dismissModalFillRoot: {
    flex: 1,
  },
  dismissModalFillBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dismissModalFillContent: {
    flex: 1,
  },
  emptyState: {
    borderStyle: 'dashed',
    borderColor: emptyStateTokens.borderColor,
    borderRadius: emptyStateTokens.radius,
    paddingHorizontal: emptyStateTokens.paddingH,
    paddingVertical: emptyStateTokens.paddingV,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    color: emptyStateTokens.textColor,
    fontSize: emptyStateTokens.fontSize,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
  emptyHint: {
    marginBottom: 12,
    fontSize: emptyStateTokens.hintFontSize,
    color: emptyStateTokens.hintColor,
    textAlign: 'center',
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: loadingStateTokens.gap,
    paddingVertical: loadingStateTokens.paddingV,
  },
  loadingStateCompact: {
    paddingVertical: 12,
  },
  loadingStateText: {
    fontSize: loadingStateTokens.fontSize,
    color: loadingStateTokens.textColor,
  },
  listIco: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
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
