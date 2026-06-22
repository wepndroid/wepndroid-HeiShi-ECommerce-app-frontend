import { spacing } from '../theme';

export const PHOTO_GRID_COLUMNS = 3;
export const PHOTO_GRID_GAP = 8;

/** Screen padding + dashed upload box padding (PublishScreens.uploadMain). */
export const UPLOAD_MAIN_PHOTO_INSET = spacing.screenPadding * 2 + 18 * 2;

/** Screen padding + FormCard horizontal padding. */
export const FORM_CARD_PHOTO_INSET = spacing.screenPadding * 2 + 16 * 2;

/** FormCard + item card (AmazingSurface) horizontal padding. */
export const FORM_CARD_ITEM_PHOTO_INSET = FORM_CARD_PHOTO_INSET + 12 * 2;

export function getPhotoGridThumbSize(
  windowWidth: number,
  horizontalInset: number,
  columns = PHOTO_GRID_COLUMNS,
  gap = PHOTO_GRID_GAP,
): number {
  const available = Math.max(0, windowWidth - horizontalInset);
  return Math.floor((available - gap * (columns - 1)) / columns);
}
