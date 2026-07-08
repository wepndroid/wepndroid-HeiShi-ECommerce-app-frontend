import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { pickImagesFromLibrary } from '../../services/mediaPicker';
import { uploadListingImage } from '../../services/listingsService';
import { AmazingSurface } from '../../components/AmazingSurface';
import { OrderThumb } from '../../components/ProductUI';
import { DismissibleModal } from '../../components/UI';
import { colors, fonts, radius } from '../../theme';
import { OrderFilterKey, OrderStatus, Product, UiListing, UiOrder } from '../../types';

export function uiListingToProduct(listing: UiListing, sellerId?: string, sellerName?: string): Product {
  const images = listing.imageUrls?.length ? listing.imageUrls : listing.imageUrl ? [listing.imageUrl] : [];
  return {
    id: listing.id,
    price: listing.price,
    catKey: 'home',
    tagKey: listing.listingType === 'bundle' ? 'bundleSet' : listing.listingType === 'service' ? 'localService' : 'lightlyUsed',
    sellerKey: sellerId ?? '',
    seller: sellerName ?? '',
    sellerUserId: sellerId,
    loc: '',
    height: '',
    imageUrl: images[0] ?? listing.imageUrl,
    imageUrls: images,
    apiTitle: listing.title,
    listingType: listing.listingType,
    listingStatus: listing.status,
    reviewStatus: listing.reviewStatus,
    reviewNote: listing.reviewNote,
  };
}

export function listingReviewState(
  listing: Pick<UiListing, 'reviewStatus' | 'reviewNote'>,
  t: (key: string, opts?: Record<string, string>) => string,
): { badge: string; reason?: string } | null {
  if (listing.reviewStatus === 'pendingReview') {
    return {
      badge: t('screens.myListings.reviewPending'),
    };
  }
  if (listing.reviewStatus === 'rejected') {
    return {
      badge: t('common.rejected'),
      reason: listing.reviewNote
        ? t('screens.myListings.rejectionReason', { reason: listing.reviewNote })
        : t('screens.myListings.rejectedNotice'),
    };
  }
  return null;
}

export const FILTER_LABEL_KEYS: Record<
  OrderFilterKey,
  | 'screens.orders.all'
  | 'screens.orders.pendingShip'
  | 'screens.orders.pendingReceive'
  | 'screens.orders.pendingReview'
  | 'screens.orders.inDispute'
  | 'common.completed'
> = {
  all: 'screens.orders.all',
  pendingShip: 'screens.orders.pendingShip',
  pendingReceive: 'screens.orders.pendingReceive',
  pendingReview: 'screens.orders.pendingReview',
  inDispute: 'screens.orders.inDispute',
  completed: 'common.completed',
};

export function orderDisplay(
  status: OrderStatus,
  t: (key: string) => string,
): {
  statusTitle: string;
  statusSub: string;
  statusColor: string;
  secondaryLabel: string | null;
  secondaryToastKey: string;
  secondaryIsBrand: boolean;
} {
  switch (status) {
    case 'pendingShip':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitShip'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.remindShip'),
        secondaryToastKey: 'toast.reminderSent',
        secondaryIsBrand: false,
      };
    case 'pendingReceive':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.confirmReceive'),
        secondaryToastKey: 'toast.confirmReceived',
        secondaryIsBrand: true,
      };
    case 'pendingService':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitService'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.confirmReceive'),
        secondaryToastKey: 'toast.confirmReceived',
        secondaryIsBrand: true,
      };
    case 'inDispute':
      return {
        statusTitle: t('screens.orders.inDispute'),
        statusSub: t('screens.orders.disputeSub'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.disputeOpened',
        secondaryIsBrand: false,
      };
    case 'refundInProgress':
      return {
        statusTitle: t('screens.orders.refundInProgress'),
        statusSub: t('screens.orders.refundSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderActionFailed',
        secondaryIsBrand: false,
      };
    case 'pendingReview':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.orders.waitReview'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.submitReview'),
        secondaryToastKey: 'toast.reviewSubmitted',
        secondaryIsBrand: true,
      };
    case 'completed':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.orders.receiptConfirmed'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.viewReview'),
        secondaryToastKey: 'toast.viewReview',
        secondaryIsBrand: true,
      };
    case 'cancelled':
      return {
        statusTitle: t('screens.orders.cancelled'),
        statusSub: t('screens.orders.cancelledSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderCancelled',
        secondaryIsBrand: false,
      };
    default:
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitShip'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.orders.remindShip'),
        secondaryToastKey: 'toast.reminderSent',
        secondaryIsBrand: false,
      };
  }
}

