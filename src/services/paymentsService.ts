import { Linking, Platform } from 'react-native';
import { paymentsApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { PaymentMethodDto, SetupIntentDto } from '../api/types';
import i18n from '../i18n';
import {
  loadEnabledCheckoutMethodIds,
  loadSelectedPaymentMethodId,
  saveEnabledCheckoutMethodIds,
  saveSelectedPaymentMethodId,
} from '../data/payments';
import { presentNativePaymentSheet } from './stripeNative';

const VIRTUAL_NEW_CARD_ID = 'virtual:new_card';
const VIRTUAL_APPLE_PAY_ID = 'virtual:apple_pay';
const VIRTUAL_GOOGLE_PAY_ID = 'virtual:google_pay';
const VIRTUAL_PAYPAL_ID = 'virtual:paypal';
const VIRTUAL_ALIPAY_ID = 'virtual:alipay';
const VIRTUAL_WECHAT_ID = 'virtual:wechat_pay';

export async function listPaymentMethods(isLoggedIn: boolean): Promise<PaymentMethodDto[]> {
  if (isLoggedIn) {
    try {
      return (await paymentsApi.listPaymentMethods()).filter((method) => method.type === 'card');
    } catch {
      return [];
    }
  }

  return [];
}

function checkoutCardSubtitle(): string {
  return i18n.t('screens.order.cardOptionSub', {
    defaultValue: 'Enter a Visa or Mastercard securely in Stripe Checkout.',
  });
}

function checkoutApplePaySubtitle(): string {
  if (Platform.OS === 'android') {
    return i18n.t('screens.order.applePayUnavailableAndroid', {
      defaultValue: 'Unavailable on Android devices.',
    });
  }
  return i18n.t('screens.order.applePayOptionSub', {
    defaultValue: 'Opens Stripe Checkout. Apple Pay appears when this device and browser support it.',
  });
}

function checkoutGooglePaySubtitle(): string {
  return i18n.t('screens.order.googlePayOptionSub', {
    defaultValue: 'Opens the secure Google Pay wallet on a supported Android device.',
  });
}

function virtualCheckoutMethods(): PaymentMethodDto[] {
  return [
    {
      id: VIRTUAL_NEW_CARD_ID,
      type: 'card',
      label: i18n.t('screens.order.cardOption', {
        defaultValue: 'Visa / Mastercard',
      }),
      subtitle: checkoutCardSubtitle(),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
    },
    {
      id: VIRTUAL_APPLE_PAY_ID,
      type: 'apple_pay',
      label: i18n.t('payments.applePay'),
      subtitle: checkoutApplePaySubtitle(),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
      disabled: Platform.OS === 'android',
    },
    {
      id: VIRTUAL_GOOGLE_PAY_ID,
      type: 'google_pay',
      label: i18n.t('payments.googlePay'),
      subtitle: checkoutGooglePaySubtitle(),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
    },
    {
      id: VIRTUAL_PAYPAL_ID,
      type: 'paypal',
      label: i18n.t('payments.paypal'),
      subtitle: i18n.t('screens.order.paypalOptionSub', {
        defaultValue: 'Approve the payment in PayPal and return to the app.',
      }),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
    },
    {
      id: VIRTUAL_ALIPAY_ID,
      type: 'alipay',
      label: i18n.t('payments.alipay'),
      subtitle: i18n.t('screens.order.redirectOptionSub', {
        defaultValue: 'Continue in the provider checkout page and return when payment is approved.',
      }),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
    },
    {
      id: VIRTUAL_WECHAT_ID,
      type: 'wechat_pay',
      label: i18n.t('payments.wechatPay'),
      subtitle: i18n.t('screens.order.redirectOptionSub', {
        defaultValue: 'Continue in the provider checkout page and return when payment is approved.',
      }),
      checkoutOnly: true,
      removable: false,
      defaultable: false,
    },
  ];
}

export function listAvailableCheckoutMethods(): PaymentMethodDto[] {
  return virtualCheckoutMethods();
}

async function enabledCheckoutMethodIds(): Promise<string[]> {
  const stored = await loadEnabledCheckoutMethodIds();
  const availableIds = new Set(virtualCheckoutMethods().map((method) => method.id));
  if (!stored?.length) return [...availableIds];
  const filtered = stored.filter((id) => availableIds.has(id));
  return filtered.length ? filtered : [...availableIds];
}

export async function loadCheckoutMethodPreferences(): Promise<Array<PaymentMethodDto & { enabled: boolean }>> {
  const methods = virtualCheckoutMethods();
  const enabledIds = new Set(await enabledCheckoutMethodIds());
  return methods.map((method) => ({ ...method, enabled: enabledIds.has(method.id) }));
}

export async function setCheckoutMethodPreference(methodId: string, enabled: boolean): Promise<string[]> {
  const ids = new Set(await enabledCheckoutMethodIds());
  if (enabled) ids.add(methodId);
  else ids.delete(methodId);
  const next = virtualCheckoutMethods()
    .map((method) => method.id)
    .filter((id) => ids.has(id));
  await saveEnabledCheckoutMethodIds(next);
  return next;
}

export async function listCheckoutPaymentMethods(isLoggedIn: boolean): Promise<PaymentMethodDto[]> {
  const enabledIds = new Set(await enabledCheckoutMethodIds());
  const saved = enabledIds.has(VIRTUAL_NEW_CARD_ID) ? await listPaymentMethods(isLoggedIn) : [];
  const visibleCheckoutMethods = virtualCheckoutMethods().filter((method) => enabledIds.has(method.id));
  return [...saved, ...visibleCheckoutMethods];
}

export async function bootstrapPaymentSelection(
  methods: PaymentMethodDto[],
): Promise<PaymentMethodDto | undefined> {
  const selectableMethods = methods.filter((method) => !method.disabled);
  if (!selectableMethods.length) return undefined;
  const savedId = await loadSelectedPaymentMethodId();
  return selectableMethods.find((m) => m.id === savedId) ??
    selectableMethods.find((m) => m.isDefault) ??
    selectableMethods[0];
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
    publishableKey: setup.publishableKey,
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
  if (type !== 'card') {
    throw new Error('payment_method_checkout_only');
  }
  if (isLoggedIn && Platform.OS === 'web' && !API_USE_MOCK_FALLBACK) {
    throw new Error('payment_web_unsupported');
  }

  // Real card connection: SetupIntent + PaymentSheet. Wallets are not stored in settings;
  // Stripe surfaces Apple Pay / Google Pay dynamically during checkout when eligible.
  if (isLoggedIn && Platform.OS !== 'web') {
    let setup: SetupIntentDto | undefined;
    try {
      setup = await paymentsApi.createSetupIntent();
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) throw err;
    }
    if (setup && !setup.simulated && setup.publishableKey && setup.setupIntentClientSecret) {
      try {
        const methods = await saveCardWithPaymentSheet(setup);
        const card = [...methods].reverse().find((m) => m.type === 'card') ?? methods[methods.length - 1];
        if (!card) throw new Error('payment_add_failed');
        return card;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'payment_canceled') throw err;
        throw err;
      }
    }
  }

  throw new Error('payment_setup_unavailable');
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
  throw new Error('payment_default_failed');
}

