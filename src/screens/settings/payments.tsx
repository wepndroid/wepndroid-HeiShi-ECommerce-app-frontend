import React from 'react';
import { Alert } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { addPaymentMethod, connectBankPayout, removePaymentMethod, setDefaultPaymentMethod } from '../../services/paymentsService';
import { addPayoutMethod, removePayoutMethod, setDefaultPayoutMethod } from '../../services/userService';
import { usePaymentMethodsSettings, usePayoutMethods } from '../../hooks/usePaymentSettings';
import type { PaymentMethodDto, PayoutMethodDto } from '../../api/types';
import { Chevron, ListCard, ListIcon, ListRow, ListRowMain, Switch, TableNote } from '../../components/FormUI';
import { PillButton } from '../../components/UI';
import { colors } from '../../theme';
import { SimplePage, styles } from './shared';

export function PaymentSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { methods, refresh } = usePaymentMethodsSettings(isLoggedIn, authReady);
  const applePayMethod = methods.find((method) => method.type === 'apple_pay');
  const applePayOn = Boolean(applePayMethod);

  const addAndRefresh = async (type: PaymentMethodDto['type']) => {
    try {
      await addPaymentMethod(type, isLoggedIn);
      toast(t('toast.paymentAdded'));
      refresh();
    } catch (err) {
      if (err instanceof Error && err.message === 'payment_canceled') return;
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handleAddPayment = () => {
    Alert.alert(t('screens.paymentSettings.addChooseTitle'), undefined, [
      { text: t('screens.paymentSettings.addCard'), onPress: () => void addAndRefresh('card') },
      { text: t('screens.paymentSettings.addPaypal'), onPress: () => void addAndRefresh('paypal') },
      { text: t('screens.paymentSettings.addGooglePay'), onPress: () => void addAndRefresh('google_pay') },
      { text: t('screens.paymentSettings.addAlipay'), onPress: () => void addAndRefresh('alipay') },
      { text: t('screens.paymentSettings.addWechatPay'), onPress: () => void addAndRefresh('wechat_pay') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleApplePayToggle = async () => {
    try {
      if (applePayOn && applePayMethod) {
        await removePaymentMethod(applePayMethod.id, isLoggedIn);
        toast(t('toast.paymentRemoved'));
      } else {
        await addPaymentMethod('apple_pay', isLoggedIn);
        toast(t('toast.paymentAdded'));
      }
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handlePaymentRowPress = (method: (typeof methods)[number]) => {
    if (method.type === 'apple_pay') return;
    Alert.alert(method.label, undefined, [
      ...(method.isDefault
        ? []
        : [
            {
              text: t('screens.paymentSettings.setDefault'),
              onPress: () => {
                void setDefaultPaymentMethod(method.id, isLoggedIn)
                  .then(() => {
                    toast(t('toast.paymentDefaultUpdated'));
                    refresh();
                  })
                  .catch(() => toast(t('toast.settingsUpdateFailed')));
              },
            },
          ]),
      {
        text: t('screens.paymentSettings.remove'),
        style: 'destructive',
        onPress: () => {
          void removePaymentMethod(method.id, isLoggedIn)
            .then(() => {
              toast(t('toast.paymentRemoved'));
              refresh();
            })
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SimplePage screenId="paymentSettings" title={t('screens.paymentSettings.title')}>
      {methods.length > 0 ? (
        <ListCard>
          {methods.map((method, index) => (
            <ListRow
              key={method.id}
              left={
                <>
                  <ListIcon name={method.type === 'apple_pay' ? 'apple' : method.type === 'paypal' ? 'paypal' : 'card'} />
                  <ListRowMain>
                    <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {method.last4 ? `**** ${method.last4}` : method.type === 'apple_pay' ? (applePayOn ? t('screens.paymentSettings.appleOn') : t('common.notBound')) : t('common.notBound')}
                    </Text>
                  </ListRowMain>
                </>
              }
              right={
                method.type === 'apple_pay' ? (
                  <Switch on={applePayOn} onToggle={() => void handleApplePayToggle()} />
                ) : method.isDefault ? (
                  <Text style={[styles.statusText, { color: colors.green }]}>{t('screens.paymentSettings.default')}</Text>
                ) : (
                  <Chevron />
                )
              }
              border={index < methods.length - 1}
              onPress={method.type === 'apple_pay' ? undefined : () => handlePaymentRowPress(method)}
            />
          ))}
        </ListCard>
      ) : null}
      <PillButton label={t('screens.paymentSettings.add')} variant="brand" full onPress={handleAddPayment} />
    </SimplePage>
  );
}

export function PayoutSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { methods, refresh } = usePayoutMethods(isLoggedIn, authReady);

  const addAndRefresh = async (type: PayoutMethodDto['type']) => {
    try {
      await addPayoutMethod(type, isLoggedIn);
      toast(t('toast.payoutAdded'));
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const connectBankAndRefresh = async () => {
    try {
      const result = await connectBankPayout(isLoggedIn);
      toast(t(result === 'onboarding' ? 'toast.payoutConnectStarted' : 'toast.payoutAdded'));
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handleAddPayout = () => {
    Alert.alert(t('screens.payoutSettings.addChooseTitle'), undefined, [
      { text: t('screens.payoutSettings.addBank'), onPress: () => void connectBankAndRefresh() },
      { text: t('screens.payoutSettings.addPaypal'), onPress: () => void addAndRefresh('paypal') },
      { text: t('screens.payoutSettings.addAlipay'), onPress: () => void addAndRefresh('alipay') },
      { text: t('screens.payoutSettings.addWechat'), onPress: () => void addAndRefresh('wechat') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handlePayoutRowPress = (method: (typeof methods)[number]) => {
    Alert.alert(method.label, undefined, [
      ...(method.isDefault
        ? []
        : [
            {
              text: t('screens.paymentSettings.setDefault'),
              onPress: () => {
                void setDefaultPayoutMethod(method.id, isLoggedIn)
                  .then(() => {
                    toast(t('toast.payoutDefaultUpdated'));
                    refresh();
                  })
                  .catch(() => toast(t('toast.settingsUpdateFailed')));
              },
            },
          ]),
      {
        text: t('screens.paymentSettings.remove'),
        style: 'destructive',
        onPress: () => {
          void removePayoutMethod(method.id, isLoggedIn)
            .then(() => {
              toast(t('toast.payoutRemoved'));
              refresh();
            })
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SimplePage screenId="payoutSettings" title={t('screens.payoutSettings.title')}>
      <TableNote>{t('screens.payoutSettings.note')}</TableNote>
      {methods.length > 0 ? (
        <ListCard>
          {methods.map((method, index) => (
            <ListRow
              key={method.id}
              left={
                <>
                  <ListIcon name={method.type === 'bank' ? 'bank' : 'paypal'} />
                  <ListRowMain>
                    <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {method.last4 ? `**** ${method.last4}` : t('common.notBound')}
                    </Text>
                  </ListRowMain>
                </>
              }
              right={
                method.isDefault ? (
                  <Text style={[styles.statusText, { color: colors.green }]}>{t('screens.paymentSettings.default')}</Text>
                ) : (
                  <Chevron />
                )
              }
              border={index < methods.length - 1}
              onPress={() => handlePayoutRowPress(method)}
            />
          ))}
        </ListCard>
      ) : null}
      <PillButton label={t('screens.payoutSettings.add')} variant="brand" full onPress={handleAddPayout} />
    </SimplePage>
  );
}
