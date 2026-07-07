import { apiRequest } from '../client';

export type CheckoutResponse = {
  psp: string;
  paymentStatus: string;
  clientSecret?: string | null;
  checkoutUrl?: string | null;
  simulated: boolean;
};

export const checkoutApi = {
  create(body: { orderId: number; paymentMethod: 'card' | 'apple' | 'google' | 'alipay' | 'wechat' | 'paypal' }) {
    return apiRequest<CheckoutResponse>('/payments/checkout', { method: 'POST', body });
  },

  /** POST /payments/checkout/confirm — reconcile PaymentIntent status after in-app 3-D Secure */
  confirm(body: { orderId: number }) {
    return apiRequest<CheckoutResponse>('/payments/checkout/confirm', { method: 'POST', body });
  },
};