export function sellerOrderDisplay(
  status: OrderStatus,
  t: (key: string) => string,
): {
  statusTitle: string;
  statusSub: string;
  statusColor: string;
  secondaryLabel: string | null;
  secondaryToastKey: string;
  secondaryIsBrand: boolean;
} {
  switch (status) {
    case 'pendingShip':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitShip'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.sold.shipNow'),
        secondaryToastKey: 'toast.shipped',
        secondaryIsBrand: true,
      };
    case 'pendingPay':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitPay'),
        statusColor: colors.brand2,
        secondaryLabel: t('screens.sold.releaseOrder'),
        secondaryToastKey: 'toast.orderReleased',
        secondaryIsBrand: false,
      };
    case 'cancelled':
      return {
        statusTitle: t('screens.orders.cancelled'),
        statusSub: t('screens.orders.cancelledSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderCancelled',
        secondaryIsBrand: false,
      };
    case 'pendingReceive':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitBuyerConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
        secondaryIsBrand: false,
      };
    case 'pendingService':
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.orders.waitService'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
        secondaryIsBrand: false,
      };
    case 'inDispute':
      return {
        statusTitle: t('screens.orders.inDispute'),
        statusSub: t('screens.orders.disputeSub'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.disputeOpened',
        secondaryIsBrand: false,
      };
    case 'refundInProgress':
      return {
        statusTitle: t('screens.orders.refundInProgress'),
        statusSub: t('screens.orders.refundSub'),
        statusColor: '#999999',
        secondaryLabel: null,
        secondaryToastKey: 'toast.orderActionFailed',
        secondaryIsBrand: false,
      };
    case 'pendingReview':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.sold.waitReview'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.submitReview'),
        secondaryToastKey: 'toast.reviewSubmitted',
        secondaryIsBrand: true,
      };
    case 'completed':
      return {
        statusTitle: t('common.completed'),
        statusSub: t('screens.sold.buyerConfirmed'),
        statusColor: '#999999',
        secondaryLabel: t('screens.orders.viewReview'),
        secondaryToastKey: 'toast.viewReview',
        secondaryIsBrand: true,
      };
    default:
      return {
        statusTitle: t('screens.orders.inProgress'),
        statusSub: t('screens.sold.waitBuyerConfirm'),
        statusColor: colors.brand2,
        secondaryLabel: null,
        secondaryToastKey: 'toast.shipped',
        secondaryIsBrand: false,
      };
  }
}

export type OrderRowDisplay = ReturnType<typeof orderDisplay>;

