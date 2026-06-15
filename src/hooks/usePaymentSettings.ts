import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { PaymentMethodDto, PayoutMethodDto } from '../api/types';
import { listPaymentMethods } from '../services/paymentsService';
import { listPayoutMethods } from '../services/userService';

export function usePaymentMethodsSettings(isLoggedIn: boolean, authReady: boolean) {
  const [methods, setMethods] = React.useState<PaymentMethodDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listPaymentMethods(isLoggedIn)
      .then(setMethods)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { methods, loading, refresh };
}

export function usePayoutMethods(isLoggedIn: boolean, authReady: boolean) {
  const [methods, setMethods] = React.useState<PayoutMethodDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listPayoutMethods(isLoggedIn)
      .then(setMethods)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { methods, loading, refresh };
}
