import React, { RefObject } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text, TextInput } from './typography';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { NO_NAV_SCREENS } from '../data/productsNav';
import { AmazingSurface } from './AmazingSurface';
import { MarqueePlaceholder } from './MarqueeText';
import { colors, fonts, radius, spacing } from '../theme';
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

export function BottomNav({ blurTarget }: { blurTarget?: RefObject<View | null> }) {
  const { nav, requireAuthNav, activeTab } = useApp();
  const { t } = useTranslation();

  return (
    <View style={styles.bottomWrap}>
      <BlurView
        style={styles.bottomBlur}
        intensity={Platform.OS === 'web' ? 48 : 72}
        tint="light"
        blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
        blurReductionFactor={4}
      >
        <View style={styles.bottomGlassSheen} pointerEvents="none" />
      </BlurView>
      <View style={styles.bottomRow}>
        {TAB_ITEMS.map((item) => {
        const active = activeTab === item.id;
        if (item.publish) {
          return (
            <Pressable key={item.id} style={styles.navItem} onPress={() => requireAuthNav(item.id)}>
              <LinearGradient
                colors={[colors.brand, colors.brand2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishCircle}
              >
                <AppIcon name={item.icon} size={28} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        }
        return (
          <Pressable key={item.id} style={styles.navItem} onPress={() => nav(item.id)}>
            <AppIcon name={item.icon} size={22} color={active ? colors.text : '#555555'} />
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
}: {
  screenId: ScreenId;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const noNav = NO_NAV_SCREENS.has(screenId);
  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={{
        padding: spacing.screenPadding,
        paddingBottom: noNav ? spacing.screenBottomNoNav : spacing.screenBottomNav,
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
}: {
  icon?: AppIconName;
  label?: string;
  onPress?: () => void;
  dot?: boolean;
}) {
  return (
    <Pressable
      style={styles.iconbtn}
      onPress={onPress}
      accessibilityLabel={label}
    >
      {icon ? (
        <AppIcon name={icon} size={18} color={colors.text} />
      ) : (
        <Text style={styles.iconbtnText}>{label}</Text>
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
  const btnLabel = buttonLabel ?? t('common.search');

  const inner = (
    <AmazingSurface style={styles.search}>
      <AppIcon name="search" size={16} color="#777777" />
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
            placeholderTextColor="#999999"
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
          <AppIcon name="camera" size={18} color="#888888" />
        </Pressable>
      ) : null}
      <Pressable style={styles.searchBtn} onPress={onSubmit}>
        <Text style={styles.searchBtnText}>{btnLabel}</Text>
      </Pressable>
    </AmazingSurface>
  );

  if (readonly || onPress) {
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

export function PillButton({
  label,
  onPress,
  variant = 'default',
  style,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'light' | 'brand' | 'teal' | 'warn';
  style?: ViewStyle;
  full?: boolean;
}) {
  if (variant === 'brand') {
    return (
      <Pressable style={[full && { width: '100%' }, style]} onPress={onPress}>
        <LinearGradient
          colors={[colors.brand, colors.brand2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.pillbtn, styles.pillbtnBrand, full && { width: '100%' }]}
        >
          <Text style={styles.pillbtnBrandText} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }
  const variantStyle =
    variant === 'light'
      ? styles.pillbtnLight
      : variant === 'teal'
        ? styles.pillbtnTeal
        : variant === 'warn'
          ? styles.pillbtnWarn
          : styles.pillbtnDefault;
  const textStyle =
    variant === 'light'
      ? styles.pillbtnLightText
      : variant === 'teal'
        ? styles.pillbtnBrandText
        : variant === 'warn'
          ? styles.pillbtnWarnText
          : styles.pillbtnDefaultText;
  return (
    <Pressable
      style={[styles.pillbtn, variantStyle, full && { width: '100%' }, style]}
      onPress={onPress}
    >
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
    height: spacing.bottomNavHeight,
    zIndex: 10,
  },
  bottomBlur: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
  },
  bottomRow: {
    flex: 1,
    flexDirection: 'row',
  },
  bottomGlassSheen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 7,
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: fonts.weights.medium,
    color: '#555555',
    textAlign: 'center',
  },
  navLabelActive: {
    color: colors.text,
  },
  publishCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    marginBottom: 2,
    shadowColor: colors.brand2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 11,
    elevation: 8,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 92,
    backgroundColor: '#111111',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    zIndex: 100,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: fonts.weights.bold,
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
    width: 36,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  iconbtnText: {
    fontSize: 17,
    color: colors.text,
  },
  dot: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand2,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  titlebar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 14,
    minHeight: 38,
    position: 'relative',
  },
  titlebarH1: {
    fontSize: 22,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  titlebarCenter: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -50 }],
    fontSize: 20,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  search: {
    height: 42,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 13,
    paddingRight: 6,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  searchInputText: {
    fontSize: 14,
    color: colors.text,
  },
  searchInputField: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  searchPlaceholder: {
    color: '#999999',
  },
  searchBtn: {
    height: 30,
    minWidth: 54,
    borderRadius: radius.pill,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
    fontSize: 13,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
    marginHorizontal: 2,
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
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#999999',
    fontWeight: fonts.weights.medium,
  },
  sectionActionWrap: {
    flexShrink: 0,
    maxWidth: '46%',
  },
  sectionAction: {
    fontSize: 11,
    color: '#999999',
    fontWeight: fonts.weights.medium,
    textAlign: 'right',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#fff1d6',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: fonts.weights.bold,
    color: '#b65d00',
  },
  noticeTextFlex: {
    flex: 1,
    minWidth: 0,
  },
  notice: {
    backgroundColor: '#fff3ce',
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  noticeText: {
    color: '#7e5700',
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    lineHeight: 17,
  },
  noticeBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  noticeBtnText: {
    fontWeight: fonts.weights.bold,
    fontSize: 12,
    color: colors.text,
  },
  emptyState: {
    borderStyle: 'dashed',
    borderColor: '#e6dfc8',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyStateText: {
    color: '#8a7a54',
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    textAlign: 'center',
  },
  listIco: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#fff0c2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillbtn: {
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  pillbtnDefault: {
    backgroundColor: '#f4f4f4',
  },
  pillbtnDefaultText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 12,
  },
  pillbtnLight: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  pillbtnLightText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 12,
  },
  pillbtnBrand: {
    flex: 1.1,
  },
  pillbtnBrandText: {
    fontWeight: fonts.weights.bold,
    color: '#ffffff',
    fontSize: 12,
  },
  pillbtnTeal: {
    backgroundColor: colors.green,
  },
  pillbtnWarn: {
    backgroundColor: '#fff0d3',
  },
  pillbtnWarnText: {
    color: '#b25100',
    fontWeight: fonts.weights.bold,
  },
});
