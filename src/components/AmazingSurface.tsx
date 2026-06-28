import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { amazingStyle, amazingStyleHighlight, radius } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  highlight?: boolean;
  /** Keep drop shadow visible (uses an inner clip wrapper). */
  preserveShadow?: boolean;
};

export function AmazingSurface({
  children,
  style,
  onPress,
  highlight = true,
  preserveShadow = false,
}: Props) {
  const flat = StyleSheet.flatten(style) ?? {};
  const cornerRadius =
    typeof flat.borderRadius === 'number' ? flat.borderRadius : radius.md;

  const shellStyle = [amazingStyle, preserveShadow && styles.shadowVisible, style];

  const body = preserveShadow ? (
    <>
      {highlight ? (
        <View
          style={[
            amazingStyleHighlight,
            {
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
            },
          ]}
          pointerEvents="none"
        />
      ) : null}
      <View style={[styles.innerClip, { borderRadius: cornerRadius }]} collapsable={false}>
        {children}
      </View>
    </>
  ) : (
    <>
      {highlight ? <View style={amazingStyleHighlight} pointerEvents="none" /> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={shellStyle} onPress={onPress}>
        {body}
      </Pressable>
    );
  }

  return <View style={shellStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  shadowVisible: {
    overflow: 'visible',
  },
  innerClip: {
    width: '100%',
    overflow: 'hidden',
  },
});
