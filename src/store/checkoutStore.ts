import { create } from 'zustand';
import type { PaymentMethodDto } from '../api/types';
import {
  bootstrapPaymentSelection,
  listPaymentMethods,
  selectPaymentMethod,
} from '../services/paymentsService';
import { useAuthStore } from './authStore';

// Checkout slice: selected payment method + delivery method + the bundle item
// currently being checked out. Payment-method list is cached here.
interface CheckoutState {
  paymentMethod: string;
  paymentMethodId?: string;
  paymentMethods: PaymentMethodDto[];
  deliveryMethod: string;
  checkoutBundleItemId: string | null;
  setPaymentMethod: (v: string) => void;
  setDeliveryMethod: (v: string) => void;
  setCheckoutBundleItemId: (id: string | null) => void;
  setPaymentMethods: (methods: PaymentMethodDto[]) => void;
  applyPaymentSelection: (id: string | undefined, label: string) => void;
  selectPaymentMethodById: (id: string) => Promise<void>;
  refreshPaymentMethods: () => Promise<PaymentMethodDto[]>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  paymentMethod: '',
  paymentMethodId: undefined,
  paymentMethods: [],
  deliveryMethod: '',
  checkoutBundleItemId: null,
  setPaymentMethod: (v) => set({ paymentMethod: v }),
  setDeliveryMethod: (v) => set({ deliveryMethod: v }),
  setCheckoutBundleItemId: (id) => set({ checkoutBundleItemId: id }),
  setPaymentMethods: (methods) => set({ paymentMethods: methods }),
  applyPaymentSelection: (id, label) => set({ paymentMethodId: id, paymentMethod: label }),
  selectPaymentMethodById: async (id) => {
    const method = get().paymentMethods.find((m) => m.id === id);
    if (!method) return;
    set({ paymentMethodId: method.id, paymentMethod: method.label });
    await selectPaymentMethod(method);
  },
  refreshPaymentMethods: async () => {
    if (!useAuthStore.getState().authReady) return [];
    const loggedIn = useAuthStore.getState().user != null;
    const methods = await listPaymentMethods(loggedIn);
    set({ paymentMethods: methods });
    if (!methods.length) {
      set({ paymentMethodId: undefined, paymentMethod: '' });
      return methods;
    }
    const currentId = get().paymentMethodId;
    if (currentId && methods.some((m) => m.id === currentId)) {
      const match = methods.find((m) => m.id === currentId);
      if (match) set({ paymentMethod: match.label });
      return methods;
    }
    const selected = await bootstrapPaymentSelection(methods);
    if (selected) set({ paymentMethodId: selected.id, paymentMethod: selected.label });
    return methods;
  },
  reset: () => set({ paymentMethodId: undefined, paymentMethod: '', paymentMethods: [] }),
}));