export function resolveCheckoutMethodFromSelection(
  paymentMethodId?: string,
): 'card' | 'apple' | 'google' | 'alipay' | 'wechat' | 'paypal' {
  switch (paymentMethodId) {
    case VIRTUAL_APPLE_PAY_ID:
      return 'apple';
    case VIRTUAL_GOOGLE_PAY_ID:
      return 'google';
    case VIRTUAL_PAYPAL_ID:
      return 'paypal';
    case VIRTUAL_ALIPAY_ID:
      return 'alipay';
    case VIRTUAL_WECHAT_ID:
      return 'wechat';
    default:
      return 'card';
  }
}

/**
 * Connect a real bank payout via Stripe Connect Express in the system browser, then
 * return to the payout screen through the app's deep link.
 */
export async function connectBankPayout(isLoggedIn: boolean): Promise<'onboarding' | 'simulated'> {
  if (!isLoggedIn) throw new Error('login_required');
  const link = await paymentsApi.createPayoutOnboardingLink();
  if (!link.url) throw new Error('payout_add_failed');
  await Linking.openURL(link.url);
  return 'onboarding';
}

/** Reconcile Stripe Connect after the hosted browser returns to the app. */
export async function syncBankPayoutConnection(isLoggedIn: boolean): Promise<void> {
  if (!isLoggedIn) return;
  await paymentsApi.getPayoutConnectStatus();
}

/** Open PayPal-hosted seller consent; PayPal returns to the app through a deep link. */
export async function connectPayPalSeller(isLoggedIn: boolean): Promise<void> {
  if (!isLoggedIn) throw new Error('login_required');
  const link = await paymentsApi.createPayPalSellerOnboardingLink();
  if (!link.url) throw new Error('payout_add_failed');
  await Linking.openURL(link.url);
}

export async function syncPayPalSellerConnection(isLoggedIn: boolean): Promise<void> {
  if (!isLoggedIn) return;
  await paymentsApi.getPayPalSellerOnboardingStatus();
}
