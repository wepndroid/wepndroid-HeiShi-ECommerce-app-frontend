import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { useCheckoutPicker } from '../context/CheckoutPickerContext';
import { CouponSheet } from './CouponSheet';
import { PaymentMethodSheet } from './PaymentMethodSheet';

/** Renders checkout pickers at app shell level (same layer as RegionSheet) for reliable Android modals. */
export function CheckoutPickerHost() {
  const paymentMethods = useCheckoutStore((s) => s.paymentMethods);
  const paymentMethodId = useCheckoutStore((s) => s.paymentMethodId);
  const selectPaymentMethodById = useCheckoutStore((s) => s.selectPaymentMethodById);
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
