import { StyleSheet } from 'react-native';
import { colors, fonts, radius, detailPageTokens } from '../../theme';

export const styles = StyleSheet.create({
  orderScreen: {
    flex: 1,
  },
  suggestRow: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8,
  },
  suggest: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sgImg: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sgImgPhoto: {
    width: '100%',
    height: '100%',
  },
  suggestText: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  suggestSub: {
    fontSize: 10,
    color: colors.sub,
    marginTop: 2,
  },
  imageSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
  },
  imageSearchPreview: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  imageSearchMeta: {
    flex: 1,
  },
  imageSearchTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  imageSearchHint: {
    fontSize: 11,
    color: colors.sub,
    marginTop: 2,
  },
  detailShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  detailActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  detailChatBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  detailBuyBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  detailPrice: {
    fontSize: detailPageTokens.priceSize,
    color: colors.red,
    fontWeight: fonts.weights.bold,
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: detailPageTokens.titleSize,
    fontWeight: fonts.weights.bold,
    lineHeight: detailPageTokens.titleLineHeight,
    marginBottom: 6,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailDesc: {
    fontSize: detailPageTokens.bodySize,
    lineHeight: detailPageTokens.bodyLineHeight,
    color: colors.sub,
  },
  cardH3: {
    fontSize: detailPageTokens.cardHeadingSize,
    fontWeight: fonts.weights.bold,
    marginBottom: 10,
    color: colors.text,
  },
  bundleItemsFailedWrap: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bundleItemsRetryBtn: {
    alignSelf: 'center',
  },
  orderItem: {
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  orderMid: {
    flexDirection: 'row',
    gap: 10,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  orderSub: {
    marginTop: 7,
    color: '#777777',
    fontSize: 12,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listMain: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  listSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  strong: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  tableNoteShell: {
    borderRadius: radius.xl,
    padding: 12,
    marginTop: 10,
  },
  cnyHint: {
    fontSize: 12,
    color: colors.sub,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  tableNote: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
});
