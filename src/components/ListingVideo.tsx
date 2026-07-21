import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

export function ListingVideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });
  return (
    <VideoView
      player={player}
      style={styles.player}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

type UploadProps = {
  videoUrl?: string;
  uploading?: boolean;
  uploadProgress?: number;
  onAdd: () => void;
  onRemove: () => void;
};

export function ListingVideoUpload({
  videoUrl,
  uploading,
  uploadProgress = 0,
  onAdd,
  onRemove,
}: UploadProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.uploadCard}>
      <Text style={styles.title}>{t('screens.uploadProduct.videoTitle')}</Text>
      <Text style={styles.hint}>{t('screens.uploadProduct.videoHint')}</Text>
      {videoUrl ? (
        <View style={styles.videoWrap}>
          <ListingVideoPlayer url={videoUrl} />
          <Pressable
            style={styles.remove}
            onPress={onRemove}
            accessibilityLabel={t('screens.uploadProduct.removeVideo')}
          >
            <AppIcon name="trash" size={14} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          onPress={onAdd}
          disabled={uploading}
          accessibilityRole="button"
        >
          {uploading ? (
            <>
              <ActivityIndicator color={colors.brand2} />
              <Text style={styles.addLabel}>{Math.round(uploadProgress * 100)}%</Text>
            </>
          ) : (
            <>
              <AppIcon name="video" size={24} color={colors.brand2} />
              <Text style={styles.addLabel}>{t('screens.uploadProduct.addVideo')}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4BAB0',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.paper,
  },
  title: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    color: colors.sub,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  add: {
    minHeight: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPressed: {
    opacity: 0.88,
  },
  addLabel: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
    fontSize: 13,
  },
  videoWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: '#000',
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
