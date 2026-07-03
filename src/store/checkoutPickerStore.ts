import { create } from 'zustand';
import type { CouponDto } from '../api/types';
import { listCoupons } from '../services/couponsService';
import { useAuthStore } from './authStore';
import { useCheckoutStore } from './checkoutStore';

// Payment/coupon picker modal state for the checkout screen. Replaces the old
// CheckoutPickerContext; opening a picker lazily loads its options.
interface CheckoutPickerState {
  coupons: CouponDto[];
  selectedCouponId: string | null;
  paymentPickerVisible: boolean;
  couponPickerVisible: boolean;
  paymentPickerLoading: boolean;
  couponPickerLoading: boolean;
  setSelectedCouponId: (id: string | null) => void;
  setCoupons: (coupons: CouponDto[]) => void;
  openPaymentPicker: () => void;
  openCouponPicker: () => void;
  closePaymentPicker: () => void;
  closeCouponPicker: () => void;
}

export const useCheckoutPickerStore = create<CheckoutPickerState>((set) => ({
  coupons: [],
  selectedCouponId: null,
  paymentPickerVisible: false,
  couponPickerVisible: false,
  paymentPickerLoading: false,
  couponPickerLoading: false,
  setSelectedCouponId: (id) => set({ selectedCouponId: id }),
  setCoupons: (coupons) => set({ coupons }),
  openPaymentPicker: () => {
    set({ paymentPickerVisible: true, paymentPickerLoading: true });
    void useCheckoutStore
      .getState()
      .refreshPaymentMethods()
      .finally(() => set({ paymentPickerLoading: false }));
  },
  openCouponPicker: () => {
    set({ couponPickerVisible: true, couponPickerLoading: true });
    void listCoupons(useAuthStore.getState().user != null)
      .then((coupons) => set({ coupons }))
      .finally(() => set({ couponPickerLoading: false }));
  },
  closePaymentPicker: () => set({ paymentPickerVisible: false }),
  closeCouponPicker: () => set({ couponPickerVisible: false }),
}));
