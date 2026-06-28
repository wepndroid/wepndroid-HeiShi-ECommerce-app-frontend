import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from './typography';
import { FullScreenImageViewer } from './FullScreenImageViewer';
import { fonts, radius, detailPageTokens, colors } from '../theme';
import { AppIcon } from './AppIcon';

const HERO_HEIGHT = 310;

type Props = {
  images: string[];
  locationLabel?: string;
};

export function DetailImageGallery({ images, locationLabel }: Props) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const slides = images.length ? images : [];
  const slidesKey = slides.join('\0');

  useEffect(() => {
    setIndex(0);
  }, [slidesKey]);

  const openViewer = useCallback((slideIndex: number) => {
    setViewerStart(slideIndex);
    setViewerVisible(true);
  }, []);

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(next);
    },
    [width],
  );

  return (
    <View
      style={styles.hero}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && slides.length > 0 ? (
        <FlatList
          data={slides}
          extraData={slidesKey}
          horizontal
          pagingEnabled
          bounces={slides.length > 1}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, slideIndex) => `${slideIndex}-${uri}`}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, slideIndex) => ({
            length: width,
            offset: width * slideIndex,
            index: slideIndex,
          })}
          renderItem={({ item, index: slideIndex }) => (
            <Pressable
              style={{ width, height: HERO_HEIGHT }}
              onPress={() => openViewer(slideIndex)}
              accessibilityRole="imagebutton"
            >
              <Image
                key={item}
                source={{ uri: item }}
                style={{ width, height: HERO_HEIGHT }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          )}
        />
      ) : width > 0 ? (
        <View style={styles.placeholder}>
          <AppIcon name="camera" size={40} color={colors.sub} />
        </View>
      ) : null}

      {locationLabel ? (
        <View style={styles.loc} pointerEvents="none">
          <Text style={styles.locText}>{locationLabel}</Text>
        </View>
      ) : null}

      {slides.length > 1 ? (
        <>
          <View style={styles.dots} pointerEvents="none">
            {slides.map((uri, dotIndex) => (
              <View
                key={`${uri}-${dotIndex}`}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>
              {index + 1}/{slides.length}
            </Text>
          </View>
        </>
      ) : null}

      <FullScreenImageViewer
        visible={viewerVisible}
        images={slides}
        initialIndex={viewerStart}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    borderRadius: radius.xl,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loc: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  locText: {
    color: '#ffffff',
    fontSize: detailPageTokens.galleryMetaSize,
    fontWeight: fonts.weights.medium,
  },
  dots: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  counter: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  counterText: {
    color: '#ffffff',
    fontSize: detailPageTokens.galleryMetaSize,
    fontWeight: fonts.weights.medium,
  },
});