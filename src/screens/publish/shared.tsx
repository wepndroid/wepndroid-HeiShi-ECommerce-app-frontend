import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { normalizeMediaUrls } from '../../utils/mediaUrls';
import {
  createBundleLineItem,
  bundleMetaToLineItems,
  type BundleLineItem,
  type BundleMeta,
} from '../../data/bundle';
import { allCityOptions } from '../../data/region';
import { FieldSelectRow, StickyActions, useStickyActionsBarInset } from '../../components/FormUI';
import { PillButton, ScreenScroll } from '../../components/UI';
import { colors, fonts, publishScreenTokens, radius, screenHorizontalInset, searchBarTokens, spacing } from '../../theme';
import { PUBLISH_HUB_ART_SIZE } from '../../assets/publishHubArt';
import type { UiListing } from '../../types';

export function toastAfterPublish(
  toast: (msg: string) => void,
  t: (key: string, opts?: Record<string, string>) => string,
  listing: UiListing | void,
  title: string,
  publishedKey = 'toast.listingPublished',
) {
  if (listing?.reviewStatus === 'pendingReview') {
    toast(t('toast.listingPendingReview', { title }));
  } else if (listing?.reviewStatus === 'rejected') {
    toast(listing.reviewNote ? listing.reviewNote : t('toast.blockedContent'));
  } else {
    toast(t(publishedKey, { title }));
  }
}

export function publishErrorToast(
  toast: (msg: string) => void,
  t: (key: string, opts?: Record<string, string>) => string,
  err: unknown,
) {
  if (err instanceof ApiError && err.code === 'BLOCKED_CONTENT') {
    const details = err.details as { keyword?: string } | undefined;
    if (details?.keyword) {
      toast(t('toast.blockedContentWithKeyword', { keyword: details.keyword }));
      return;
    }
    toast(t('toast.blockedContent'));
    return;
  }
  if (err instanceof Error) {
    if (err.message === 'identity_required') {
      toast(t('toast.identityRequiredForService'));
      return;
    }
    if (err.message === 'blocked_content') {
      toast(t('toast.blockedContent'));
      return;
    }
  }
  toast(t('toast.publishFailed'));
}

export function listingEditImageUrls(product: {
  imageUrl?: string;
  imageUrls?: string[];
}): string[] {
  const raw = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  return normalizeMediaUrls(raw);
}

export function bundleCoverUrlsForEdit(
  product: {
    imageUrl?: string;
    imageUrls?: string[];
    bundleMeta?: { coverImageUrls?: string[] } | null;
  },
): string[] {
  const fromMeta = normalizeMediaUrls(product.bundleMeta?.coverImageUrls);
  if (fromMeta.length) return fromMeta;
  return listingEditImageUrls(product);
}

export function bundleLineItemsForEdit(meta: BundleMeta | null | undefined): BundleLineItem[] {
  if (!meta?.items.length) {
    return [createBundleLineItem(), createBundleLineItem()];
  }
  const items = bundleMetaToLineItems(meta);
  if (items.length >= 2) return items;
  return [...items, ...Array.from({ length: 2 - items.length }, () => createBundleLineItem())];
}

const PUBLISH_HUB_BORDER = '#C4BAB0';

