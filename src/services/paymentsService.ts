import { Linking, Platform } from 'react-native';
import { paymentsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { PaymentMethodDto, SetupIntentDto } from '../api/types';
import {
  loadSelectedPaymentMethodId,
  mockPaymentMethods,
  saveSelectedPaymentMethodId,
} from '../data/payments';
import { presentNativePaymentSheet } from './stripeNative';

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

/**
 * Present the Stripe PaymentSheet to securely collect + save a card against the user's
 * Customer (via a SetupIntent), then reconcile our DB. Card data never touches our
 * server. Throws `payment_canceled` if the user dismisses the sheet.
 */
async function saveCardWithPaymentSheet(setup: SetupIntentDto): Promise<PaymentMethodDto[]> {
  await presentNativePaymentSheet({
    merchantDisplayName: 'HeyMarket',
    customerId: setup.customerId,
    customerEphemeralKeySecret: setup.ephemeralKey,
    setupIntentClientSecret: setup.setupIntentClientSecret,
    returnURL: 'heishi://payment/return',
    allowsDelayedPaymentMethods: false,
  });
  return paymentsApi.syncPaymentMethods();
}

export async function addPaymentMethod(
  type: PaymentMethodDto['type'],
  isLoggedIn: boolean,
): Promise<PaymentMethodDto> {
  // Real card connection: SetupIntent + PaymentSheet. Only cards are tokenized/saved;
  // wallets (Apple/Google Pay) are offered inside PaymentSheet + at checkout, not stored.
  if (isLoggedIn && type === 'card' && Platform.OS === 'ios') {
    let setup: SetupIntentDto | undefined;
    try {
      setup = await paymentsApi.createSetupIntent();
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) throw err;
    }
    if (setup && !setup.simulated && setup.publishableKey && setup.setupIntentClientSecret) {
      const methods = await saveCardWithPaymentSheet(setup);
      const card = [...methods].reverse().find((m) => m.type === 'card') ?? methods[methods.length - 1];
      if (!card) throw new Error('payment_add_failed');
      return card;
    }
  }

  // Simulated / wallet path (no Stripe key, offline dev, or non-card option).
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

/**
 * Connect a real bank payout via Stripe Connect Express: open the hosted onboarding
 * flow, then poll status so the backend can materialise the bank payout row. Falls back
 * to the simulated add when Stripe is not configured. Returns whether onboarding ran.
 */
export async function connectBankPayout(isLoggedIn: boolean): Promise<'onboarding' | 'simulated'> {
  if (!isLoggedIn) throw new Error('login_required');
  let link: { url: string; simulated: boolean };
  try {
    link = await paymentsApi.createPayoutOnboardingLink();
  } catch (err) {
    if (!API_USE_MOCK_FALLBACK) throw err;
    link = { url: '', simulated: true };
  }
  if (link.simulated || !link.url) {
    // No Stripe configured — keep dev UX working with the simulated bank add.
    try {
      await paymentsApi.addPayoutMethod({ type: 'bank', accountToken: 'demo-account' });
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('payout_add_failed');
    }
    return 'simulated';
  }
  await Linking.openURL(link.url);
  // On return, sync status; the backend creates/updates the bank payout row once
  // the connected account has payouts enabled.
  try {
    await paymentsApi.getPayoutConnectStatus();
  } catch {
    /* status poll is best-effort */
  }
  return 'onboarding';
}
