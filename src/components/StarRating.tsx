import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './typography';
import { AppIcon } from './AppIcon';
import { colors, fonts } from '../theme';

/** Shared star size and colors across profile, reviews, and Leave Feedback. */
export const STAR_RATING_SIZE = 16;
export const STAR_RATING_FILLED = colors.red;
export const STAR_RATING_EMPTY = colors.starEmpty;

const STAR_COUNT = 5;
const STAR_GAP = 2;

export function roundRatingDisplay(value: number): number {
  return Math.round(Math.min(STAR_COUNT, Math.max(0, value)) * 100) / 100;
}

function starFillAmount(rating: number, index: number): number {
  return Math.min(1, Math.max(0, rating - index));
}

type PartialStarProps = {
  fill: number;
  size: number;
  filledColor: string;
  emptyColor: string;
};

/** One star with optional partial fill from the left (e.g. 60% red for 3.6 average). */
function PartialStar({ fill, size, filledColor, emptyColor }: PartialStarProps) {
  const clampedFill = Math.min(1, Math.max(0, fill));
  return (
    <View style={[styles.starSlot, { width: size, height: size }]}>
      <View style={StyleSheet.absoluteFill}>
        <AppIcon name="starFilled" size={size} color={emptyColor} />
      </View>
      {clampedFill > 0 ? (
        <View
          style={[
            styles.starFillClip,
            { width: size * clampedFill, height: size },
          ]}
        >
          <AppIcon name="starFilled" size={size} color={filledColor} />
        </View>
      ) : null}
    </View>
  );
}

type StarRatingProps = {
  rating: number;
  size?: number;
  showValue?: boolean;
  style?: ViewStyle;
  filledColor?: string;
  emptyColor?: string;
  valueDecimals?: number;
};

/** Read-only star row with partial fills for decimal averages. */
export function StarRating({
  rating,
  size = STAR_RATING_SIZE,
  showValue = true,
  style,
  filledColor = STAR_RATING_FILLED,
  emptyColor = STAR_RATING_EMPTY,
  valueDecimals = 1,
}: StarRatingProps) {
  const displayRating = roundRatingDisplay(rating);
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <PartialStar
          key={index}
          fill={starFillAmount(displayRating, index)}
          size={size}
          filledColor={filledColor}
          emptyColor={emptyColor}
        />
      ))}
      {showValue ? (
        <Text style={[styles.value, { color: filledColor }]}>
          {displayRating.toFixed(valueDecimals)}
        </Text>
      ) : null}
    </View>
  );
}

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  style?: ViewStyle;
  filledColor?: string;
  emptyColor?: string;
};

/** Interactive 1–5 star picker — same star shape/size/color as StarRating. */
export function StarRatingInput({
  value,
  onChange,
  size = STAR_RATING_SIZE,
  readOnly = false,
  style,
  filledColor = STAR_RATING_FILLED,
  emptyColor = STAR_RATING_EMPTY,
}: StarRatingInputProps) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const star = index + 1;
        const fill = value >= star ? 1 : 0;
        const starNode = (
          <PartialStar
            fill={fill}
            size={size}
            filledColor={filledColor}
            emptyColor={emptyColor}
          />
        );
        if (readOnly) {
          return <View key={star} style={styles.starTap}>{starNode}</View>;
        }
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            style={styles.starTap}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${star} stars`}
          >
            {starNode}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: STAR_GAP,
  },
  starSlot: {
    position: 'relative',
  },
  starFillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  starTap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: fonts.weights.bold,
  },
});
