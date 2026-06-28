import React from 'react';
import { useFocusEffect } from 'expo-router';
import i18n from '../i18n';
import type { Product, OrderFilterKey, UiOrder } from '../types';
import { fetchListingsByIds } from '../services/catalogService';
import {
  listOrders,
  performOrderAction,
  orderActionForStatus,
  type OrderAction,
} from '../services/ordersService';

function listingIdsKey(rows: UiOrder[]): string {
  return [...new Set(rows.map((row) => row.listingId))].sort((a, b) => a - b).join(',');
}

export function useOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
  authReady: boolean,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
  mergeCatalogProducts?: (items: Product[]) => void,
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
  const hydratedListingIdsRef = React.useRef('');

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    listOrders(
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
    hydratedListingIdsRef.current = '';
  }, [filter, isLoggedIn]);

  React.useEffect(() => {
    if (!isLoggedIn || !mergeCatalogProducts || !orders.length) return;
    const key = listingIdsKey(orders);
    if (!key || key === hydratedListingIdsRef.current) return;
    hydratedListingIdsRef.current = key;
    const listingIds = key.split(',').map((id) => Number(id));
    void fetchListingsByIds(listingIds).then((items) => {
      if (items.length) mergeCatalogProducts(items);
    });
  }, [isLoggedIn, mergeCatalogProducts, orders]);

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
      refresh();
      return nextStatus;
    },
    [isLoggedIn, refresh],
  );

  return { orders, loading, error, refresh, runAction };
}

export function actionForStatus(status: UiOrder['status']): OrderAction | null {
  return orderActionForStatus(status);
}
