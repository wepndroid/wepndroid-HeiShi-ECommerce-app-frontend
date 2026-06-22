import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { PillButton } from './UI';
import { colors, fonts, radius } from '../theme';

export function ChatListingBar({
  imageUrl,
  title,
  priceLabel,
  metaLine,
  locationLine,
  onBuyNow,
  onPress,
}: {
  imageUrl: string;
  title: string;
  priceLabel: string;
  metaLine: string;
  locationLine: string;
  onBuyNow: () => void;
  onPress?: () => void;
}) {
  const { t } = useTranslation();

  const content = (
    <>
      <Image
        source={{ uri: imageUrl }}
        style={styles.thumb}
        resizeMode="cover"
        accessibilityLabel={title}
      />
      <View style={styles.copy}>
        <Text style={styles.price}>{priceLabel}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaLine}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {locationLine}
        </Text>
      </View>
      <PillButton
        label={t('screens.chat.buyNow')}
        variant="purchase"
        onPress={onBuyNow}
        style={styles.buyBtn}
      />
    </>
  );

  return (
    <View style={styles.bar}>
      {onPress ? (
        <Pressable style={styles.row} onPress={onPress}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.brand3,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.red,
  },
  meta: {
    fontSize: 11,
    color: colors.sub,
  },
  location: {
    fontSize: 11,
    color: colors.sub,
  },
  buyBtn: {
    flexShrink: 0,
    minWidth: 72,
    paddingHorizontal: 12,
  },
});
