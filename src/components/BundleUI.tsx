import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import {
  BundleLineItem,
  BundleMeta,
  bundleHasSoldItemsFromMeta,
  bundleItemImageUrls,
  createBundleLineItem,
  distributeEvenShares,
  getRemainingBundlePriceFromMeta,
  sumBundleShares,
} from '../data/bundle';
import { formControlStyles, useFormFieldPill } from './FormUI';
import { AmazingSurface } from './AmazingSurface';
import { AppIcon } from './AppIcon';
import { PhotoUploadGrid } from './PhotoUploadGrid';
import { FullScreenImageViewer } from './FullScreenImageViewer';
import { colors, fonts, formControls, radius, detailPageTokens } from '../theme';
import { filterNumericInput, numericKeyboardType } from '../utils/numericInput';
import { formatPickupDateLabel } from '../utils/pickupDate';
import { findOptionLabel } from '../utils/formOptionLabel';
import { useFormOptions } from '../hooks/useFormOptions';
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
  const usePill = useFormFieldPill();
  const pillBox = usePill ? formControlStyles.boxPill : null;

  const updateItem = (id: string, patch: Partial<BundleLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const next = [...items, createBundleLineItem()];
    onChange(bundlePrice > 0 && next.length >= 2 ? distributeEvenShares(next, bundlePrice) : next);
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
          <View style={[formControlStyles.box, pillBox]}>
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
              <View style={[formControlStyles.box, pillBox]}>
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
                  placeholder={t('screens.publishBundle.sharePriceSample')}
                  placeholderTextColor={formControls.placeholderColor}
                />
              </View>
            </View>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>{t('screens.publishBundle.separatePrice')}</Text>
              <View style={[formControlStyles.box, pillBox]}>
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

export function BundleDetailSummary({ meta }: { meta: BundleMeta }) {
  const { t, i18n } = useTranslation();
  const { options } = useFormOptions();
  const remaining = getRemainingBundlePriceFromMeta(meta);
  const hasSold = bundleHasSoldItemsFromMeta(meta);
  const pickupWindowLabel = meta.pickupWindow
    ? findOptionLabel(options.serviceTimeSlots, meta.pickupWindow, i18n.language) || meta.pickupWindow
    : '';

  return (
    <View style={styles.detailWrap}>
      <Text style={styles.detailPrice}>
        {t('common.currencyPrefix')}
        {remaining}
      </Text>
      {hasSold ? (
        <Text style={styles.detailStatText}>
          {t('products.bundle.wasFullPrice', { amount: meta.fullPrice })}
        </Text>
      ) : null}
      {meta.pickupDeadline ? (
        <Text style={styles.detailStatText}>
          {t('screens.publishBundle.pickupBy', {
            date: formatPickupDateLabel(meta.pickupDeadline, i18n.language),
          })}
        </Text>
      ) : null}
      {pickupWindowLabel ? (
        <Text style={styles.detailStatText}>{pickupWindowLabel}</Text>
      ) : null}
      {meta.allowSeparateSale ? (
        <Text style={styles.detailHint}>{t('screens.publishBundle.separateAllowed')}</Text>
      ) : null}
    </View>
  );
}

export function BundleItemDetailCard({
  item,
  allowSeparateSale = true,
  onBuySeparate,
  buyDisabled = false,
}: {
  item: BundleMeta['items'][number];
  allowSeparateSale?: boolean;
  onBuySeparate?: () => void;
  buyDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const photos = bundleItemImageUrls(item);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const title = (() => {
    const trimmed = item.title.trim();
    if (trimmed.startsWith('screens.')) return t(trimmed);
    return trimmed;
  })();

  const openViewer = useCallback((photoIndex: number) => {
    setViewerStart(photoIndex);
    setViewerVisible(true);
  }, []);

  return (
    <View style={styles.detailItemCardInner}>
      {title ? <Text style={styles.detailItemTitle}>{title}</Text> : null}
      {item.status === 'sold' ? (
        <Text style={styles.detailItemStatus}>{t('common.sold')}</Text>
      ) : item.status === 'onHold' ? (
        <Text style={styles.detailItemStatus}>{t('common.onHold')}</Text>
      ) : null}
      {item.sharePrice > 0 ? (
        <Text style={styles.detailSharePrice}>
          {t('common.currencyPrefix')}
          {item.sharePrice.toFixed(2)}
        </Text>
      ) : null}
      {allowSeparateSale && item.separatePrice != null && item.separatePrice > 0 ? (
        <Text style={styles.detailSharePrice}>
          {t('screens.publishBundle.separateListing', { amount: item.separatePrice.toFixed(2) })}
        </Text>
      ) : null}
      {onBuySeparate &&
      allowSeparateSale &&
      item.separatePrice != null &&
      item.separatePrice > 0 &&
      item.status !== 'sold' &&
      item.status !== 'onHold' ? (
        <Pressable
          style={[styles.detailBuySeparateBtn, buyDisabled && styles.detailBuySeparateBtnDisabled]}
          onPress={buyDisabled ? undefined : onBuySeparate}
          accessibilityRole="button"
        >
          <Text style={styles.detailBuySeparateText}>{t('common.buySeparately')}</Text>
        </Pressable>
      ) : null}
      {photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.detailPhotoStrip}
        >
          {photos.map((uri, photoIndex) => (
            <Pressable key={uri} onPress={() => openViewer(photoIndex)} accessibilityRole="imagebutton">
              <Image
                source={{ uri }}
                style={styles.detailPhotoThumb}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <FullScreenImageViewer
        visible={viewerVisible}
        images={photos}
        initialIndex={viewerStart}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

export function BundleItemsSection({
  meta,
  onBuySeparate,
  buyDisabled = false,
}: {
  meta: BundleMeta;
  onBuySeparate?: (itemId: string) => void;
  buyDisabled?: boolean;
}) {
  return (
    <View style={styles.detailItemsWrap}>
      {meta.items.map((item) => (
        <AmazingSurface key={item.id} style={styles.detailItemCard}>
          <BundleItemDetailCard
            item={item}
            allowSeparateSale={meta.allowSeparateSale}
            onBuySeparate={onBuySeparate ? () => onBuySeparate(item.id) : undefined}
            buyDisabled={buyDisabled}
          />
        </AmazingSurface>
      ))}
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
    backgroundColor: colors.surfaceMuted,
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
    fontSize: detailPageTokens.bundleMetaSize,
    color: colors.sub,
  },
  detailPrice: {
    fontSize: detailPageTokens.bundlePriceSize,
    fontWeight: fonts.weights.bold,
    color: colors.red,
  },
  detailWasPrice: {
    fontSize: detailPageTokens.bundleMetaSize,
    color: colors.sub,
  },
  detailHint: {
    fontSize: detailPageTokens.bundleMetaSize,
    color: colors.sub,
    lineHeight: 16,
  },
  detailItemsWrap: {
    gap: 10,
    marginTop: 4,
  },
  detailItemCard: {
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
  },
  detailItemCardInner: {
    gap: 10,
  },
  detailItemHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailItemIndex: {
    fontSize: 11,
    color: colors.sub,
    fontWeight: fonts.weights.medium,
  },
  detailSharePrice: {
    fontSize: detailPageTokens.bundleMetaSize,
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },
  detailBuySeparateBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  detailBuySeparateBtnDisabled: {
    opacity: 0.45,
  },
  detailBuySeparateText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: fonts.weights.semibold,
  },
  detailPhotoLabel: {
    fontSize: 11,
    color: colors.sub,
    fontWeight: fonts.weights.medium,
  },
  detailPhotoStrip: {
    gap: 8,
    paddingRight: 4,
  },
  detailPhotoThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.stage,
  },
  detailPhotoEmpty: {
    width: 100,
    height: 100,
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
    fontSize: detailPageTokens.bundleItemTitleSize,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  detailItemStatus: {
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    color: colors.muted,
  },
  detailSeparate: {
    fontSize: detailPageTokens.bundleMetaSize,
    color: colors.sub,
  },
});
