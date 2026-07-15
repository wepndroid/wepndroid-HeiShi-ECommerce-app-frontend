import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import { AmazingSurface } from './AmazingSurface';
import { SellerAvatar } from './SellerAvatar';
import { AppIcon } from './AppIcon';
import { colors, fonts, formControls, radius } from '../theme';
import { filterNumericInput, numericKeyboardType } from '../utils/numericInput';

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
  price,
  currencyPrefix,
  location,
  onPress,
  canEditPrice,
  onSavePrice,
  onInvalidPrice,
}: {
  title: string;
  priceLabel: string;
  price?: number;
  currencyPrefix?: string;
  location?: string;
  onPress?: () => void;
  canEditPrice?: boolean;
  onSavePrice?: (newPrice: number) => Promise<void>;
  onInvalidPrice?: () => void;
}) {
  const { t } = useTranslation();
  const [editingPrice, setEditingPrice] = useState(false);
  const [draftPrice, setDraftPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const showPriceEditor = Boolean(canEditPrice && onSavePrice && price != null && currencyPrefix);

  useEffect(() => {
    if (!editingPrice && price != null) {
      setDraftPrice(String(price));
    }
  }, [editingPrice, price]);

  const handlePriceAction = useCallback(async () => {
    if (!showPriceEditor || savingPrice) return;
    if (!editingPrice) {
      setDraftPrice(String(price));
      setEditingPrice(true);
      return;
    }
    const parsed = Number.parseFloat(draftPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      onInvalidPrice?.();
      return;
    }
    setSavingPrice(true);
    try {
      await onSavePrice!(parsed);
      setEditingPrice(false);
    } finally {
      setSavingPrice(false);
    }
  }, [draftPrice, editingPrice, onInvalidPrice, onSavePrice, price, savingPrice, showPriceEditor]);

  const titleBlock = (
    <Text style={styles.inquiryTitle} numberOfLines={2}>
      {t('screens.chat.inquiryTitle', { title })}
    </Text>
  );

  const priceBlock = showPriceEditor ? (
    <View style={styles.priceRow}>
      <View style={styles.priceEditor}>
        <Text style={styles.metaPrice}>{currencyPrefix}</Text>
        <View style={styles.priceControlSlot}>
          <Text style={[styles.metaPrice, styles.priceControlLayer, editingPrice && styles.hiddenPriceControl]}>
            {price}
          </Text>
          <View style={[styles.priceInputBox, styles.priceControlLayer, !editingPrice && styles.hiddenPriceControl]}>
            <TextInput
              style={styles.priceInput}
              value={draftPrice}
              onChangeText={(raw) => {
                const { value, rejected } = filterNumericInput(raw, 'decimal');
                if (rejected) onInvalidPrice?.();
                setDraftPrice(value);
              }}
              keyboardType={numericKeyboardType('decimal')}
              placeholder={t('screens.chat.pricePlaceholder')}
              placeholderTextColor={formControls.placeholderColor}
              editable={editingPrice && !savingPrice}
              selectTextOnFocus
            />
          </View>
        </View>
      </View>
      <Pressable
        style={styles.priceAction}
        onPress={() => void handlePriceAction()}
        disabled={savingPrice}
        accessibilityRole="button"
        accessibilityLabel={
          editingPrice ? t('screens.chat.savePrice') : t('screens.chat.editPrice')
        }
      >
        {savingPrice ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <AppIcon name={editingPrice ? 'archive' : 'edit'} size={18} color={colors.text} />
        )}
      </Pressable>
      <Text style={styles.metaRest} numberOfLines={1}>
        {t('screens.chat.listingMetaSuffix', { location: location ?? '' })}
      </Text>
    </View>
  ) : (
    <Text style={styles.metaLine} numberOfLines={2}>
      <Text style={styles.metaPrice}>{priceLabel}</Text>
      <Text style={styles.metaRest}>
        {t('screens.chat.listingMetaSuffix', { location: location ?? '' })}
      </Text>
    </Text>
  );

  return (
    <AmazingSurface style={styles.productCard} highlight={false} preserveShadow>
      <View style={styles.productBlock}>
        {onPress ? (
          <Pressable onPress={onPress} accessibilityRole="button">
            {titleBlock}
          </Pressable>
        ) : (
          titleBlock
        )}
        {priceBlock}
      </View>
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
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  priceEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
  },
  priceInputBox: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priceControlSlot: {
    width: 82,
    height: 28,
    position: 'relative',
  },
  priceControlLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  priceInput: {
    fontSize: 12,
    fontWeight: fonts.weights.bold,
    color: colors.red,
    padding: 0,
    minHeight: 20,
  },
  hiddenPriceControl: {
    opacity: 0,
  },
  priceAction: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 1,
  },
});
