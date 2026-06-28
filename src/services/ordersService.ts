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

export type CheckoutResult = { order: UiOrder; paid: boolean; payFailed?: boolean };

const CHAT_ORDER_STATUSES = new Set([
  'pendingPay',
  'pendingShip',
  'pendingReceive',
  'pendingReview',
  'completed',
]);

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

async function syncPendingPayOrder(
  orderId: number,
  deliveryMethod: string,
  paymentMethodId?: string,
  couponId?: string | null,
): Promise<UiOrder> {
  const dto = await ordersApi.update(orderId, {
    deliveryMethod,
    paymentMethodId,
    ...(couponId !== undefined ? { couponId } : {}),
  });
  return mapOrderDtoToUiOrder(dto);
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
      const mapped = items.map(mapOrderDtoToUiOrder);
      if (filter === 'all') return mapped;
      return mapped.filter((item) => item.status !== 'cancelled');
    } catch {
      throw new Error('orders_load_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
    return listLocalOrders(filter, products, resolveTitle, resolveSeller);
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

async function resumePendingPayOrder(
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
      return mapped.filter((item) => item.status !== 'cancelled');
    } catch {
      throw new Error('sales_orders_load_failed');
    }
  }
  return [];
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

export async function findPendingPayOrder(
  listingId: number,
  isLoggedIn: boolean,
  bundleItemId?: string,
): Promise<UiOrder | null> {
  if (!isLoggedIn) return null;
  return resumePendingPayOrder(listingId, bundleItemId);
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
    try {
      const existing = await findPendingPayOrder(input.listingId, true, input.bundleItemId);
      if (existing) {
        const synced = await syncPendingPayOrder(
          existing.id,
          input.deliveryMethod,
          input.paymentMethodId,
          input.couponId ?? null,
        );
        if (!input.paymentMethodId) {
          invalidateCatalog();
          return { order: synced, paid: false };
        }
        try {
          const paid = await ordersApi.pay(synced.id);
          invalidateCatalog();
          return { order: mapOrderDtoToUiOrder(paid), paid: true };
        } catch {
          invalidateCatalog();
          return { order: synced, paid: false, payFailed: true };
        }
      }
      const created = await ordersApi.create(body);
      if (!input.paymentMethodId) {
        invalidateCatalog();
        return { order: mapOrderDtoToUiOrder(created), paid: false };
      }
      try {
        const paid = await ordersApi.pay(created.id);
        invalidateCatalog();
        return { order: mapOrderDtoToUiOrder(paid), paid: true };
      } catch {
        invalidateCatalog();
        return { order: mapOrderDtoToUiOrder(created), paid: false, payFailed: true };
      }
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.code === 'LISTING_RESERVED'
      ) {
        const resumed = await resumePendingPayOrder(input.listingId, input.bundleItemId);
        if (resumed) {
          const synced = await syncPendingPayOrder(
            resumed.id,
            input.deliveryMethod,
            input.paymentMethodId,
            input.couponId ?? null,
          );
          if (!input.paymentMethodId) {
            invalidateCatalog();
            return { order: synced, paid: false };
          }
          try {
            const paid = await ordersApi.pay(synced.id);
            invalidateCatalog();
            return { order: mapOrderDtoToUiOrder(paid), paid: true };
          } catch {
            invalidateCatalog();
            return { order: synced, paid: false, payFailed: true };
          }
        }
      }
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
    case 'pendingPay':
      return 'pay';
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
