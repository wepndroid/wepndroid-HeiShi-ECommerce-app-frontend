import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import type { PaymentMethodDto } from '../api/types';

const SELECTED_PAYMENT_KEY = 'selectedPaymentMethodId';

export function mockPaymentMethods(): PaymentMethodDto[] {
  return [
    {
      id: 'demo-card',
      type: 'card',
      label: i18n.t('payments.card'),
      last4: '0826',
      isDefault: true,
    },
    {
      id: 'demo-apple',
      type: 'apple_pay',
      label: i18n.t('payments.applePay'),
      isDefault: false,
    },
  ];
}

export async function loadSelectedPaymentMethodId(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(SELECTED_PAYMENT_KEY);
  const methods = mockPaymentMethods();
  return raw ?? methods.find((m) => m.isDefault)?.id;
}

export async function saveSelectedPaymentMethodId(id: string) {
  await AsyncStorage.setItem(SELECTED_PAYMENT_KEY, id);
}

export const DELIVERY_OPTION_KEYS = [
  'screens.order.pickup',
  'screens.order.express',
] as const;
