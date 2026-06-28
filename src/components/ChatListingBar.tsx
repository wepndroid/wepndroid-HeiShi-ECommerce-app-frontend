import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { AmazingSurface } from './AmazingSurface';
import { SellerAvatar } from './SellerAvatar';
import { colors, fonts, radius } from '../theme';

/** Avatar + name for the chat title bar (top header). */
export function ChatCounterpartTitle({
  name,
  sellerKey,
  seller,
  avatarUrl,
  sellerUserId,
  onPress,
}: {
  name: string;
  sellerKey?: string;
  seller?: string;
  avatarUrl?: string;
  sellerUserId?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.titleIdentity}>
      <SellerAvatar
        sellerKey={sellerKey ?? ''}
        seller={seller ?? name}
        avatarUrl={avatarUrl}
        sellerUserId={sellerUserId ?? sellerKey}
        size={34}
      />
      <Text style={styles.titleName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.titlePressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/** v7 product inquiry card — shown below the chat title bar. */
export function ChatListingBar({
  title,
  priceLabel,
  location,
  onPress,
}: {
  title: string;
  priceLabel: string;
  location?: string;
  onPress?: () => void;
}) {
  const { t } = useTranslation();

  const content = (
    <>
      <Text style={styles.inquiryTitle} numberOfLines={2}>
        {t('screens.chat.inquiryTitle', { title })}
      </Text>
      <Text style={styles.metaLine} numberOfLines={2}>
        <Text style={styles.metaPrice}>{priceLabel}</Text>
        <Text style={styles.metaRest}>
          {t('screens.chat.listingMetaSuffix', { location: location ?? '' })}
        </Text>
      </Text>
    </>
  );

  return (
    <AmazingSurface style={styles.productCard} highlight={false} preserveShadow>
      {onPress ? (
        <Pressable style={styles.productBlock} onPress={onPress} accessibilityRole="button">
          {content}
        </Pressable>
      ) : (
        <View style={styles.productBlock}>{content}</View>
      )}
    </AmazingSurface>
  );
}

const styles = StyleSheet.create({
  titlePressable: {
    maxWidth: '100%',
  },
  titleIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  titleName: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    flexShrink: 1,
  },
  productCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  inquiryTitle: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    lineHeight: 18,
  },
  metaLine: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaPrice: {
    fontWeight: fonts.weights.bold,
    color: colors.red,
    fontSize: 12,
    lineHeight: 16,
  },
  metaRest: {
    fontWeight: fonts.weights.medium,
    color: colors.sub,
    fontSize: 12,
    lineHeight: 16,
  },
});
