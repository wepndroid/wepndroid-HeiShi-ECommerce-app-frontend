import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from './typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { getDemoListingI18nKeys, shouldUseDemoI18n } from '../data/catalogDemo';
import { formatLocationLabel } from '../data/region';
import i18n from '../i18n';
import { Product } from '../types';
import type { LocalService } from '../data/services';
import { useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { splitProductMasonryColumns } from '../utils/masonryColumns';
import { useFavoritesStore } from '../store/favoritesStore';
import { colors, fonts, productCardTokens, profileScreenTokens, radius, serviceCardTokens, shadows, PRODUCT_CARD_RADIUS } from '../theme';
import { homePromoBannerForLanguage } from '../assets/homeBanner';
import { bannerArtworkAspectRatio } from '../assets/bannerAspect';
import { AppIcon, AppIconName } from './AppIcon';
import { AmazingSurface } from './AmazingSurface';
import { Badge, EmptyState } from './UI';
import { SellerAvatar } from './SellerAvatar';
import { resolveProductImages } from '../utils/productImages';
import { getProductCardImageSize } from '../utils/productCardLayout';
import { normalizeMediaUrl } from '../utils/mediaUrls';


export function ProductCard({
  product,
  onPress,
}: {
  product: ReturnType<typeof useLocalizedProducts>[number];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const imageSize = useMemo(() => getProductCardImageSize(screenWidth), [screenWidth]);
  const favs = useFavoritesStore((s) => s.favs);
  const toggleFavoriteById = useFavoritesStore((s) => s.toggleFavoriteById);
  const isFav = favs.has(product.id);
  const coverImage = resolveProductImages(product)[0];

  return (
    <AmazingSurface style={styles.card} highlight={false} preserveShadow>
      <View
        style={[styles.picFrame, { height: imageSize.height }]}
        collapsable={false}
        renderToHardwareTextureAndroid
      >
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={{ width: imageSize.width, height: imageSize.height }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            style={[
              styles.picPlaceholder,
              { width: imageSize.width, height: imageSize.height },
            ]}
          />
        )}
        <View style={styles.picOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.picPress}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={product.title}
          />
          <Pressable
            style={[styles.heart, isFav && styles.heartActive]}
            onPress={() => void toggleFavoriteById(product.id)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isFav ? t('common.a11y.unfavorite') : t('common.a11y.favorite')}
          >
            <AppIcon
              name={isFav ? 'heart' : 'heartOutline'}
              size={14}
              color={isFav ? '#ffffff' : colors.text}
            />
          </Pressable>
          <View style={styles.loc} pointerEvents="none">
            <Text style={styles.locText}>{product.loc}</Text>
          </View>
        </View>
      </View>
      <Pressable style={styles.cardB} onPress={onPress}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>
          {product.pricePrefix}
          {product.price}
        </Text>
        {(product.favoriteCount ?? 0) > 0 ? (
          <Text style={styles.wantCount}>
            {t('home.wantCount', { count: product.favoriteCount ?? 0 })}
          </Text>
        ) : null}
        <View style={styles.tagRow}>
          <Badge text={product.tag} compact fontSize={productCardTokens.tagSize} />
        </View>
        <View style={styles.trustRow}>
          {product.sellerPhoneVerified ? (
            <Badge text={t('home.trustPhone')} compact fontSize={productCardTokens.tagSize} />
          ) : null}
          {product.sellerIdentityVerified ? (
            <Badge text={t('home.trustIdentity')} compact fontSize={productCardTokens.tagSize} />
          ) : null}
          {(product.sellerCompletedOrders ?? 0) > 0 ? (
            <Badge
              text={t('home.trustTrades', { count: product.sellerCompletedOrders ?? 0 })}
              compact
              fontSize={productCardTokens.tagSize}
            />
          ) : null}
          {(product.sellerPositiveRatingRate ?? 0) > 0 ? (
            <Badge
              text={t('home.trustRating', { rate: product.sellerPositiveRatingRate ?? 0 })}
              compact
              fontSize={productCardTokens.tagSize}
            />
          ) : null}
        </View>
        <View style={styles.meta}>
          <SellerAvatar
            sellerKey={product.sellerKey}
            seller={product.seller}
            avatarUrl={product.sellerAvatarUrl}
            sellerUserId={product.sellerUserId}
            listingId={product.id}
            size={18}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {product.seller}
          </Text>
        </View>
      </Pressable>
    </AmazingSurface>
  );
}

function ProductMasonry({
  products,
  onPress,
}: {
  products: ReturnType<typeof useLocalizedProducts>;
  onPress: (p: Product) => void;
}) {
  const { left, right } = useMemo(
    () => splitProductMasonryColumns(products),
    [products],
  );

  return (
    <View style={styles.feed}>
      <View style={styles.feedCol}>
        {left.map((p) => (
          <ProductCard key={p.id} product={p} onPress={() => onPress(p)} />
        ))}
      </View>
      <View style={styles.feedCol}>
        {right.map((p) => (
          <ProductCard key={p.id} product={p} onPress={() => onPress(p)} />
        ))}
      </View>
    </View>
  );
}

export function ProductFeed({
  data,
  onPress,
  emptyText,
}: {
  data: Product[];
  onPress: (p: Product) => void;
  emptyText?: string;
}) {
  const localized = useLocalizedProducts(data);
  if (!localized.length && emptyText) {
    return <EmptyState text={emptyText} />;
  }

  return <ProductMasonry products={localized} onPress={onPress} />;
}

export function ProductGrid({
  data,
  onPress,
  emptyText,
}: {
  data: Product[];
  onPress: (p: Product) => void;
  emptyText?: string;
}) {
  const localized = useLocalizedProducts(data);
  if (!localized.length) {
    return emptyText ? <EmptyState text={emptyText} /> : null;
  }

  return <ProductMasonry products={localized} onPress={onPress} />;
}

export function ServiceCard({
  service,
  onPress,
}: {
  service: LocalService;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const iconMap: Record<LocalService['icon'], AppIconName> = {
    truck: 'truck',
    broom: 'broom',
    cameraService: 'cameraService',
  };

  const demoKeys = shouldUseDemoI18n(i18n.language, service.id) ? getDemoListingI18nKeys(service.id) : null;
  const servicePhoto = normalizeMediaUrl(service.imageUrl);

  return (
    <AmazingSurface style={styles.serviceCard} onPress={onPress}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceImg}>
          {servicePhoto ? (
            <Image
              source={{ uri: servicePhoto }}
              style={styles.servicePhoto}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <AppIcon name={iconMap[service.icon]} size={22} color="#b87000" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>
            {demoKeys ? t(demoKeys.titleKey) : service.apiTitle ?? (service.titleKey ? t(service.titleKey) : '')}
          </Text>
          <Text style={styles.serviceDesc}>
            {demoKeys ? t(demoKeys.descKey) : service.apiDesc ?? (service.descKey ? t(service.descKey) : '')}
          </Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceArea}>{formatLocationLabel(service.area)}</Text>
            <Badge
              text={service.apiPriceLabel ?? (service.priceKey ? t(service.priceKey) : '')}
              compact
              fontSize={serviceCardTokens.tagSize}
            />
          </View>
        </View>
      </View>
    </AmazingSurface>
  );
}

const PROMO_GRADIENT = ['#FFF59D', '#FFE60F', '#FFB415'] as const;

function splitBannerHighlights(subtitle: string): string[] {
  return subtitle
    .split(/\s*[·•/|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function BannerSunburst() {
  return (
    <View style={styles.bannerSunburst} pointerEvents="none">
      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.bannerSunRay,
            { transform: [{ rotate: `${-78 + i * 7}deg` }] },
          ]}
        />
      ))}
      <View style={styles.bannerGlowOrb} />
    </View>
  );
}

