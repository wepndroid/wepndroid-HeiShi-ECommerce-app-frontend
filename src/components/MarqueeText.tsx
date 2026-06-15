import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

const MARQUEE_GAP = 48;
const MARQUEE_SPEED = 32;

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: ViewStyle;
  /** Scroll even when the label fits (used for readonly search hints). */
  always?: boolean;
};

/** Strip flex props so label stays on one line inside the scrolling track. */
function marqueeTextStyle(style?: StyleProp<TextStyle>): TextStyle[] {
  const flat = StyleSheet.flatten(style) ?? {};
  const {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    width,
    ...rest
  } = flat as TextStyle & ViewStyle;
  return [rest as TextStyle, styles.marqueeText];
}

export function MarqueePlaceholder({
  text,
  style,
  containerStyle,
  always = false,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const runningRef = useRef<Animated.CompositeAnimation | null>(null);
  const textStyle = useMemo(() => marqueeTextStyle(style), [style]);

  const ready = containerWidth > 0 && contentWidth > 0;
  const shouldAnimate = ready && (always || contentWidth > containerWidth);
  const loopDistance = contentWidth + MARQUEE_GAP;

  const setContainerWidthStable = useCallback((width: number) => {
    setContainerWidth((prev) => (Math.abs(prev - width) <= 1 ? prev : width));
  }, []);

  const setContentWidthStable = useCallback((width: number) => {
    setContentWidth((prev) => (Math.abs(prev - width) <= 1 ? prev : width));
  }, []);

  useEffect(() => {
    let active = true;
    runningRef.current?.stop();
    runningRef.current = null;

    if (!shouldAnimate) {
      translateX.setValue(0);
      return;
    }

    const duration = Math.max(2800, (loopDistance / MARQUEE_SPEED) * 1000);

    const runCycle = () => {
      if (!active) return;
      translateX.setValue(0);

      const cycle = Animated.timing(translateX, {
        toValue: -loopDistance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      });

      runningRef.current = cycle;
      cycle.start(({ finished }) => {
        if (finished && active) runCycle();
      });
    };

    runCycle();

    return () => {
      active = false;
      runningRef.current?.stop();
      runningRef.current = null;
    };
  }, [shouldAnimate, loopDistance, text, translateX]);

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(event) => setContainerWidthStable(event.nativeEvent.layout.width)}
    >
      <View style={styles.measureProbe} pointerEvents="none">
        <Text style={textStyle} onLayout={(event) => setContentWidthStable(event.nativeEvent.layout.width)}>
          {text}
        </Text>
      </View>

      {!shouldAnimate ? (
        <Text style={textStyle} numberOfLines={1} ellipsizeMode="clip">
          {text}
        </Text>
      ) : (
        <View style={styles.clip}>
          <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
            <Text style={textStyle}>{text}</Text>
            <View style={styles.gap} />
            <Text style={textStyle}>{text}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  measureProbe: {
    position: 'absolute',
    top: 0,
    left: -10000,
    opacity: 0,
  },
  clip: {
    overflow: 'hidden',
    width: '100%',
  },
  marqueeText: {
    flexShrink: 0,
    lineHeight: 20,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gap: {
    width: MARQUEE_GAP,
    flexShrink: 0,
  },
});
