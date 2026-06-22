import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import {
  BundleLineItem,
  BundleMeta,
  bundleItemImageUrls,
  createBundleLineItem,
  distributeEvenShares,
  getRemainingBundlePriceFromMeta,
  sumBundleShares,
} from '../data/bundle';
import { formControlStyles } from './FormUI';
import { AmazingSurface } from './AmazingSurface';
import { AppIcon } from './AppIcon';
import { PhotoUploadGrid } from './PhotoUploadGrid';
import { Badge } from './UI';
import { colors, fonts, formControls, radius } from '../theme';
import { filterNumericInput, numericKeyboardType } from '../utils/numericInput';
import { FORM_CARD_ITEM_PHOTO_INSET } from '../utils/photoGridSizing';

type EditorProps = {
  items: BundleLineItem[];
  bundlePrice: number;
  onChange: (items: BundleLineItem[]) => void;
  onInvalidNumber?: () => void;
  uploadingItemId?: string | null;
  onAddItemPhotos: (itemId: string) => void;
  onRemoveItemPhoto: (itemId: string, url: string) => void;
};

export function BundleLineItemsEditor({
  items,
  bundlePrice,
  onChange,
  onInvalidNumber,
  uploadingItemId,
  onAddItemPhotos,
  onRemoveItemPhoto,
}: EditorProps) {
  const { t } = useTranslation();

  const updateItem = (id: string, patch: Partial<BundleLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    onChange([...items, createBundleLineItem()]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const splitEvenly = () => {
    if (!bundlePrice || !items.length) return;
    onChange(distributeEvenShares(items, bundlePrice));
  };

  const shareTotal = sumBundleShares(items);
  const matched = Math.abs(shareTotal - bundlePrice) <= 0.02;

  return (
    <View style={styles.editorWrap}>
      {items.map((item, index) => (
        <AmazingSurface key={item.id} style={styles.itemCard}>
          <View style={styles.itemHead}>
            <Text style={styles.itemIndex}>{t('screens.publishBundle.itemIndex', { index: index + 1 })}</Text>
            {items.length > 2 ? (
              <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                <Text style={styles.removeText}>{t('screens.publishBundle.removeItem')}</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.photoLabel}>{t('screens.publishBundle.itemPhoto')}</Text>
          <PhotoUploadGrid
            imageUrls={bundleItemImageUrls(item)}
            onAdd={() => onAddItemPhotos(item.id)}
            onRemove={(url) => onRemoveItemPhoto(item.id, url)}
            uploading={uploadingItemId === item.id}
            horizontalInset={FORM_CARD_ITEM_PHOTO_INSET}
            compact
          />
          <View style={formControlStyles.box}>
            <TextInput
              style={formControlStyles.input}
              value={item.title}
              onChangeText={(title) => updateItem(item.id, { title })}
              placeholder={t('screens.publishBundle.itemTitlePlaceholder')}
              placeholderTextColor={formControls.placeholderColor}
            />
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>{t('screens.publishBundle.sharePrice')}</Text>
              <View style={formControlStyles.box}>
                <TextInput
                  style={formControlStyles.input}
                  value={item.sharePrice ? String(item.sharePrice) : ''}
                  onChangeText={(raw) => {
                    const { value: filtered, rejected } = filterNumericInput(raw, 'decimal');
                    if (rejected) {
                      onInvalidNumber?.();
                    }
                    updateItem(item.id, { sharePrice: filtered ? Number.parseFloat(filtered) : 0 });
                  }}
                  keyboardType={numericKeyboardType('decimal')}
                  placeholder="0"
                  placeholderTextColor={formControls.placeholderColor}
                />
              </View>
            </View>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>{t('screens.publishBundle.separatePrice')}</Text>
              <View style={formControlStyles.box}>
                <TextInput
                  style={formControlStyles.input}
                  value={item.separatePrice != null ? String(item.separatePrice) : ''}
                  onChangeText={(raw) => {
                    const { value: filtered, rejected } = filterNumericInput(raw, 'decimal');
                    if (rejected) {
                      onInvalidNumber?.();
                    }
                    updateItem(item.id, {
                      separatePrice: filtered ? Number.parseFloat(filtered) : undefined,
                    });
                  }}
                  keyboardType={numericKeyboardType('decimal')}
                  placeholder={t('screens.publishBundle.separateOptional')}
                  placeholderTextColor={formControls.placeholderColor}
                />
              </View>
            </View>
          </View>
        </AmazingSurface>
      ))}

      <Pressable style={styles.addBtn} onPress={addItem}>
        <AppIcon name="box" size={16} color={colors.text} />
        <Text style={styles.addBtnText}>{t('screens.publishBundle.addItem')}</Text>
      </Pressable>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, !matched && styles.summaryMismatch]}>
          {t('screens.publishBundle.priceSummary', {
            items: items.length,
            total: shareTotal.toFixed(2),
            target: bundlePrice.toFixed(2),
          })}
        </Text>
        <Pressable onPress={splitEvenly} disabled={!bundlePrice || items.length < 2}>
          <Text style={styles.splitText}>{t('screens.publishBundle.distributeShares')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function statusLabelKey(status: BundleLineItem['status']) {
  if (status === 'sold') return 'screens.publishBundle.statusSold';
  if (status === 'onHold') return 'screens.publishBundle.statusHold';
  return 'screens.publishBundle.statusAvailable';
}

function resolveItemTitle(title: string, t: (key: string) => string) {
  return title.startsWith('screens.') ? t(title) : title;
}

export function BundleDetailSection({ meta }: { meta: BundleMeta }) {
  const { t } = useTranslation();
  const remaining = getRemainingBundlePriceFromMeta(meta);
  const hasSold = meta.items.some((item) => item.status === 'sold');

  return (
    <View style={styles.detailWrap}>
      <View style={styles.detailStats}>
        <Badge text={t('tags.bundleSet')} />
        <Text style={styles.detailStatText}>
          {t('screens.publishBundle.statItems', { count: meta.totalItems })}
        </Text>
        {meta.pickupDeadline ? (
          <Text style={styles.detailStatText}>
            {t('screens.publishBundle.pickupBy', { date: meta.pickupDeadline })}
          </Text>
        ) : null}
      </View>
      <Text style={styles.detailPrice}>
        {hasSold
          ? t('products.bundle.remainingPrice', { amount: remaining })
          : t('products.bundle.fullPrice', { amount: meta.fullPrice })}
      </Text>
      {hasSold ? (
        <Text style={styles.detailWasPrice}>
          {t('products.bundle.wasFullPrice', { amount: meta.fullPrice })}
        </Text>
      ) : null}
      {meta.allowSeparateSale ? (
        <Text style={styles.detailHint}>{t('screens.publishBundle.separateAllowed')}</Text>
      ) : null}
      <Text style={styles.itemsHeading}>{t('screens.publishBundle.itemsHeading')}</Text>
      {meta.items.map((item) => {
        const photos = bundleItemImageUrls(item);
        return (
          <View key={item.id} style={styles.detailItem}>
            {photos[0] ? (
              <View style={styles.detailThumbWrap}>
                <Image source={{ uri: photos[0] }} style={styles.detailThumb} resizeMode="cover" />
                {photos.length > 1 ? (
                  <View style={styles.detailPhotoCount}>
                    <Text style={styles.detailPhotoCountText}>+{photos.length - 1}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.detailThumbPlaceholder}>
                <AppIcon name="box" size={18} color={colors.sub} />
              </View>
            )}
            <View style={styles.detailItemMain}>
              <Text style={styles.detailItemTitle}>{resolveItemTitle(item.title, t)}</Text>
              {item.separatePrice != null && item.status === 'available' ? (
                <Text style={styles.detailSeparate}>
                  {t('screens.publishBundle.separateListing', { amount: item.separatePrice })}
                </Text>
              ) : null}
            </View>
            <Badge text={t(statusLabelKey(item.status))} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  editorWrap: {
    gap: 10,
  },
  itemCard: {
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoLabel: {
    fontSize: 11,
    color: colors.sub,
    fontWeight: fonts.weights.medium,
  },
  itemIndex: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  removeText: {
    fontSize: 12,
    color: colors.red,
    fontWeight: fonts.weights.medium,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceField: {
    flex: 1,
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.sub,
    fontWeight: fonts.weights.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 12,
    backgroundColor: colors.brand3,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  summaryRow: {
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
  summaryMismatch: {
    color: colors.red,
    fontWeight: fonts.weights.medium,
  },
  splitText: {
    fontSize: 12,
    color: '#b87000',
    fontWeight: fonts.weights.bold,
  },
  detailWrap: {
    gap: 10,
  },
  detailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  detailStatText: {
    fontSize: 12,
    color: colors.sub,
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: fonts.weights.bold,
    color: colors.red,
  },
  detailWasPrice: {
    fontSize: 12,
    color: colors.sub,
  },
  detailHint: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
  itemsHeading: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  detailThumbWrap: {
    position: 'relative',
  },
  detailThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.stage,
  },
  detailPhotoCount: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  detailPhotoCountText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
  },
  detailThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.stage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailItemMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailItemTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  detailSeparate: {
    fontSize: 11,
    color: colors.sub,
  },
});
