import { DemoOrder, OrderFilterKey } from '../types';

export const ORDER_FILTERS: OrderFilterKey[] = [
  'all',
  'pendingPay',
  'pendingShip',
  'pendingReceive',
  'pendingReview',
];

export const demoOrders: DemoOrder[] = [
  { id: 1, productId: 1, status: 'pendingReceive' },
  { id: 2, productId: 2, status: 'pendingReview' },
  { id: 3, productId: 3, status: 'pendingPay' },
  { id: 4, productId: 4, status: 'pendingShip' },
  { id: 5, productId: 5, status: 'completed' },
  { id: 6, productId: 6, status: 'pendingPay' },
];

export function filterOrders(orders: DemoOrder[], filter: OrderFilterKey): DemoOrder[] {
  if (filter === 'all') return orders;
  return orders.filter((order) => order.status === filter);
}
