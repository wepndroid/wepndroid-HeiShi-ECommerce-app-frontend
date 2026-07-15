import { apiRequest } from '../client';

export type CheckoutResponse = {
  psp: string;
  paymentStatus: string;
  clientSecret?: string | null;
  checkoutUrl?: string | null;
  simulated: boolean;
  publishableKey?: string | null;
  customerId?: string | null;
  ephemeralKey?: string | null;
};

export const checkoutApi = {
  create(body: {
    orderId: number;
    paymentMethod: 'card' | 'apple' | 'google' | 'alipay' | 'wechat' | 'paypal';
    nativePaymentSheet?: boolean;
  }) {
    // Stripe creates a PaymentIntent and ephemeral key before PaymentSheet can open.
    // Emulator/test-network latency can legitimately exceed the default API timeout.
    return apiRequest<CheckoutResponse>('/payments/checkout', {
      method: 'POST',
      body,
      timeoutMs: 60_000,
    });
  },

  /** POST /payments/checkout/confirm — reconcile PaymentIntent status after in-app 3-D Secure */
  confirm(body: { orderId: number }) {
    return apiRequest<CheckoutResponse>('/payments/checkout/confirm', { method: 'POST', body });
  },
};
