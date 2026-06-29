import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { CouponDto } from '../api/types';
import { listCoupons } from '../services/couponsService';
import { useApp } from './AppContext';

type CheckoutPickerContextValue = {
  coupons: CouponDto[];
  selectedCouponId: string | null;
  setSelectedCouponId: (id: string | null) => void;
  setCoupons: (coupons: CouponDto[]) => void;
  paymentPickerVisible: boolean;
  couponPickerVisible: boolean;
  paymentPickerLoading: boolean;
  couponPickerLoading: boolean;
  openPaymentPicker: () => void;
  openCouponPicker: () => void;
  closePaymentPicker: () => void;
  closeCouponPicker: () => void;
};

const CheckoutPickerContext = createContext<CheckoutPickerContextValue | null>(null);

export function CheckoutPickerProvider({ children }: { children: React.ReactNode }) {
  const { refreshPaymentMethods, user } = useApp();
  const isLoggedIn = user != null;
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
  const [couponPickerVisible, setCouponPickerVisible] = useState(false);
  const [paymentPickerLoading, setPaymentPickerLoading] = useState(false);
  const [couponPickerLoading, setCouponPickerLoading] = useState(false);

  const openPaymentPicker = useCallback(() => {
    setPaymentPickerVisible(true);
    setPaymentPickerLoading(true);
    void refreshPaymentMethods().finally(() => setPaymentPickerLoading(false));
  }, [refreshPaymentMethods]);

  const openCouponPicker = useCallback(() => {
    setCouponPickerVisible(true);
    setCouponPickerLoading(true);
    void listCoupons(isLoggedIn)
      .then(setCoupons)
      .finally(() => setCouponPickerLoading(false));
  }, [isLoggedIn]);

  const closePaymentPicker = useCallback(() => setPaymentPickerVisible(false), []);
  const closeCouponPicker = useCallback(() => setCouponPickerVisible(false), []);

  const value = useMemo(
    () => ({
      coupons,
      selectedCouponId,
      setSelectedCouponId,
      setCoupons,
      paymentPickerVisible,
      couponPickerVisible,
      paymentPickerLoading,
      couponPickerLoading,
      openPaymentPicker,
      openCouponPicker,
      closePaymentPicker,
      closeCouponPicker,
    }),
    [
      coupons,
      selectedCouponId,
      paymentPickerVisible,
      couponPickerVisible,
      paymentPickerLoading,
      couponPickerLoading,
      openPaymentPicker,
      openCouponPicker,
      closePaymentPicker,
      closeCouponPicker,
    ],
  );

  return <CheckoutPickerContext.Provider value={value}>{children}</CheckoutPickerContext.Provider>;
}

export function useCheckoutPicker() {
  const ctx = useContext(CheckoutPickerContext);
  if (!ctx) throw new Error('useCheckoutPicker must be used within CheckoutPickerProvider');
  return ctx;
}
