import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { Product, OrderFilterKey, UiOrder } from '../types';
import {
  listOrders,
  performOrderAction,
  orderActionForStatus,
  type OrderAction,
} from '../services/ordersService';

export function useOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
  authReady: boolean,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
) {
  const [orders, setOrders] = React.useState<UiOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listOrders(filter, isLoggedIn, products, resolveTitle, resolveSeller)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [authReady, filter, isLoggedIn, products, resolveTitle, resolveSeller]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const runAction = React.useCallback(
    async (order: UiOrder) => {
      const action = orderActionForStatus(order.status);
      if (!action) return order.status;
      const nextStatus = await performOrderAction(order, action, isLoggedIn);
      setOrders((prev) =>
        prev.map((row) => (row.id === order.id ? { ...row, status: nextStatus } : row)),
      );
      return nextStatus;
    },
    [isLoggedIn],
  );

  return { orders, loading, refresh, runAction };
}

export function actionForStatus(status: UiOrder['status']): OrderAction | null {
  return orderActionForStatus(status);
}
