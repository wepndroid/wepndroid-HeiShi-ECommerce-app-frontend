import { ordersApi } from '../api';
import { ApiError } from '../api/client';
import { mapOrderDtoToUiOrder } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CreateOrderRequest, OrderDto } from '../api/types';
import {
  applyLocalOrderAction,
  createLocalOrder,
  listLocalOrders,
} from '../data/ordersLocal';
import type { OrderFilterKey, OrderStatus, Product, UiOrder } from '../types';
import { invalidateCatalog } from '../utils/catalogSync';

export type OrderAction = 'pay' | 'remindShip' | 'ship' | 'confirmReceive' | 'submitReview' | 'cancel';

export type CheckoutResult = { order: UiOrder | null; paid: boolean; payFailed?: boolean };

const CHAT_ORDER_STATUSES = new Set([
  'pendingPay',
  'pendingShip',
  'pendingReceive',
  'pendingReview',
  'completed',
]);

const BUYER_HIDDEN_STATUSES = new Set<OrderStatus>(['cancelled', 'pendingPay']);

function visibleBuyerOrders(orders: UiOrder[]): UiOrder[] {
  return orders.filter((item) => !BUYER_HIDDEN_STATUSES.has(item.status));
}

async function fetchAllOrders(
  params: Parameters<typeof ordersApi.list>[0],
): Promise<OrderDto[]> {
  const items: OrderDto[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 25) {
    const result = await ordersApi.list({ ...params, page, pageSize: 50 });
    items.push(...result.items);
    hasMore = result.hasMore;
    page += 1;
  }
  return items;
}

async function cancelUnpaidOrderSafely(orderId: number): Promise<void> {
  try {
    await ordersApi.cancel(orderId);
    invalidateCatalog();
  } catch {
    // Best-effort cleanup; stale-order expiry remains a backend fallback.
  }
}

async function findOwnPendingPayOrder(
  listingId: number,
  bundleItemId?: string,
): Promise<UiOrder | null> {
  const result = await ordersApi.list({ status: 'pendingPay', listingId, page: 1, pageSize: 10 });
  const existing = result.items.find(
    (order) =>
      order.listingId === listingId &&
      (bundleItemId ? order.bundleItemId === bundleItemId : !order.bundleItemId),
  );
  if (!existing) return null;
  return mapOrderDtoToUiOrder(existing);
}

/** Release abandoned unpaid checkout so the listing is buyable again. */
export async function clearStalePendingPayForListing(
  listingId: number,
  bundleItemId?: string,
): Promise<void> {
  const existing = await findOwnPendingPayOrder(listingId, bundleItemId);
  if (existing) {
    await cancelUnpaidOrderSafely(existing.id);
  }
}

export async function listOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
): Promise<UiOrder[]> {
  if (isLoggedIn) {
    try {
      const items = await fetchAllOrders({
        status: filter === 'all' ? undefined : filter,
      });
      const mapped = visibleBuyerOrders(items.map(mapOrderDtoToUiOrder));
      if (filter === 'all') return mapped;
      return mapped.filter((item) => item.status === filter);
    } catch {
      throw new Error('orders_load_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
    const local = await listLocalOrders(filter, products, resolveTitle, resolveSeller);
    return visibleBuyerOrders(local);
  }
  return [];
}

export async function listCompletedPurchases(isLoggedIn: boolean): Promise<UiOrder[]> {
  if (isLoggedIn) {
    try {
      const [completed, pendingReview] = await Promise.all([
        fetchAllOrders({ status: 'completed' }),
        fetchAllOrders({ status: 'pendingReview' }),
      ]);
      return [...pendingReview, ...completed].map(mapOrderDtoToUiOrder);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('orders_load_failed');
    }
  }
  return [];
}

async function fetchAllSalesOrders(
  params: Parameters<typeof ordersApi.listSales>[0],
): Promise<OrderDto[]> {
  const items: OrderDto[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 25) {
    const result = await ordersApi.listSales({ ...params, page, pageSize: 50 });
    items.push(...result.items);
    hasMore = result.hasMore;
    page += 1;
  }
  return items;
}

export async function listSalesOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
): Promise<UiOrder[]> {
  if (isLoggedIn) {
    try {
      const items = await fetchAllSalesOrders({
        status: filter === 'all' ? undefined : filter,
      });
      const mapped = items.map(mapOrderDtoToUiOrder);
      if (filter === 'all') {
        return mapped.filter((item) => item.status !== 'cancelled');
      }
      return mapped.filter((item) => item.status === filter);
    } catch {
      throw new Error('sales_orders_load_failed');
    }
  }
  return [];
}

export async function countSellerPendingShipOrders(isLoggedIn: boolean): Promise<number> {
  if (!isLoggedIn) return 0;
  try {
    const result = await ordersApi.listSales({ status: 'pendingShip', page: 1, pageSize: 1 });
    return result.total;
  } catch {
    return 0;
  }
}

export async function shipSalesOrder(order: UiOrder, isLoggedIn: boolean): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      const dto = await ordersApi.ship(order.id);
      return mapOrderDtoToUiOrder(dto).status;
    } catch {
      throw new Error('order_action_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, 'ship');
  }
  throw new Error('order_action_failed');
}

