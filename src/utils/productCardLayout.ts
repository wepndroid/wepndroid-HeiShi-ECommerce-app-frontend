import { Dimensions } from 'react-native';
import { CARD_PREVIEW_ASPECT_RATIO, spacing } from '../theme';

const FEED_COLUMN_GAP = 8;

/** Width of one masonry column on the home/category product grid. */
export function getProductCardColumnWidth(screenWidth = Dimensions.get('window').width): number {
  const contentWidth = screenWidth - spacing.screenPadding * 2;
  return Math.floor((contentWidth - FEED_COLUMN_GAP) / 2);
}

/** Explicit preview size — Android ScrollView images need pixel dimensions to paint. */
export function getProductCardImageSize(screenWidth?: number): { width: number; height: number } {
  const width = getProductCardColumnWidth(screenWidth);
  const height = Math.floor(width / CARD_PREVIEW_ASPECT_RATIO);
  return { width, height };
}