export function PromptModal({
  visible,
  title,
  body,
  placeholder,
  keyboardType = 'default',
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body?: string;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  if (!visible) return null;

  return (
    <DismissibleModal visible={visible} onClose={onCancel} placement="center" animationType="fade">
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>{title}</Text>
        {body ? <Text style={styles.promptBody}>{body}</Text> : null}
        <TextInput
          style={styles.promptInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={keyboardType === 'default'}
        />
        <View style={styles.promptActions}>
          <Pressable style={styles.orderBtn} onPress={onCancel}>
            <Text style={styles.orderBtnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[styles.orderBtn, styles.orderBtnYellow]}
            onPress={() => onConfirm(value.trim())}
          >
            <Text style={styles.orderBtnText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </DismissibleModal>
  );
}

const MAX_DISPUTE_EVIDENCE = 3;

export function OrderReasonModal({
  visible,
  title,
  body,
  placeholder,
  confirmLabel,
  isLoggedIn,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body?: string;
  placeholder: string;
  confirmLabel: string;
  isLoggedIn: boolean;
  onCancel: () => void;
  onConfirm: (reason: string, evidenceUrls: string[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [evidence, setEvidence] = useState<{ uri: string; mimeType?: string; fileName?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue('');
      setEvidence([]);
      setSubmitting(false);
    }
  }, [visible]);

  if (!visible) return null;

  const addEvidence = async () => {
    const remaining = MAX_DISPUTE_EVIDENCE - evidence.length;
    if (remaining <= 0) return;
    const picked = await pickImagesFromLibrary({ max: remaining });
    if (!picked.length) return;
    setEvidence((prev) => [...prev, ...picked].slice(0, MAX_DISPUTE_EVIDENCE));
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const asset of evidence) {
        const url = await uploadListingImage(asset.uri, isLoggedIn, asset.mimeType, asset.fileName);
        urls.push(url);
      }
      await onConfirm(value.trim(), urls);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DismissibleModal visible={visible} onClose={onCancel} placement="center" animationType="fade">
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>{title}</Text>
        {body ? <Text style={styles.promptBody}>{body}</Text> : null}
        <TextInput
          style={styles.promptInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          multiline
          editable={!submitting}
        />
        <Text style={styles.promptBody}>{t('screens.orders.evidenceHint')}</Text>
        <View style={styles.evidenceRow}>
          {evidence.map((asset, index) => (
            <Image key={`${asset.uri}-${index}`} source={{ uri: asset.uri }} style={styles.evidenceThumb} />
          ))}
          {evidence.length < MAX_DISPUTE_EVIDENCE ? (
            <Pressable style={styles.evidenceAdd} onPress={() => void addEvidence()} disabled={submitting}>
              <Text style={styles.evidenceAddText}>{t('screens.orders.addEvidence')}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.promptActions}>
          <Pressable style={styles.orderBtn} onPress={onCancel} disabled={submitting}>
            <Text style={styles.orderBtnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[styles.orderBtn, styles.orderBtnYellow, submitting && styles.orderBtnDisabled]}
            onPress={() => void handleConfirm()}
            disabled={submitting}
          >
            <Text style={styles.orderBtnText}>
              {submitting ? t('screens.orders.uploadingEvidence') : confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </DismissibleModal>
  );
}

export function OrderListCard({
  order,
  display,
  counterpartName,
  contactLabel,
  onOpenListing,
  onContact,
  onSecondary,
  onDispute,
  disputeLabel,
  onAdjustPrice,
  adjustPriceLabel,
  showContact = true,
}: {
  order: UiOrder;
  display: OrderRowDisplay;
  counterpartName: string;
  contactLabel: string;
  onOpenListing: () => void;
  onContact: () => void;
  onSecondary?: () => void;
  onDispute?: () => void;
  disputeLabel?: string;
  onAdjustPrice?: () => void;
  adjustPriceLabel?: string;
  showContact?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <AmazingSurface style={styles.orderItem}>
      <View style={styles.orderTop}>
        <Text style={styles.orderTopStrong}>{display.statusTitle}</Text>
        <Text style={{ color: display.statusColor, fontWeight: fonts.weights.bold }}>
          {display.statusSub}
        </Text>
      </View>
      <Pressable onPress={onOpenListing}>
        <View style={styles.orderMid}>
          <OrderThumb imageUrl={order.imageUrl} />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle} numberOfLines={2}>
              {order.title}
            </Text>
            <Text style={styles.orderSub} numberOfLines={1}>
              {counterpartName}
            </Text>
            <Text style={styles.price}>
              {t('common.currencyPrefix')}
              {order.amount}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.orderActions}>
        {showContact ? (
          <Pressable style={styles.orderBtn} onPress={onContact}>
            <Text style={styles.orderBtnText} numberOfLines={1}>
              {contactLabel}
            </Text>
          </Pressable>
        ) : null}
        {display.secondaryLabel && onSecondary ? (
          <Pressable
            style={[styles.orderBtn, display.secondaryIsBrand && styles.orderBtnYellow]}
            onPress={onSecondary}
          >
            <Text style={styles.orderBtnText} numberOfLines={1}>
              {display.secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
        {onDispute && disputeLabel ? (
          <Pressable style={styles.orderBtn} onPress={onDispute}>
            <Text style={styles.orderBtnText} numberOfLines={1}>
              {disputeLabel}
            </Text>
          </Pressable>
        ) : null}
        {onAdjustPrice && adjustPriceLabel ? (
          <Pressable style={styles.orderBtn} onPress={onAdjustPrice}>
            <Text style={styles.orderBtnText} numberOfLines={1}>
              {adjustPriceLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AmazingSurface>
  );
}

export const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 4,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.brand3,
    borderColor: colors.brand,
  },
  chipText: {
    fontWeight: fonts.weights.bold,
    color: '#555555',
    fontSize: 11,
  },
  chipTextActive: {
    color: colors.text,
  },
  orderItem: {
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTopStrong: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  orderMid: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listingTapArea: {
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  reviewPendingBadge: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: colors.brand2,
    marginTop: 4,
  },
  reviewStateBadge: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    marginTop: 4,
  },
  reviewRejectedBadge: {
    color: colors.red,
  },
  reviewStateReason: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
    color: colors.red,
  },
  orderSub: {
    marginTop: 7,
    color: '#777777',
    fontSize: 12,
  },
  price: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 16,
    marginTop: 4,
  },
  orderActions: {
    // One action per line so long labels stay fully readable (no truncation).
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  orderBtn: {
    // Each button takes two thirds of the card width, centred on its own line.
    width: '66.67%',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  orderBtnYellow: {
    backgroundColor: colors.brand,
  },
  orderBtnText: {
    fontWeight: fonts.weights.bold,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },

  promptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  promptBody: {
    fontSize: 13,
    color: colors.sub,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    color: colors.text,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  evidenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  evidenceAdd: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  evidenceAddText: {
    fontSize: 10,
    textAlign: 'center',
    color: colors.sub,
  },
  orderBtnDisabled: {
    opacity: 0.6,
  },
  cancelLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  followProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  followBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  followName: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  followSub: {
    marginTop: 5,
    color: '#888888',
    fontSize: 12,
  },
  coupon: {
    backgroundColor: '#fff4f4',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  couponMain: {
    flex: 1,
    minWidth: 0,
  },
  couponOnboarding: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  couponOnboardingTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 6,
  },
  couponOnboardingBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.sub,
    marginBottom: 8,
  },
  couponOnboardingStep: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.sub,
    marginTop: 2,
  },
  couponWalletHead: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 10,
  },
  couponAmt: {
    fontSize: 24,
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  couponSub: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
  },
  couponExpiry: {
    color: '#999999',
    fontSize: 11,
    marginTop: 4,
  },
  couponCardHint: {
    color: colors.brand2,
    fontSize: 11,
    marginTop: 6,
  },
  couponBtn: {
    borderRadius: radius.pill,
    backgroundColor: '#ef233c',
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  couponBtnUsed: {
    backgroundColor: '#ececec',
  },
  couponBtnText: {
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
  },
  couponBtnTextUsed: {
    color: '#999999',
  },
});
