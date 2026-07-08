import React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/uiStore';
import { nav } from '../../store/navigation';
import { useAuthStore } from '../../store/authStore';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { AppIcon } from '../../components/AppIcon';
import {
  addPaymentMethod,
  connectBankPayout,
  loadCheckoutMethodPreferences,
  removePaymentMethod,
  setCheckoutMethodPreference,
  setDefaultPaymentMethod,
} from '../../services/paymentsService';
import { addPayoutMethod, removePayoutMethod, setDefaultPayoutMethod } from '../../services/userService';
import { usePaymentMethodsSettings, usePayoutMethods } from '../../hooks/usePaymentSettings';
import { useVerificationStatus } from '../../hooks/useTrustProfile';
import type { PaymentMethodDto, PayoutMethodDto } from '../../api/types';
import { PaymentMethodAddSheet } from '../../components/PaymentMethodAddSheet';
import { PayoutMethodAddSheet } from '../../components/PayoutMethodAddSheet';
import { Chevron, ListCard, ListIcon, ListRow, ListRowMain, TableNote } from '../../components/FormUI';
import { PillButton } from '../../components/UI';
import { colors } from '../../theme';
import { SimplePage, styles } from './shared';

export function PaymentSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { methods, refresh } = usePaymentMethodsSettings(isLoggedIn, authReady);
  const [addSheetVisible, setAddSheetVisible] = React.useState(false);
  const [busyType, setBusyType] = React.useState<PaymentMethodDto['type'] | null>(null);
  const [checkoutMethods, setCheckoutMethods] = React.useState<Array<PaymentMethodDto & { enabled: boolean }>>([]);
  const [togglingMethodId, setTogglingMethodId] = React.useState<string | null>(null);

  const refreshCheckoutMethods = React.useCallback(() => {
    void loadCheckoutMethodPreferences().then(setCheckoutMethods);
  }, []);

  React.useEffect(() => {
    refreshCheckoutMethods();
  }, [refreshCheckoutMethods]);

  const addAndRefresh = async (type: PaymentMethodDto['type']) => {
    try {
      await addPaymentMethod(type, isLoggedIn);
      toast(t('toast.paymentAdded'));
      refresh();
    } catch (err) {
      if (err instanceof Error && err.message === 'payment_canceled') return;
      if (
        err instanceof Error &&
        ['payment_setup_unavailable', 'payment_web_unsupported', 'stripe_not_available_on_device'].includes(err.message)
      ) {
        toast(
          t('screens.paymentSettings.cardSetupUnavailable', {
            defaultValue: 'Secure card saving is not available right now. Choose a payment method during checkout.',
          }),
        );
        return;
      }
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handleAddPayment = () => {
    if (Platform.OS === 'web') {
      toast(
        t('screens.paymentSettings.webManageHint', {
          defaultValue:
            'On web, enter a new card during checkout. Saved cards are managed through the mobile add-card flow.',
        }),
      );
      return;
    }
    setAddSheetVisible(true);
  };

  const handleAddType = async (type: PaymentMethodDto['type']) => {
    setAddSheetVisible(false);
    setBusyType(type);
    try {
      await addAndRefresh(type);
    } finally {
      setBusyType(null);
    }
  };

  const handlePaymentRowPress = (method: (typeof methods)[number]) => {
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

  const paymentTypeIcon = (type: PaymentMethodDto['type']) => {
    if (type === 'apple_pay') return 'apple';
    if (type === 'google_pay') return 'pay';
    if (type === 'paypal') return 'paypal';
    if (type === 'alipay') return 'alipay';
    if (type === 'wechat_pay') return 'wechat';
    return 'card';
  };

  const toggleCheckoutMethod = async (methodId: string, enabled: boolean) => {
    setTogglingMethodId(methodId);
    try {
      await setCheckoutMethodPreference(methodId, !enabled);
      setCheckoutMethods((current) =>
        current.map((method) =>
          method.id === methodId ? { ...method, enabled: !enabled } : method,
        ),
      );
    } finally {
      setTogglingMethodId(null);
    }
  };

  return (
    <SimplePage screenId="paymentSettings" title={t('screens.paymentSettings.title')}>
      <PaymentMethodAddSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSelect={(type) => void handleAddType(type)}
        busyType={busyType}
      />
      <TableNote>
        {t('screens.paymentSettings.checkoutVisibilitySub', {
          defaultValue:
            'Choose which payment methods appear on the payment page. Saved cards are managed below.',
        })}
      </TableNote>
      {checkoutMethods.length ? (
        <ListCard>
          {checkoutMethods.map((method, index) => (
            <ListRow
              key={method.id}
              left={
                <>
                  <ListIcon name={paymentTypeIcon(method.type)} />
                  <ListRowMain>
                    <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {method.subtitle ?? t('common.notBound')}
                    </Text>
                  </ListRowMain>
                </>
              }
              right={
                <View style={[localStyles.checkbox, method.enabled && localStyles.checkboxOn]}>
                  {method.enabled ? (
                    <AppIcon name="checkmark" size={14} color="#ffffff" />
                  ) : null}
                </View>
              }
              border={index < checkoutMethods.length - 1}
              onPress={
                togglingMethodId === method.id
                  ? undefined
                  : () => void toggleCheckoutMethod(method.id, method.enabled)
              }
            />
          ))}
        </ListCard>
      ) : null}
      {methods.length > 0 ? (
        <ListCard>
          {methods.map((method, index) => (
            <ListRow
              key={method.id}
              left={
                <>
                  <ListIcon name="card" />
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
              onPress={() => handlePaymentRowPress(method)}
            />
          ))}
        </ListCard>
      ) : null}
      <PillButton
        label={t('screens.paymentSettings.add')}
        variant="brand"
        full
        onPress={handleAddPayment}
        disabled={Boolean(busyType)}
      />
    </SimplePage>
  );
}

const localStyles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  checkboxOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
});

export function PayoutSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { methods, refresh } = usePayoutMethods(isLoggedIn, authReady);
  const { status } = useVerificationStatus(isLoggedIn, authReady);
  const [addSheetVisible, setAddSheetVisible] = React.useState(false);
  const [busyType, setBusyType] = React.useState<PayoutMethodDto['type'] | null>(null);

  const payoutTypeIcon = (type: PayoutMethodDto['type']) => {
    if (type === 'bank') return 'bank';
    if (type === 'alipay') return 'alipay';
    if (type === 'wechat') return 'wechat';
    return 'paypal';
  };

  const addProviderAndRefresh = async (
    type: Exclude<PayoutMethodDto['type'], 'bank'>,
    accountRef: string,
  ) => {
    setBusyType(type);
    try {
      await addPayoutMethod(type, isLoggedIn, accountRef);
      toast(t('toast.payoutAdded'));
      setAddSheetVisible(false);
      refresh();
    } catch (err) {
      if (err instanceof Error && err.message === 'payout_bind_required_alipay') {
        setAddSheetVisible(false);
        toast(t('screens.payoutSettings.alipayBindFirstToast'));
        nav('accountSafety');
        return;
      }
      if (err instanceof Error && err.message === 'payout_bind_required_wechat') {
        setAddSheetVisible(false);
        toast(t('screens.payoutSettings.wechatBindFirstToast'));
        nav('accountSafety');
        return;
      }
      toast(
        t(
          err instanceof Error && err.message === 'payout_validation_failed'
            ? 'screens.payoutSettings.validationFailed'
            : 'toast.settingsUpdateFailed',
        ),
      );
    } finally {
      setBusyType(null);
    }
  };

  const connectBankAndRefresh = async () => {
    setBusyType('bank');
    try {
      const result = await connectBankPayout(isLoggedIn);
      toast(t(result === 'onboarding' ? 'toast.payoutConnectStarted' : 'toast.payoutAdded'));
      setAddSheetVisible(false);
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    } finally {
      setBusyType(null);
    }
  };

  const handleAddPayout = () => {
    setAddSheetVisible(true);
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
      <PayoutMethodAddSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSubmitBank={() => void connectBankAndRefresh()}
        onSubmitProvider={(type, accountRef) => void addProviderAndRefresh(type, accountRef)}
        onRequireBinding={(type) => {
          setAddSheetVisible(false);
          toast(
            t(
              type === 'wechat'
                ? 'screens.payoutSettings.wechatBindFirstToast'
                : 'screens.payoutSettings.alipayBindFirstToast',
            ),
          );
          nav('accountSafety');
        }}
        providerBindings={{
          alipay: Boolean(status?.alipayBound),
          wechat: Boolean(status?.wechatBound),
        }}
        busyType={busyType}
      />
      <TableNote>{t('screens.payoutSettings.note')}</TableNote>
      {methods.length > 0 ? (
        <ListCard>
          {methods.map((method, index) => (
                <ListRow
                  key={method.id}
                  left={
                    <>
                      <ListIcon name={payoutTypeIcon(method.type)} />
                      <ListRowMain>
                    <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {method.accountHint ?? (method.last4 ? `**** ${method.last4}` : t('common.notBound'))}
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
      <PillButton
        label={t('screens.payoutSettings.add')}
        variant="brand"
        full
        onPress={handleAddPayout}
        disabled={Boolean(busyType)}
      />
    </SimplePage>
  );
}
