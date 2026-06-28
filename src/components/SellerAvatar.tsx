import React from 'react';
import { Image, ImageStyle, Pressable, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { Text } from './typography';
import { AppIcon } from './AppIcon';
import { colors, fonts, detailPageTokens } from '../theme';
import { resolveSellerAvatarUrl } from '../utils/sellerAvatar';
import { useSellerAvatarFallback } from '../hooks/useCurrentUserAvatar';

const avatarFrameStyle = (size: number): ImageStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: colors.surfaceMuted,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.line,
  overflow: 'hidden',
  flexShrink: 0,
});

export function SellerAvatar({
  sellerKey,
  seller,
  avatarUrl,
  sellerUserId,
  listingId,
  size = 20,
  style,
  onPress,
}: {
  sellerKey: string;
  seller: string;
  avatarUrl?: string;
  sellerUserId?: string;
  listingId?: number;
  size?: number;
  style?: StyleProp<ImageStyle>;
  onPress?: () => void;
}) {
  const selfAvatar = useSellerAvatarFallback(sellerUserId, sellerKey, seller);
  const resolvedUri = resolveSellerAvatarUrl(
    sellerKey,
    seller,
    avatarUrl,
    size,
    listingId,
    selfAvatar,
  );
  const frameStyle = [avatarFrameStyle(size), style];

  const avatar = resolvedUri ? (
    <Image
      key={resolvedUri}
      source={{ uri: resolvedUri }}
      style={frameStyle}
      resizeMode="cover"
      accessibilityLabel={seller}
    />
  ) : (
    <View style={frameStyle} accessibilityLabel={seller}>
      <View style={styles.placeholderInner}>
        <AppIcon name="person" size={Math.max(12, Math.round(size * 0.45))} color={colors.sub} />
      </View>
    </View>
  );

  if (!onPress) return avatar;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={seller}
    >
      {avatar}
    </Pressable>
  );
}

/** Seller row for product detail — matches feed card avatar styling at larger size. */
export function SellerAuthorRow({
  sellerKey,
  seller,
  avatarUrl,
  sellerUserId,
  listingId,
  subtitle,
  action,
  style,
  onPress,
}: {
  sellerKey: string;
  seller: string;
  avatarUrl?: string;
  sellerUserId?: string;
  listingId?: number;
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
        sellerUserId={sellerUserId}
        listingId={listingId}
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
  placeholderInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: detailPageTokens.authorNameSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  authorSub: {
    marginTop: 2,
    fontSize: detailPageTokens.authorSubSize,
    lineHeight: 15,
    color: colors.sub,
  },
});
