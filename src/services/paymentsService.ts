import { paymentsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { PaymentMethodDto } from '../api/types';
import {
  loadSelectedPaymentMethodId,
  mockPaymentMethods,
  saveSelectedPaymentMethodId,
} from '../data/payments';

export async function listPaymentMethods(isLoggedIn: boolean): Promise<PaymentMethodDto[]> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.listPaymentMethods();
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  if (API_USE_MOCK_FALLBACK) return mockPaymentMethods();
  return [];
}

export async function bootstrapPaymentSelection(
  methods: PaymentMethodDto[],
): Promise<PaymentMethodDto | undefined> {
  if (!methods.length) return undefined;
  const savedId = await loadSelectedPaymentMethodId();
  return methods.find((m) => m.id === savedId) ?? methods.find((m) => m.isDefault) ?? methods[0];
}

export async function selectPaymentMethod(method: PaymentMethodDto) {
  await saveSelectedPaymentMethodId(method.id);
}
