import React from 'react';
import { Image, ImageStyle, Pressable, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { Text } from './typography';
import { colors, fonts } from '../theme';
import { resolveSellerAvatarUrl } from '../utils/sellerAvatar';

export function SellerAvatar({
  sellerKey,
  seller,
  avatarUrl,
  size = 20,
  style,
  onPress,
}: {
  sellerKey: string;
  seller: string;
  avatarUrl?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
  onPress?: () => void;
}) {
  const image = (
    <Image
      source={{ uri: resolveSellerAvatarUrl(sellerKey, seller, avatarUrl, size) }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.brand3,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          overflow: 'hidden',
          flexShrink: 0,
        },
        style,
      ]}
      resizeMode="cover"
      accessibilityLabel={seller}
    />
  );

  if (!onPress) return image;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={seller}
    >
      {image}
    </Pressable>
  );
}

/** Seller row for product detail — matches feed card avatar styling at larger size. */
export function SellerAuthorRow({
  sellerKey,
  seller,
  avatarUrl,
  subtitle,
  action,
  style,
  onPress,
}: {
  sellerKey: string;
  seller: string;
  avatarUrl?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const profileBlock = (
    <>
      <SellerAvatar
        sellerKey={sellerKey}
        seller={seller}
        avatarUrl={avatarUrl}
        size={46}
      />
      <View style={styles.authorCopy}>
        <Text style={styles.authorName} numberOfLines={1}>
          {seller}
        </Text>
        {subtitle ? (
          <Text style={styles.authorSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={[styles.authorRow, style]}>
      {onPress ? (
        <Pressable style={styles.authorPressable} onPress={onPress}>
          {profileBlock}
        </Pressable>
      ) : (
        profileBlock
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  authorCopy: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  authorSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.sub,
  },
});
