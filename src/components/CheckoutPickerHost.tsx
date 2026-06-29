import React from 'react';
import { useApp } from '../context/AppContext';
import { useCheckoutPicker } from '../context/CheckoutPickerContext';
import { CouponSheet } from './CouponSheet';
import { PaymentMethodSheet } from './PaymentMethodSheet';

/** Renders checkout pickers at app shell level (same layer as RegionSheet) for reliable Android modals. */
export function CheckoutPickerHost() {
  const { paymentMethods, paymentMethodId, selectPaymentMethodById } = useApp();
  const {
    coupons,
    selectedCouponId,
    setSelectedCouponId,
    paymentPickerVisible,
    couponPickerVisible,
    paymentPickerLoading,
    couponPickerLoading,
    closePaymentPicker,
    closeCouponPicker,
  } = useCheckoutPicker();

  return (
    <>
      <PaymentMethodSheet
        visible={paymentPickerVisible}
        onClose={closePaymentPicker}
        methods={paymentMethods}
        selectedId={paymentMethodId}
        onSelect={(id) => void selectPaymentMethodById(id)}
        loading={paymentPickerLoading}
      />
      <CouponSheet
        visible={couponPickerVisible}
        onClose={closeCouponPicker}
        coupons={coupons}
        selectedId={selectedCouponId}
        onSelect={setSelectedCouponId}
        loading={couponPickerLoading}
      />
    </>
  );
}
