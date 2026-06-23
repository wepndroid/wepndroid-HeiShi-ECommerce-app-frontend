import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
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
import { useApp } from '../context/AppContext';
import { colors, fonts, productCardTokens, radius, cardShadow, CARD_PREVIEW_ASPECT_RATIO, PRODUCT_CARD_RADIUS } from '../theme';
import { homePromoBannerForLanguage } from '../assets/homeBanner';
import { bannerArtworkAspectRatio } from '../assets/bannerAspect';
import { AppIcon, AppIconName } from './AppIcon';
import { AmazingSurface } from './AmazingSurface';
import { Badge } from './UI';
import { SellerAvatar } from './SellerAvatar';


export function ProductCard({
  product,
  onPress,
}: {
  product: ReturnType<typeof useLocalizedProducts>[number];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { favs, toggleFavoriteById } = useApp();
  const isFav = favs.has(product.id);

  return (
    <AmazingSurface style={styles.card} highlight={false} preserveShadow>
      <View style={[styles.pic, { aspectRatio: CARD_PREVIEW_ASPECT_RATIO }]}>
        <Pressable style={styles.picPress} onPress={onPress}>
          <Image source={{ uri: product.imageUrl }} style={styles.picImage} resizeMode="cover" />
        </Pressable>
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
      <Pressable style={styles.cardB} onPress={onPress}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>
          {product.pricePrefix}
          {product.price}
        </Text>
        <View style={styles.tagRow}>
          <Badge text={product.tag} compact />
        </View>
        <View style={styles.meta}>
          <SellerAvatar
            sellerKey={product.sellerKey}
            seller={product.seller}
            avatarUrl={product.sellerAvatarUrl}
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
    return (
      <AmazingSurface style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{emptyText}</Text>
      </AmazingSurface>
    );
  }

  return <ProductMasonry products={localized} onPress={onPress} />;
}

export function ProductGrid({
  data,
  onPress,
}: {
  data: Product[];
  onPress: (p: Product) => void;
}) {
  const localized = useLocalizedProducts(data);
  if (!localized.length) return null;

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

  return (
    <AmazingSurface style={styles.serviceCard} onPress={onPress}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceImg}>
          {service.imageUrl ? (
            <Image
              source={{ uri: service.imageUrl }}
              style={styles.servicePhoto}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <AppIcon name={iconMap[service.icon]} size={28} color="#b87000" />
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
            <Badge text={service.apiPriceLabel ?? (service.priceKey ? t(service.priceKey) : '')} />
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
  variant = 'standard',
  artwork = false,
  artworkSource,
}: {
  title: string;
  subtitle: string;
  icon?: AppIconName;
  variant?: 'standard' | 'promo';
  artwork?: boolean;
  /** Custom full-width banner image; defaults to home promo artwork. */
  artworkSource?: number;
}) {
  const { i18n } = useTranslation();

  if (variant === 'promo' && artwork) {
    const bannerSource = artworkSource ?? homePromoBannerForLanguage(i18n.language);
    const aspectRatio = bannerArtworkAspectRatio(bannerSource);
    return (
      <View style={[styles.bannerArtworkWrap, { aspectRatio }]}>
        <Image
          source={bannerSource}
          style={styles.bannerArtwork}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={title}
        />
      </View>
    );
  }

  const highlights = splitBannerHighlights(subtitle);
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
  return (
    <View style={[styles.orderImg, { width: size, height: size }]}>
      <Image source={{ uri: imageUrl }} style={styles.orderImgPhoto} resizeMode="cover" />
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
  pic: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    borderTopLeftRadius: PRODUCT_CARD_RADIUS,
    borderTopRightRadius: PRODUCT_CARD_RADIUS,
  },
  picPress: {
    width: '100%',
    height: '100%',
  },
  picImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    marginTop: 3,
  },
  tagRow: {
    marginTop: 5,
    alignSelf: 'flex-start',
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
    padding: 12,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceImg: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brand3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  servicePhoto: {
    width: '100%',
    height: '100%',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  serviceDesc: {
    marginTop: 4,
    color: colors.sub,
    fontSize: 12,
    lineHeight: 16,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  serviceArea: {
    color: colors.sub,
    fontSize: 11,
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
    ...cardShadow,
  },
  bannerArtwork: {
    width: '100%',
    height: '100%',
  },
  bannerPromo: {
    minHeight: 128,
    paddingBottom: 20,
  },
  bannerPromoOverflow: {
    overflow: 'visible',
  },
  bannerSunburstClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  bannerSunburst: {
    ...StyleSheet.absoluteFillObject,
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
    textShadowColor: 'rgba(180, 90, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: '#B86A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  mascot: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#B86A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  orderImg: {
    borderRadius: radius.md,
    backgroundColor: colors.brand3,
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
