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

export async function presentNativePaymentSheet(_config: PaymentSheetConfig): Promise<void> {
  throw new Error('stripe_not_available_on_web');
}

export async function presentNativeCheckoutPaymentSheet(
  _config: CheckoutPaymentSheetConfig,
): Promise<void> {
  throw new Error('stripe_not_available_on_web');
}

export async function handleNativeNextAction(_clientSecret: string): Promise<void> {
  throw new Error('stripe_not_available_on_web');
}
