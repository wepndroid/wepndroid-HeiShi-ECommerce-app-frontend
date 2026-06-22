import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { MAX_LISTING_PHOTOS } from '../services/mediaPicker';
import { colors, fonts, radius } from '../theme';
import {
  getPhotoGridThumbSize,
  PHOTO_GRID_COLUMNS,
  PHOTO_GRID_GAP,
  UPLOAD_MAIN_PHOTO_INSET,
} from '../utils/photoGridSizing';

type Props = {
  imageUrls: string[];
  onAdd: () => void;
  onRemove?: (url: string) => void;
  uploading?: boolean;
  maxPhotos?: number;
  columns?: number;
  horizontalInset?: number;
  compact?: boolean;
};

export function PhotoUploadGrid({
  imageUrls,
  onAdd,
  onRemove,
  uploading,
  maxPhotos = MAX_LISTING_PHOTOS,
  columns = PHOTO_GRID_COLUMNS,
  horizontalInset = UPLOAD_MAIN_PHOTO_INSET,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const thumbSize = useMemo(
    () => getPhotoGridThumbSize(windowWidth, horizontalInset, columns, PHOTO_GRID_GAP),
    [windowWidth, horizontalInset, columns],
  );
  const slotStyle = useMemo(
    () => ({ width: thumbSize, height: thumbSize, borderRadius: radius.md }),
    [thumbSize],
  );
  const canAdd = imageUrls.length < maxPhotos;

  return (
    <View style={[styles.grid, compact && styles.gridCompact, { gap: PHOTO_GRID_GAP }]}>
      {imageUrls.map((uri, index) => (
        <View key={`${uri}-${index}`} style={[styles.thumbWrap, slotStyle]}>
          <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
          {onRemove ? (
            <Pressable
              style={styles.removeBtn}
              onPress={() => onRemove(uri)}
              hitSlop={6}
              accessibilityLabel={t('screens.publishBundle.removeItemPhoto')}
            >
              <AppIcon name="trash" size={11} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      ))}
      {canAdd ? (
        <Pressable style={[styles.addBtn, slotStyle]} onPress={onAdd} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <AppIcon name="camera" size={compact ? 16 : 18} color={colors.sub} />
              <Text style={[styles.addLabel, compact && styles.addLabelCompact]}>
                {imageUrls.length > 0
                  ? t('screens.publish.addMorePhotos')
                  : t('screens.publish.tapToUpload')}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  gridCompact: {
    marginBottom: 0,
  },
  thumbWrap: {
    overflow: 'hidden',
    backgroundColor: colors.stage,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand2,
    backgroundColor: colors.brand3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: {
    fontSize: 10,
    color: colors.text,
    fontWeight: fonts.weights.bold,
    textAlign: 'center',
  },
  addLabelCompact: {
    fontSize: 8,
  },
});
