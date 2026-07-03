// Checkout picker state now lives in a Zustand slice. This file keeps the
// `useCheckoutPicker` hook name as a thin facade so existing consumers work
// unchanged (no provider needed — the store is global).
export { useCheckoutPickerStore as useCheckoutPicker } from '../store/checkoutPickerStore';
