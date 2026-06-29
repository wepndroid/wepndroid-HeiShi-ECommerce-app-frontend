import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CouponDto } from '../api/types';
import { AppIcon } from './AppIcon';
import { ListIcon } from './FormUI';
import { DismissibleModal, EmptyState, LoadingState, PillButton } from './UI';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

function formatCouponExpiry(iso: string, language: string): string {
  try {
    return new Date(iso).toLocaleDateString(language.startsWith('zh') ? 'zh-CN' : 'en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function CouponSheet({
  visible,
  onClose,
  coupons,
  selectedId,
  onSelect,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  coupons: CouponDto[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const available = coupons.filter((row) => row.status === 'available');
  const [pendingId, setPendingId] = useState<string | null>(selectedId);

  useEffect(() => {
    if (!visible) return;
    setPendingId(selectedId);
  }, [visible, selectedId]);

  const handleDone = () => {
    onSelect(pendingId);
    onClose();
  };

  const openCouponsWallet = () => {
    onClose();
    router.push('/profile/coupons');
  };

  return (
    <DismissibleModal visible={visible} onClose={onClose} animationType="slide" placement="bottom">
      <View style={styles.sheet}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headTitle}>{t('screens.order.couponPickerTitle')}</Text>
            <Text style={styles.headSub}>{t('screens.order.couponPickerSub')}</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState />
        ) : available.length ? (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Pressable
              style={[styles.option, pendingId === null && styles.optionActive]}
              onPress={() => setPendingId(null)}
              accessibilityRole="radio"
              accessibilityState={{ selected: pendingId === null }}
            >
              <ListIcon name="coupon" />
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle} numberOfLines={1}>
                  {t('screens.order.couponNone')}
                </Text>
                <Text style={styles.optionSub} numberOfLines={1}>
                  {t('screens.order.couponNoneSub')}
                </Text>
              </View>
              {pendingId === null ? <AppIcon name="check" size={18} color={colors.text} /> : null}
            </Pressable>
            {available.map((coupon) => {
              const active = coupon.id === pendingId;
              const expiryLabel = coupon.expiresAt
                ? t('screens.coupons.expiresBy', {
                    date: formatCouponExpiry(coupon.expiresAt, i18n.language),
                  })
                : undefined;
              return (
                <Pressable
                  key={coupon.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setPendingId(coupon.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <ListIcon name="coupon" />
                  <View style={styles.optionBody}>
                    <Text style={styles.optionTitle} numberOfLines={1}>
                      {t('common.currencyPrefix')}
                      {coupon.amount} · {coupon.description}
                    </Text>
                    <Text style={styles.optionSub} numberOfLines={2}>
                      {expiryLabel ?? t('screens.coupons.cardHint')}
                    </Text>
                  </View>
                  {active ? <AppIcon name="check" size={18} color={colors.text} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState text={t('screens.order.couponEmpty')} />
        )}

        {available.length ? (
          <PillButton label={t('common.done')} variant="brand" full onPress={handleDone} />
        ) : (
          <PillButton
            label={t('screens.order.viewCoupons')}
            variant="brand"
            full
            onPress={openCouponsWallet}
          />
        )}

        {available.length ? (
          <Pressable style={styles.manageLink} onPress={openCouponsWallet} accessibilityRole="button">
            <Text style={styles.manageLinkText}>{t('screens.order.manageCoupons')}</Text>
          </Pressable>
        ) : null}
      </View>
    </DismissibleModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  headTitle: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  headSub: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f6f6f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  list: {
    maxHeight: 360,
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 8,
    backgroundColor: colors.paper,
  },
  optionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand3,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  optionSub: {
    fontSize: 12,
    color: colors.sub,
    marginTop: 3,
  },
  manageLink: {
    alignItems: 'center',
    paddingTop: 12,
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.sub,
  },
});
