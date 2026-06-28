import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import { countSellerPendingShipOrders } from '../services/ordersService';

export function useSellerPendingShipCount(isLoggedIn: boolean, authReady: boolean) {
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    if (!authReady || !isLoggedIn) {
      setCount(0);
      return;
    }
    void countSellerPendingShipOrders(true).then(setCount);
  }, [authReady, isLoggedIn, i18n.language]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return count;
}
