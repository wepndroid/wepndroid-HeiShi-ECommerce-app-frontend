type PaymentSheetConfig = {
  publishableKey: string;
  merchantDisplayName: string;
  customerId: string;
  customerEphemeralKeySecret: string;
  setupIntentClientSecret: string;
  returnURL: string;
  allowsDelayedPaymentMethods: boolean;
};

type CheckoutPaymentSheetConfig = Omit<PaymentSheetConfig, 'setupIntentClientSecret'> & {
  paymentIntentClientSecret: string;
};

type GooglePayConfig = {
  publishableKey: string;
  paymentIntentClientSecret: string;
  merchantDisplayName: string;
  merchantCountryCode: string;
  currencyCode: string;
};

function loadStripeSdk() {
  try {
    return require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
  } catch {
    return null;
  }
}

export async function presentNativePaymentSheet(config: PaymentSheetConfig): Promise<void> {
  const stripe = loadStripeSdk();
  if (!stripe) {
    throw new Error('stripe_not_available_on_device');
  }

  await stripe.initStripe({ publishableKey: config.publishableKey, urlScheme: 'heishi' });
  const initResult = await stripe.initPaymentSheet({
    merchantDisplayName: config.merchantDisplayName,
    customerId: config.customerId,
    customerEphemeralKeySecret: config.customerEphemeralKeySecret,
    setupIntentClientSecret: config.setupIntentClientSecret,
    returnURL: config.returnURL,
    allowsDelayedPaymentMethods: config.allowsDelayedPaymentMethods,
    paymentMethodOrder: ['card'],
  });

  if (initResult.error) {
    throw new Error(initResult.error.message || initResult.error.code || 'stripe_payment_sheet_init_failed');
  }

  const result = await stripe.presentPaymentSheet();
  if (result.didCancel) {
    throw new Error('payment_canceled');
  }
  if (result.error) {
    throw new Error(result.error.message || result.error.code || 'stripe_payment_sheet_failed');
  }
}

export async function presentNativeCheckoutPaymentSheet(
  config: CheckoutPaymentSheetConfig,
): Promise<void> {
  const stripe = loadStripeSdk();
  if (!stripe) throw new Error('stripe_not_available_on_device');

  await stripe.initStripe({ publishableKey: config.publishableKey, urlScheme: 'heishi' });
  const initResult = await stripe.initPaymentSheet({
    merchantDisplayName: config.merchantDisplayName,
    customerId: config.customerId,
    customerEphemeralKeySecret: config.customerEphemeralKeySecret,
    paymentIntentClientSecret: config.paymentIntentClientSecret,
    returnURL: config.returnURL,
    allowsDelayedPaymentMethods: config.allowsDelayedPaymentMethods,
    paymentMethodOrder: ['card'],
  });
  if (initResult.error) {
    throw new Error(initResult.error.message || initResult.error.code || 'stripe_payment_sheet_init_failed');
  }

  const result = await stripe.presentPaymentSheet();
  if (result.didCancel) throw new Error('payment_canceled');
  if (result.error) {
    throw new Error(result.error.message || result.error.code || 'stripe_payment_sheet_failed');
  }
}

export async function presentNativeGooglePay(config: GooglePayConfig): Promise<void> {
  const stripe = loadStripeSdk();
  if (!stripe) throw new Error('stripe_not_available_on_device');

  await stripe.initStripe({ publishableKey: config.publishableKey, urlScheme: 'heishi' });
  const testEnv = config.publishableKey.startsWith('pk_test_');
  const supported = await stripe.isPlatformPaySupported({
    googlePay: {
      testEnv,
      existingPaymentMethodRequired: true,
    },
  });
  if (!supported) throw new Error('google_pay_not_supported');

  const result = await stripe.confirmPlatformPayPayment(
    config.paymentIntentClientSecret,
    {
      googlePay: {
        testEnv,
        merchantName: config.merchantDisplayName,
        merchantCountryCode: config.merchantCountryCode,
        currencyCode: config.currencyCode,
        isEmailRequired: true,
        existingPaymentMethodRequired: true,
        billingAddressConfig: {
          isRequired: true,
          isPhoneNumberRequired: false,
          format: stripe.PlatformPay.BillingAddressFormat.Full,
        },
      },
    },
  );
  if (result.error) {
    throw new Error(result.error.message || result.error.code || 'google_pay_failed');
  }
}

export async function handleNativeNextAction(clientSecret: string): Promise<void> {
  const stripe = loadStripeSdk();
  if (!stripe) {
    throw new Error('stripe_not_available_on_device');
  }

  const result = await stripe.handleNextAction(clientSecret, 'heishi://payment/return');
  if (result.error) {
    throw new Error(result.error.message || result.error.code || 'stripe_next_action_failed');
  }
}
