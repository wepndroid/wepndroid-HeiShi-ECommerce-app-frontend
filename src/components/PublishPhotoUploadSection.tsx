import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { PhotoUploadGrid } from './PhotoUploadGrid';
import { MAX_LISTING_PHOTOS } from '../services/mediaPicker';
import { colors, fonts, radius } from '../theme';

type Props = {
  title: string;
  hint: string;
  tip?: string;
  imageUrls: string[];
  onAdd: () => void;
  uploading?: boolean;
  onRemove?: (url: string) => void;
  maxPhotos?: number;
  horizontalInset?: number;
};

export function PublishPhotoUploadSection({
  title,
  hint,
  tip,
  imageUrls,
  onAdd,
  uploading,
  onRemove,
  maxPhotos = MAX_LISTING_PHOTOS,
  horizontalInset,
}: Props) {
  const { t } = useTranslation();
  const isEmpty = imageUrls.length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>

      {isEmpty ? (
        <Pressable
          style={({ pressed }) => [styles.tapZone, pressed && styles.tapZonePressed]}
          onPress={onAdd}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={t('screens.publish.tapToUpload')}
        >
          {uploading ? (
            <ActivityIndicator color={colors.brand2} size="large" />
          ) : (
            <>
              <View style={styles.tapIconCircle}>
                <AppIcon name="camera" size={28} color={colors.brand2} />
              </View>
              <Text style={styles.tapTitle}>{t('screens.publish.tapToUpload')}</Text>
              <Text style={styles.tapSub}>{t('screens.publish.tapToUploadSub')}</Text>
            </>
          )}
        </Pressable>
      ) : (
        <PhotoUploadGrid
          imageUrls={imageUrls}
          onAdd={onAdd}
          onRemove={onRemove}
          uploading={uploading}
          maxPhotos={maxPhotos}
          horizontalInset={horizontalInset}
        />
      )}

      {tip ? <Text style={styles.tip}>{tip}</Text> : null}
    </View>
  );
}

const PUBLISH_UPLOAD_BORDER = '#C4BAB0';

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PUBLISH_UPLOAD_BORDER,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.paper,
  },
  title: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    marginBottom: 4,
    color: colors.text,
  },
  hint: {
    color: colors.sub,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  tapZone: {
    minHeight: 148,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 8,
  },
  tapZonePressed: {
    opacity: 0.88,
    backgroundColor: '#FFF5CC',
  },
  tapIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tapTitle: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  tapSub: {
    fontSize: 12,
    color: colors.sub,
    textAlign: 'center',
    lineHeight: 17,
  },
  tip: {
    marginTop: 14,
    color: '#987b45',
    fontSize: 12,
    lineHeight: 17,
  },
});
