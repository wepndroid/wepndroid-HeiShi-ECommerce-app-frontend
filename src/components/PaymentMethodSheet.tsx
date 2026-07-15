import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PaymentMethodDto } from '../api/types';
import { AppIcon, type AppIconName } from './AppIcon';
import { ListIcon } from './FormUI';
import { DismissibleModal, EmptyState, LoadingState, PillButton } from './UI';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

function paymentIconName(type: PaymentMethodDto['type']): AppIconName {
  if (type === 'apple_pay') return 'apple';
  if (type === 'google_pay') return 'pay';
  if (type === 'paypal') return 'paypal';
  if (type === 'alipay') return 'alipay';
  if (type === 'wechat_pay') return 'wechat';
  return 'card';
}

function paymentSubtitle(
  method: PaymentMethodDto,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  if (method.subtitle) return method.subtitle;
  if (method.last4) return `**** ${method.last4}`;
  if (method.checkoutOnly) return t('screens.order.checkoutOnly', { defaultValue: 'Chosen during checkout' });
  return t('common.notBound');
}

export function PaymentMethodSheet({
  visible,
  onClose,
  methods,
  selectedId,
  onSelect,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  methods: PaymentMethodDto[];
  selectedId?: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const [pendingId, setPendingId] = useState<string | undefined>(selectedId);
  const savedMethods = methods.filter((method) => !method.checkoutOnly);
  const checkoutMethods = methods.filter((method) => method.checkoutOnly);

  useEffect(() => {
    if (!visible) return;
    setPendingId(selectedId ?? methods[0]?.id);
  }, [visible, selectedId, methods]);

  const handleDone = () => {
    if (pendingId) onSelect(pendingId);
    onClose();
  };

  const openPaymentSettings = () => {
    onClose();
    router.push('/settings/payment');
  };

  return (
    <DismissibleModal visible={visible} onClose={onClose} animationType="slide" placement="bottom">
      <View style={styles.sheet}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headTitle}>{t('screens.order.paymentPickerTitle')}</Text>
            <Text style={styles.headSub}>{t('screens.order.paymentPickerSub')}</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState />
        ) : methods.length ? (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {savedMethods.length ? (
              <>
                <Text style={styles.sectionTitle}>
                  {t('screens.order.savedCardsTitle', { defaultValue: 'Saved cards' })}
                </Text>
                {savedMethods.map((method) => {
                  const active = method.id === pendingId;
                  return (
                    <Pressable
                      key={method.id}
                      style={[styles.option, active && styles.optionActive]}
                      onPress={() => setPendingId(method.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <ListIcon name={paymentIconName(method.type)} />
                      <View style={styles.optionBody}>
                        <Text style={styles.optionTitle} numberOfLines={1}>
                          {method.label}
                        </Text>
                        <Text style={styles.optionSub} numberOfLines={2}>
                          {paymentSubtitle(method, t)}
                        </Text>
                      </View>
                      {method.isDefault ? (
                        <Text style={styles.defaultBadge}>{t('screens.paymentSettings.default')}</Text>
                      ) : null}
                      {active ? <AppIcon name="check" size={18} color={colors.text} /> : null}
                    </Pressable>
                  );
                })}
              </>
            ) : null}
            {checkoutMethods.length ? (
              <>
                <Text style={[styles.sectionTitle, savedMethods.length ? styles.sectionTitleSpaced : null]}>
                  {t('screens.order.checkoutMethodsTitle', { defaultValue: 'Checkout methods' })}
                </Text>
                {checkoutMethods.map((method) => {
                  const active = method.id === pendingId;
                  const disabled = method.disabled === true;
                  return (
                    <Pressable
                      key={method.id}
                      style={[styles.option, active && styles.optionActive, disabled && styles.optionDisabled]}
                      onPress={() => setPendingId(method.id)}
                      disabled={disabled}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active, disabled }}
                    >
                      <ListIcon name={paymentIconName(method.type)} />
                      <View style={styles.optionBody}>
                        <Text style={styles.optionTitle} numberOfLines={1}>
                          {method.label}
                        </Text>
                        <Text style={styles.optionSub} numberOfLines={2}>
                          {paymentSubtitle(method, t)}
                        </Text>
                      </View>
                      {active ? <AppIcon name="check" size={18} color={colors.text} /> : null}
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </ScrollView>
        ) : (
          <EmptyState text={t('screens.order.paymentEmpty')} />
        )}

        {methods.length ? (
          <PillButton label={t('common.done')} variant="brand" full onPress={handleDone} />
        ) : (
          <PillButton
            label={t('screens.paymentSettings.add')}
            variant="brand"
            full
            onPress={openPaymentSettings}
          />
        )}

        {methods.length ? (
          <Pressable style={styles.manageLink} onPress={openPaymentSettings} accessibilityRole="button">
            <Text style={styles.manageLinkText}>{t('screens.order.managePayments')}</Text>
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
    maxHeight: '100%',
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: colors.sub,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitleSpaced: {
    marginTop: 8,
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
  optionDisabled: {
    opacity: 0.45,
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
  defaultBadge: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: colors.green,
    marginRight: 4,
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
