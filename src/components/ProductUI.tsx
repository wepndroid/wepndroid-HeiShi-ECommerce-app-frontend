import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { LocalService } from '../data/services';
import { Product } from '../types';
import { useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { colors, fonts, radius } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';
import { AmazingSurface } from './AmazingSurface';
import { Badge } from './UI';

const CARD_PIC_HEIGHT = 132;
const CARD_HEIGHT = 238;

export function ProductCard({
  product,
  onPress,
}: {
  product: ReturnType<typeof useLocalizedProducts>[number];
  onPress: () => void;
}) {
  return (
    <AmazingSurface style={styles.card} onPress={onPress} preserveShadow highlight={false}>
      <View style={styles.pic}>
        <Image source={{ uri: product.imageUrl }} style={styles.picImage} resizeMode="cover" />
        <View style={styles.heart}>
          <AppIcon name="heartOutline" size={14} color={colors.text} />
        </View>
        <View style={styles.loc}>
          <Text style={styles.locText}>{product.loc}</Text>
        </View>
      </View>
      <View style={styles.cardB}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>
          {product.pricePrefix}
          {product.price}
        </Text>
        <View style={styles.meta}>
          <View style={styles.av}>
            <Text style={styles.avText}>{product.seller.slice(0, 1)}</Text>
          </View>
          <Text style={styles.metaText} numberOfLines={1}>
            {product.seller}
          </Text>
          <Badge text={product.tag} />
        </View>
      </View>
    </AmazingSurface>
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
  const left = localized.filter((_, i) => i % 2 === 0);
  const right = localized.filter((_, i) => i % 2 === 1);

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

export function ProductGrid({
  data,
  onPress,
}: {
  data: Product[];
  onPress: (p: Product) => void;
}) {
  const localized = useLocalizedProducts(data);
  return (
    <View style={styles.gridProducts}>
      {localized.map((p) => (
        <View key={p.id} style={styles.gridItem}>
          <ProductCard product={p} onPress={() => onPress(p)} />
        </View>
      ))}
    </View>
  );
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

  return (
    <AmazingSurface style={styles.serviceCard} onPress={onPress}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceImg}>
          <AppIcon name={iconMap[service.icon]} size={28} color="#b87000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>
            {service.apiTitle ?? (service.titleKey ? t(service.titleKey) : '')}
          </Text>
          <Text style={styles.serviceDesc}>
            {service.apiDesc ?? (service.descKey ? t(service.descKey) : '')}
          </Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceArea}>{service.area}</Text>
            <Badge text={service.apiPriceLabel ?? (service.priceKey ? t(service.priceKey) : '')} />
          </View>
        </View>
      </View>
    </AmazingSurface>
  );
}

export function Banner({
  title,
  subtitle,
  icon = 'shoppingBags',
}: {
  title: string;
  subtitle: string;
  icon?: AppIconName;
}) {
  return (
    <LinearGradient
      colors={['#ffb347', colors.brand2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.banner}
    >
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerSub}>{subtitle}</Text>
      </View>
      <View style={styles.mascot}>
        <AppIcon name={icon} size={36} color={colors.brand2} />
      </View>
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
    gap: 10,
  },
  feedCol: {
    flex: 1,
    paddingHorizontal: 1,
  },
  gridProducts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    paddingHorizontal: 1,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  pic: {
    height: CARD_PIC_HEIGHT,
    position: 'relative',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
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
    fontSize: 10,
    fontWeight: fonts.weights.medium,
  },
  cardB: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    lineHeight: 18,
    height: 36,
    color: colors.text,
  },
  price: {
    fontWeight: fonts.weights.bold,
    color: colors.red,
    fontSize: 16,
    marginTop: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    minWidth: 0,
  },
  av: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f4e1c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avText: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  metaText: {
    flex: 1,
    color: '#888888',
    fontSize: 11,
  },
  serviceCard: {
    borderRadius: 20,
    padding: 13,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceImg: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff1d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  serviceDesc: {
    marginTop: 5,
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  serviceArea: {
    color: '#888888',
    fontSize: 11,
  },
  banner: {
    borderRadius: radius.lg,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#5c2a00',
    lineHeight: 17,
  },
  mascot: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderImg: {
    borderRadius: 15,
    backgroundColor: '#fff1d3',
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
});
