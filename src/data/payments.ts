import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaymentMethodDto } from '../api/types';

const SELECTED_PAYMENT_KEY = 'selectedPaymentMethodId';

const MOCK_PAYMENT_METHODS: PaymentMethodDto[] = [
  {
    id: 'demo-card',
    type: 'card',
    label: 'Visa / Mastercard',
    last4: '0826',
    isDefault: true,
  },
  {
    id: 'demo-apple',
    type: 'apple_pay',
    label: 'Apple Pay',
    isDefault: false,
  },
];

export function mockPaymentMethods(): PaymentMethodDto[] {
  return MOCK_PAYMENT_METHODS;
}

export async function loadSelectedPaymentMethodId(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(SELECTED_PAYMENT_KEY);
  return raw ?? MOCK_PAYMENT_METHODS.find((m) => m.isDefault)?.id;
}

export async function saveSelectedPaymentMethodId(id: string) {
  await AsyncStorage.setItem(SELECTED_PAYMENT_KEY, id);
}

export const DELIVERY_OPTION_KEYS = [
  'screens.order.pickup',
  'screens.order.express',
] as const;
