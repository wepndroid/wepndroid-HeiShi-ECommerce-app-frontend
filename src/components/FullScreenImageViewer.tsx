import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { DismissibleModal } from './UI';

type Props = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

export function FullScreenImageViewer({ visible, images, initialIndex = 0, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const slidesKey = images.join('\0');

  useEffect(() => {
    if (!visible) return;
    const start = Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0));
    if (start > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: start, animated: false });
      });
    }
  }, [visible, initialIndex, slidesKey, images.length]);

  if (!images.length) return null;

  return (
    <DismissibleModal
      visible={visible}
      onClose={onClose}
      animationType="fade"
      placement="fill"
      statusBarTranslucent
    >
      <View style={styles.viewer}>
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          bounces={images.length > 1}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, slideIndex) => `${slideIndex}-${uri}`}
          getItemLayout={(_, slideIndex) => ({
            length: width,
            offset: width * slideIndex,
            index: slideIndex,
          })}
          initialScrollIndex={Math.min(initialIndex, Math.max(images.length - 1, 0))}
          onScrollToIndexFailed={() => {
            listRef.current?.scrollToOffset({ offset: width * initialIndex, animated: false });
          }}
          renderItem={({ item }) => (
            <Pressable style={{ width, height }} onPress={onClose}>
              <Image
                source={{ uri: item }}
                style={styles.photo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          )}
        />
      </View>
    </DismissibleModal>
  );
}

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
