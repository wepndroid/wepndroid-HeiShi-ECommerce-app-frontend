import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import type { Product, OrderFilterKey, UiOrder } from '../types';
import { listSalesOrders, releaseSalesOrder, shipSalesOrder } from '../services/ordersService';

export function useSellerOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
  authReady: boolean,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
) {
  const [orders, setOrders] = React.useState<UiOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const productsRef = React.useRef(products);
  productsRef.current = products;
  const resolveTitleRef = React.useRef(resolveTitle);
  resolveTitleRef.current = resolveTitle;
  const resolveSellerRef = React.useRef(resolveSeller);
  resolveSellerRef.current = resolveSeller;

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    listSalesOrders(
      filter,
      isLoggedIn,
      productsRef.current,
      resolveTitleRef.current,
      resolveSellerRef.current,
    )
      .then(setOrders)
      .catch(() => {
        setOrders([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [authReady, filter, isLoggedIn, i18n.language]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const shipOrder = React.useCallback(
    async (order: UiOrder) => {
      const nextStatus = await shipSalesOrder(order, isLoggedIn);
      refresh();
      return nextStatus;
    },
    [isLoggedIn, refresh],
  );

  const releaseOrder = React.useCallback(
    async (order: UiOrder) => {
      const nextStatus = await releaseSalesOrder(order, isLoggedIn);
      refresh();
      return nextStatus;
    },
    [isLoggedIn, refresh],
  );

  return { orders, loading, error, refresh, shipOrder, releaseOrder };
}