export function PublishListingCityRow({
  listingCityKey,
  onSelect,
}: {
  listingCityKey: string;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  const cityOptions = useMemo(() => allCityOptions(), []);

  return (
    <FieldSelectRow
      icon="mapPin"
      label={t('screens.publish.listingCity')}
      options={cityOptions}
      selectedKey={listingCityKey}
      onSelect={onSelect}
      placeholder={t('common.placeholders.selectOption')}
    />
  );
}

export function PublishFormShell({
  screenId,
  children,
  submitLabel,
  onSubmit,
  submitting,
  submitDisabled,
  draftLabel,
  onSaveDraft,
}: {
  screenId: 'uploadProduct' | 'publishBundle' | 'publishService';
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  submitDisabled?: boolean;
  draftLabel?: string;
  onSaveDraft?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const stickyBarInset = useStickyActionsBarInset();
  const disabled = submitting || submitDisabled;

  return (
    <View style={styles.publishShell}>
      <ScreenScroll screenId={screenId} contentBottomInset={stickyBarInset}>
        {children}
      </ScreenScroll>
      <StickyActions fixed>
        {draftLabel && onSaveDraft ? (
          <PillButton
            label={draftLabel}
            variant="light"
            full
            flex
            onPress={disabled ? undefined : () => void onSaveDraft()}
            style={[styles.publishDraftBtn, disabled ? styles.publishSubmitDisabled : undefined]}
          />
        ) : null}
        <PillButton
          label={submitting ? t('common.loading') : submitLabel}
          variant="brand"
          full
          flex
          onPress={disabled ? undefined : () => void onSubmit()}
          style={disabled ? styles.publishSubmitDisabled : undefined}
        />
      </StickyActions>
    </View>
  );
}

export const styles = StyleSheet.create({
  publishShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  publishSubmitDisabled: {
    opacity: 0.55,
  },
  publishDraftBtn: {
    marginBottom: 8,
  },
  publishHubCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PUBLISH_HUB_BORDER,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.paper,
  },
  uploadHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  publishHubArt: {
    width: PUBLISH_HUB_ART_SIZE,
    height: PUBLISH_HUB_ART_SIZE,
  },
  uploadCenter: {
    flex: 1,
    alignItems: 'center',
  },
  publishHubTitle: {
    fontSize: publishScreenTokens.hubTitleSize,
    fontWeight: fonts.weights.bold,
    marginBottom: 4,
    color: colors.text,
  },
  publishHubSub: {
    marginBottom: 10,
    color: colors.sub,
    fontSize: publishScreenTokens.hubSubSize,
  },
  publishHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  publishHubBtnText: {
    fontSize: publishScreenTokens.hubBtnSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  secondhandStickyHeader: {
    ...screenHorizontalInset,
    paddingTop: spacing.screenPadding,
    backgroundColor: colors.bg,
  },
  secondhandTabBody: {
    flex: 1,
    minHeight: 0,
  },
  secondhandTabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  secondhandTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
  },
  secondhandTabActive: {
    backgroundColor: colors.brand,
  },
  secondhandTabText: {
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    color: colors.sub,
    textAlign: 'center',
  },
  secondhandTabTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  publishOptions: {
    flexDirection: 'row',
    gap: 9,
    marginVertical: 12,
  },
  optCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 12,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  optBody: {
    flex: 1,
  },
  optTitle: {
    fontSize: publishScreenTokens.optTitleSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  optDesc: {
    marginTop: 5,
    color: '#777777',
    fontSize: publishScreenTokens.optDescSize,
  },
  optMark: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  stepIco: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  stepStrong: {
    fontSize: publishScreenTokens.stepTitleSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  stepSmall: {
    fontSize: publishScreenTokens.stepSubSize,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 11,
  },
  arrow: {
    color: '#e8a500',
    fontWeight: fonts.weights.bold,
    fontSize: publishScreenTokens.stepTitleSize,
    marginHorizontal: 2,
    marginTop: 11,
    lineHeight: 16,
  },
  itemsHeading: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    marginTop: 4,
    marginBottom: 8,
    color: colors.text,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chatMain: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatBody: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  chatMessages: {
    gap: 10,
  },
  chatLoadFailedWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  chatLoadFailedText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  bubbleWrap: {
    maxWidth: '78%',
  },
  bubbleWrapLeft: {
    alignSelf: 'flex-start',
  },
  bubbleWrapRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    paddingBottom: 7,
    borderRadius: radius.md,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.paper,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: spacing.screenBottomNoNav,
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: colors.bg,
  },
  chatInputShell: {
    flex: 1,
    minWidth: 0,
    height: searchBarTokens.height,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chatInputField: {
    width: '100%',
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
    padding: 0,
  },
  chatSend: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 4,
  },
  chatSendDisabled: {
    opacity: 0.35,
  },
  safetyMenuCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  safetyMenuTitle: {
    fontSize: 17,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  safetyMenuAction: {
    paddingVertical: 14,
  },
  safetyMenuActionText: {
    fontSize: 15,
    fontWeight: fonts.weights.medium,
    color: colors.trustText,
  },
  safetyMenuActionDestructive: {
    fontSize: 15,
    fontWeight: fonts.weights.medium,
    color: colors.red,
  },
  safetyMenuCancel: {
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  safetyMenuCancelText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
});
