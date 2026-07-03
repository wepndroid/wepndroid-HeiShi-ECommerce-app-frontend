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

export async function addPaymentMethod(
  type: PaymentMethodDto['type'],
  isLoggedIn: boolean,
): Promise<PaymentMethodDto> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.addPaymentMethod({ type, token: 'demo-token' });
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payment_add_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    const existing = mockPaymentMethods().find((m) => m.type === type);
    if (existing) return existing;
  }
  throw new Error('payment_add_failed');
}

export async function removePaymentMethod(methodId: string, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    try {
      await paymentsApi.removePaymentMethod(methodId);
      return;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payment_remove_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) return;
  throw new Error('payment_remove_failed');
}

export async function setDefaultPaymentMethod(methodId: string, isLoggedIn: boolean): Promise<PaymentMethodDto> {
  if (isLoggedIn) {
    try {
      return await paymentsApi.setDefaultPaymentMethod(methodId);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payment_default_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    const method = mockPaymentMethods().find((m) => m.id === methodId);
    if (method) return { ...method, isDefault: true };
  }
  throw new Error('payment_default_failed');
}