function BannerHighlights({ items }: { items: string[] }) {
  return (
    <View style={styles.bannerChips}>
      {items.map((item) => (
        <View key={item} style={styles.bannerChip}>
          <Text style={styles.bannerChipText} numberOfLines={1}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Banner({
  title,
  subtitle,
  icon = 'shoppingBags',
  variant = 'trust',
  artwork = false,
  artworkSource,
  artworkRemoteUri,
  flushVertical,
  badge,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  icon?: AppIconName;
  /** trust = platform assurance card (v7); local = category page strip; promo = legacy gradient/artwork */
  variant?: 'standard' | 'promo' | 'trust' | 'local';
  artwork?: boolean;
  /** Custom full-width banner image; defaults to home promo artwork. */
  artworkSource?: number;
  /** Remote CMS banner image URL (overrides local artwork when set). */
  artworkRemoteUri?: string;
  /** Remove default vertical margins (parent controls spacing). */
  flushVertical?: boolean;
  /** Right-side pill on local variant (e.g. 保障). */
  badge?: string;
  /** Overlay CTA on artwork banners (e.g. profile 查看). */
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { i18n } = useTranslation();
  const highlights = splitBannerHighlights(subtitle);

  if (variant === 'local') {
    return (
      <AmazingSurface
        style={[styles.bannerLocal, flushVertical && styles.bannerLocalFlush]}
        highlight={false}
        preserveShadow
      >
        <View style={styles.bannerLocalRow}>
          <View style={styles.bannerLocalAccent} />
          <View style={styles.bannerLocalBody}>
            <Text style={styles.bannerLocalTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.bannerLocalSub} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          {badge ? (
            <View style={styles.bannerLocalBadge}>
              <Text style={styles.bannerLocalBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </AmazingSurface>
    );
  }

  if (variant === 'trust') {
    return (
      <AmazingSurface
        style={[styles.bannerTrust, flushVertical && styles.bannerTrustFlush]}
        highlight={false}
        preserveShadow
      >
        <View style={styles.bannerTrustRow}>
          <View style={styles.bannerTrustAccent} />
          <View style={styles.bannerTrustBody}>
            <Text style={styles.bannerTrustTitle} numberOfLines={2}>
              {title}
            </Text>
            {highlights.length ? (
              <View style={styles.bannerTrustChips}>
                {highlights.map((item) => (
                  <View key={item} style={styles.bannerTrustChip}>
                    <AppIcon name="check" size={11} color={colors.green} />
                    <Text style={styles.bannerTrustChipText} numberOfLines={1}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.bannerTrustSub} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </AmazingSurface>
    );
  }

  if (variant === 'promo' && artwork) {
    const bannerSource = artworkRemoteUri
      ? { uri: artworkRemoteUri }
      : (artworkSource ?? homePromoBannerForLanguage(i18n.language));
    const aspectRatio = artworkRemoteUri ? 2.4 : bannerArtworkAspectRatio(bannerSource as number);
    const actionHalfHeight = profileScreenTokens.bannerActionHeight / 2;
    return (
      <View
        style={[
          styles.bannerArtworkWrap,
          { aspectRatio },
          flushVertical && styles.bannerArtworkWrapFlush,
        ]}
      >
        <Image
          source={bannerSource}
          style={styles.bannerArtwork}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={title}
        />
        {actionLabel && onAction ? (
          <Pressable
            style={[
              styles.bannerArtworkAction,
              { transform: [{ translateY: -actionHalfHeight }] },
            ]}
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.bannerArtworkActionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const isPromo = variant === 'promo';

  return (
    <LinearGradient
      colors={[...PROMO_GRADIENT]}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.85 }}
      style={[styles.banner, isPromo && styles.bannerPromo, isPromo && styles.bannerPromoOverflow]}
    >
      <View style={styles.bannerSunburstClip}>
        <BannerSunburst />
      </View>

      <View style={[styles.bannerRow, isPromo && styles.bannerRowPromo]}>
        <View style={styles.bannerText}>
          <Text
            style={[styles.bannerTitle, isPromo && styles.bannerTitlePromo]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <BannerHighlights items={highlights} />
        </View>

        <View style={styles.mascot}>
          <AppIcon name={icon} size={isPromo ? 32 : 36} color="#FF8C00" />
        </View>
      </View>

      {isPromo ? (
        <View style={styles.bannerBadge} pointerEvents="none">
          <View style={styles.bannerBadgeBubble}>
            <AppIcon name="heart" size={12} color={colors.red} />
          </View>
          <View style={styles.bannerBadgeBody}>
            <AppIcon name="shield" size={22} color="#FFFFFF" />
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

export function OrderThumb({ imageUrl, size = 70 }: { imageUrl: string; size?: number }) {
  const uri = normalizeMediaUrl(imageUrl) ?? imageUrl;
  return (
    <View style={[styles.orderImg, { width: size, height: size }]}>
      <Image source={{ uri }} style={styles.orderImgPhoto} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  feedCol: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    borderRadius: PRODUCT_CARD_RADIUS,
    marginBottom: 8,
    backgroundColor: colors.paper,
  },
  picFrame: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: PRODUCT_CARD_RADIUS,
    borderTopRightRadius: PRODUCT_CARD_RADIUS,
    backgroundColor: '#f0f0f0',
  },
  picOverlay: {
    ...StyleSheet.absoluteFill,
  },
  picPress: {
    ...StyleSheet.absoluteFill,
  },
  picPlaceholder: {
    backgroundColor: '#f0f0f0',
  },
  heart: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heartActive: {
    backgroundColor: colors.red,
  },
  loc: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  locText: {
    color: '#ffffff',
    fontSize: productCardTokens.locSize,
    fontWeight: fonts.weights.medium,
  },
  cardB: {
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 7,
  },
  cardTitle: {
    fontSize: productCardTokens.titleSize,
    fontWeight: fonts.weights.bold,
    lineHeight: productCardTokens.titleLineHeight,
    minHeight: productCardTokens.titleLineHeight * 2,
    color: colors.text,
  },
  price: {
    fontWeight: fonts.weights.bold,
    color: colors.red,
    fontSize: productCardTokens.priceSize,
    lineHeight: productCardTokens.priceSize + 2,
    marginTop: 2,
  },
  wantCount: {
    marginTop: 2,
    fontSize: productCardTokens.metaSize,
    color: colors.sub,
  },
  tagRow: {
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    minWidth: 0,
  },
  metaText: {
    flex: 1,
    color: colors.sub,
    fontSize: productCardTokens.metaSize,
  },
  serviceCard: {
    borderRadius: radius.lg,
    paddingVertical: serviceCardTokens.paddingVertical,
    paddingHorizontal: serviceCardTokens.paddingHorizontal,
    marginBottom: serviceCardTokens.marginBottom,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: serviceCardTokens.rowGap,
  },
  serviceImg: {
    width: serviceCardTokens.thumbSize,
    height: serviceCardTokens.thumbSize,
    borderRadius: radius.lg,
    backgroundColor: colors.trustSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  servicePhoto: {
    width: '100%',
    height: '100%',
  },
  serviceTitle: {
    fontSize: serviceCardTokens.titleSize,
    fontWeight: fonts.weights.bold,
    lineHeight: serviceCardTokens.titleLineHeight,
    color: colors.text,
  },
  serviceDesc: {
    marginTop: 2,
    color: colors.sub,
    fontSize: serviceCardTokens.descSize,
    lineHeight: serviceCardTokens.descLineHeight,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  serviceArea: {
    color: colors.sub,
    fontSize: serviceCardTokens.metaSize,
  },
  banner: {
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginVertical: 6,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 88,
  },
  bannerArtworkWrap: {
    width: '100%',
    borderRadius: radius.lg,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    position: 'relative',
    ...shadows.card,
  },
  bannerArtworkWrapFlush: {
    marginVertical: 0,
  },
  bannerArtwork: {
    width: '100%',
    height: '100%',
  },
  bannerArtworkAction: {
    position: 'absolute',
    right: profileScreenTokens.bannerActionRight,
    top: '50%',
    zIndex: 2,
    width: profileScreenTokens.bannerActionWidth,
    height: profileScreenTokens.bannerActionHeight,
    minHeight: profileScreenTokens.bannerActionHeight,
    borderRadius: profileScreenTokens.bannerActionRadius,
    backgroundColor: colors.green,
    borderWidth: 1.5,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...shadows.button,
  },
  bannerArtworkActionText: {
    fontWeight: fonts.weights.bold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.paper,
  },
  bannerTrust: {
    borderRadius: radius.md,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    minHeight: 72,
  },
  bannerTrustFlush: {
    marginVertical: 0,
  },
  bannerTrustRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
  },
  bannerLocal: {
    borderRadius: radius.md,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    minHeight: 72,
  },
  bannerLocalFlush: {
    marginVertical: 0,
  },
  bannerLocalRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
  },
  bannerLocalAccent: {
    alignSelf: 'stretch',
    width: 5,
    backgroundColor: colors.green,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  bannerLocalBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    justifyContent: 'center',
  },
  bannerLocalTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    lineHeight: 18,
  },
  bannerLocalSub: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.sub,
  },
  bannerLocalBadge: {
    alignSelf: 'center',
    marginRight: 12,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.trustSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.trustBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  bannerLocalBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fonts.weights.bold,
    color: colors.trustText,
    textAlign: 'center',
  },
  bannerTrustAccent: {
    width: 4,
    backgroundColor: colors.brand,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  bannerTrustBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  bannerTrustTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    lineHeight: 18,
  },
  bannerTrustSub: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.sub,
  },
  bannerTrustChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bannerTrustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.trustSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.trustBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  bannerTrustChipText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fonts.weights.medium,
    color: colors.trustText,
    flexShrink: 1,
  },
  bannerPromo: {
    minHeight: 128,
    paddingBottom: 20,
  },
  bannerPromoOverflow: {
    overflow: 'visible',
  },
  bannerSunburstClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  bannerSunburst: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  bannerSunRay: {
    position: 'absolute',
    right: -24,
    bottom: -48,
    width: 220,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  bannerGlowOrb: {
    position: 'absolute',
    right: -28,
    bottom: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  bannerRowPromo: {
    alignItems: 'flex-start',
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: fonts.weights.bold,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  bannerTitlePromo: {
    fontSize: 20,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  bannerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bannerChip: {
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  bannerChipText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fonts.weights.bold,
    color: '#FFFFFF',
  },
  bannerBadge: {
    position: 'absolute',
    left: 18,
    bottom: 8,
    zIndex: 2,
  },
  bannerBadgeBubble: {
    position: 'absolute',
    top: -10,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...shadows.accent,
  },
  bannerBadgeBody: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 196, 0, 0.92)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.accent,
  },
  mascot: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    ...shadows.accent,
  },
  orderImg: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  orderImgPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    fontSize: 14,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
});
