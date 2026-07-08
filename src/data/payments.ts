import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_PAYMENT_KEY = 'selectedPaymentMethodId';
const ENABLED_CHECKOUT_METHODS_KEY = 'enabledCheckoutMethodIds';

export async function loadSelectedPaymentMethodId(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(SELECTED_PAYMENT_KEY);
  return raw ?? undefined;
}

export async function saveSelectedPaymentMethodId(id: string) {
  await AsyncStorage.setItem(SELECTED_PAYMENT_KEY, id);
}

export async function loadEnabledCheckoutMethodIds(): Promise<string[] | undefined> {
  const raw = await AsyncStorage.getItem(ENABLED_CHECKOUT_METHODS_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return parsed;
    }
  } catch {
    /* ignore malformed storage */
  }
  return undefined;
}

export async function saveEnabledCheckoutMethodIds(ids: string[]) {
  await AsyncStorage.setItem(ENABLED_CHECKOUT_METHODS_KEY, JSON.stringify(ids));
}

export const DELIVERY_OPTION_KEYS = [
  'screens.order.pickup',
  'screens.order.express',
] as const;