export function sellerActionForStatus(status: OrderStatus): 'ship' | 'release' | null {
  if (status === 'pendingShip') return 'ship';
  if (status === 'pendingPay') return 'release';
  return null;
}

export async function releaseSalesOrder(order: UiOrder, isLoggedIn: boolean): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      const dto = await ordersApi.sellerCancel(order.id);
      invalidateCatalog();
      return mapOrderDtoToUiOrder(dto).status;
    } catch {
      throw new Error('order_action_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, 'cancel');
  }
  throw new Error('order_action_failed');
}

export async function userCanChatOnListing(
  listingId: number,
  isLoggedIn: boolean,
): Promise<boolean | null> {
  if (!isLoggedIn) return false;
  try {
    const [buyerResult, salesResult] = await Promise.all([
      ordersApi.list({ listingId, page: 1, pageSize: 10 }),
      ordersApi.listSales({ listingId, page: 1, pageSize: 10 }),
    ]);
    return [...buyerResult.items, ...salesResult.items].some((order) =>
      CHAT_ORDER_STATUSES.has(order.status),
    );
  } catch {
    return null;
  }
}

async function createAndPayOrder(body: CreateOrderRequest): Promise<CheckoutResult> {
  await clearStalePendingPayForListing(body.listingId, body.bundleItemId);
  let created: OrderDto;
  try {
    created = await ordersApi.create(body);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 409 &&
      err.code === 'LISTING_RESERVED'
    ) {
      await clearStalePendingPayForListing(body.listingId, body.bundleItemId);
      created = await ordersApi.create(body);
    } else {
      throw err;
    }
  }
  try {
    const paid = await ordersApi.pay(created.id);
    invalidateCatalog();
    return { order: mapOrderDtoToUiOrder(paid), paid: true };
  } catch {
    await cancelUnpaidOrderSafely(created.id);
    invalidateCatalog();
    return { order: null, paid: false, payFailed: true };
  }
}

export async function checkoutOrder(input: {
  listingId: number;
  deliveryMethod: string;
  paymentMethodId?: string;
  bundleItemId?: string;
  couponId?: string;
  product: Product;
  title: string;
  sellerName: string;
  isLoggedIn: boolean;
}): Promise<CheckoutResult> {
  const body: CreateOrderRequest = {
    listingId: input.listingId,
    deliveryMethod: input.deliveryMethod,
    paymentMethodId: input.paymentMethodId,
    bundleItemId: input.bundleItemId,
    couponId: input.couponId,
  };

  if (input.isLoggedIn) {
    if (!input.paymentMethodId) {
      throw new Error('checkout_failed');
    }
    try {
      return await createAndPayOrder(body);
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) {
        if (err instanceof ApiError) throw err;
        throw new Error('checkout_failed');
      }
    }
  }

  if (API_USE_MOCK_FALLBACK && !input.isLoggedIn) {
    const order = await createLocalOrder({
      listingId: input.listingId,
      deliveryMethod: input.deliveryMethod,
      product: input.product,
      title: input.title,
      sellerName: input.sellerName,
    });
    if (!input.paymentMethodId) {
      invalidateCatalog();
      return { order, paid: false };
    }
    const nextStatus = await applyLocalOrderAction(order.id, order.status, 'pay');
    invalidateCatalog();
    return { order: { ...order, status: nextStatus }, paid: true };
  }

  throw new Error('checkout_failed');
}

export async function performOrderAction(
  order: UiOrder,
  action: OrderAction,
  isLoggedIn: boolean,
): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      let dto: OrderDto | void;
      switch (action) {
        case 'pay':
          dto = await ordersApi.pay(order.id);
          break;
        case 'remindShip':
          await ordersApi.remindShip(order.id);
          return order.status;
        case 'ship':
          dto = await ordersApi.ship(order.id);
          break;
        case 'confirmReceive':
          dto = await ordersApi.confirmReceive(order.id);
          break;
        case 'cancel':
          dto = await ordersApi.cancel(order.id);
          invalidateCatalog();
          break;
      }
      if (dto) {
        if (action === 'pay' || action === 'confirmReceive') {
          invalidateCatalog();
        }
        return mapOrderDtoToUiOrder(dto).status;
      }
      return order.status;
    } catch {
      throw new Error('order_action_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, action);
  }

  throw new Error('order_action_failed');
}

export async function cancelOrder(order: UiOrder, isLoggedIn: boolean): Promise<OrderStatus> {
  return performOrderAction(order, 'cancel', isLoggedIn);
}

export async function submitOrderReview(
  order: UiOrder,
  rating: number,
  isLoggedIn: boolean,
  comment?: string,
): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      await ordersApi.submitReview(order.id, { rating, comment });
      invalidateCatalog();
      return 'completed';
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('order_action_failed');
    }
  } else if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, 'submitReview');
  }
  throw new Error('order_action_failed');
}

export async function fetchOrderReview(orderId: number, isLoggedIn: boolean) {
  if (!isLoggedIn) throw new Error('login_required');
  return ordersApi.getReview(orderId);
}

export function orderActionForStatus(status: OrderStatus): OrderAction | null {
  switch (status) {
    case 'pendingShip':
      return 'remindShip';
    case 'pendingReceive':
      return 'confirmReceive';
    case 'pendingReview':
      return null;
    default:
      return null;
  }
}
