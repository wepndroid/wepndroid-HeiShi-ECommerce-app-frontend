import { DemoOrder, OrderFilterKey } from '../types';

export const ORDER_FILTERS: OrderFilterKey[] = [
  'all',
  'pendingShip',
  'pendingReceive',
  'pendingReview',
  'inDispute',
  'completed',
];

export const demoOrders: DemoOrder[] = [
  { id: 1, productId: 1, status: 'pendingReceive' },
  { id: 2, productId: 2, status: 'pendingReview' },
  { id: 3, productId: 3, status: 'pendingShip' },
  { id: 4, productId: 4, status: 'pendingShip' },
  { id: 5, productId: 5, status: 'completed' },
  { id: 6, productId: 6, status: 'pendingReceive' },
  { id: 7, productId: 7, status: 'pendingService' },
  { id: 8, productId: 13, status: 'inDispute' },
  { id: 9, productId: 2, status: 'pendingPay' },
  { id: 10, productId: 6, status: 'refundInProgress' },
];

/** Seller-side demo orders (Sold screen). IDs 101+ avoid buyer demo collisions. */
export const demoSalesOrders: DemoOrder[] = [
  { id: 101, productId: 1, status: 'pendingShip' },
  { id: 102, productId: 3, status: 'pendingPay' },
  { id: 103, productId: 5, status: 'pendingReceive' },
  { id: 104, productId: 7, status: 'completed' },
];

export function filterOrders(orders: DemoOrder[], filter: OrderFilterKey): DemoOrder[] {
  if (filter === 'all') return orders;
  return orders.filter((order) => order.status === filter);
}
