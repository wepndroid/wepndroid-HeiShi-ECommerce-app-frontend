import { checkoutApi, ordersApi } from '../api';
import { Linking } from 'react-native';
import { ApiError } from '../api/client';
import { mapOrderDtoToUiOrder } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CreateOrderRequest, OrderDto, PendingReviewOrderDto } from '../api/types';
import { fetchPendingReviewOrders } from './userService';
import {
  applyLocalOrderAction,
  createLocalOrder,
  listLocalOrders,
  listLocalSalesOrders,
  updateLocalOrderAmount,
} from '../data/ordersLocal';
import type { ReviewCriteriaDto } from '../data/reviewCriteria';
import type { OrderFilterKey, OrderStatus, Product, UiOrder } from '../types';
import { invalidateCatalog } from '../utils/catalogSync';

export type OrderAction = 'pay' | 'remindShip' | 'ship' | 'confirmReceive' | 'submitReview' | 'cancel' | 'dispute';

export type CheckoutResult = {
  order: UiOrder | null;
  paid: boolean;
  payFailed?: boolean;
  pendingPayment?: boolean;
  checkoutUrl?: string | null;
};

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
      if (mapped.length > 0) {
        if (filter === 'all') return mapped;
        return mapped.filter((item) => item.status === filter);
      }
      if (!API_USE_MOCK_FALLBACK) {
        if (filter === 'all') return mapped;
        return mapped.filter((item) => item.status === filter);
      }
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('orders_load_failed');
    }
    const local = await listLocalOrders(filter, products, resolveTitle, resolveSeller);
    return visibleBuyerOrders(local);
  }

  if (API_USE_MOCK_FALLBACK) {
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
      const mapped = [...pendingReview, ...completed].map(mapOrderDtoToUiOrder);
      if (mapped.length > 0) return mapped;
      if (!API_USE_MOCK_FALLBACK) return mapped;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('orders_load_failed');
    }
  }
  if (API_USE_MOCK_FALLBACK && isLoggedIn) {
    const { products } = await import('../data/products');
    const { listLocalOrders } = await import('../data/ordersLocal');
    const all = await listLocalOrders(
      'all',
      products,
      (p) => p.apiTitle ?? String(p.id),
      (p) => p.seller,
    );
    return all.filter((o) => o.status === 'completed' || o.status === 'pendingReview');
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
  products: Product[] = [],
  resolveTitle: (product: Product) => string = (p) => p.apiTitle ?? String(p.id),
  resolveSeller: (product: Product) => string = (p) => p.seller,
): Promise<UiOrder[]> {
  if (isLoggedIn) {
    try {
      const items = await fetchAllSalesOrders({
        status: filter === 'all' ? undefined : filter,
      });
      const mapped = items.map(mapOrderDtoToUiOrder);
      const filtered =
        filter === 'all'
          ? mapped.filter((item) => item.status !== 'cancelled')
          : mapped.filter((item) => item.status === filter);
      if (filtered.length > 0) return filtered;
      if (!API_USE_MOCK_FALLBACK) return filtered;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('sales_orders_load_failed');
    }
    return listLocalSalesOrders(filter, products, resolveTitle, resolveSeller);
  }
  if (API_USE_MOCK_FALLBACK) {
    return listLocalSalesOrders(filter, products, resolveTitle, resolveSeller);
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

async function paymentMethodForCheckout(
  paymentMethodId?: string,
): Promise<'card' | 'apple' | 'google' | 'alipay' | 'wechat' | 'paypal'> {
  if (!paymentMethodId) return 'card';
  try {
    const { paymentsApi } = await import('../api');
    const methods = await paymentsApi.listPaymentMethods();
    const method = methods.find((m) => m.id === paymentMethodId);
    if (method?.type === 'paypal') return 'paypal';
    if (method?.type === 'apple_pay') return 'apple';
    if (method?.type === 'google_pay') return 'google';
    if (method?.type === 'alipay') return 'alipay';
    if (method?.type === 'wechat_pay') return 'wechat';
    return 'card';
  } catch {
    return 'card';
  }
}

async function runPaymentCheckout(orderId: number, paymentMethodId?: string) {
  const paymentMethod = await paymentMethodForCheckout(paymentMethodId);
  return checkoutApi.create({ orderId, paymentMethod });
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
    const checkout = await runPaymentCheckout(created.id, body.paymentMethodId);
    if (checkout.simulated) {
      const paid = await ordersApi.pay(created.id);
      invalidateCatalog();
      return { order: mapOrderDtoToUiOrder(paid), paid: true };
    }
    if (checkout.checkoutUrl) {
      await Linking.openURL(checkout.checkoutUrl);
    }
    invalidateCatalog();
    return {
      order: mapOrderDtoToUiOrder(created),
      paid: false,
      pendingPayment: true,
      checkoutUrl: checkout.checkoutUrl,
    };
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
      // Backend unreachable in mock dev — fall through to the local order below.
    }
  }

  if (API_USE_MOCK_FALLBACK) {
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
          {
            const checkout = await runPaymentCheckout(order.id, order.paymentMethodId);
            if (checkout.simulated) {
              dto = await ordersApi.pay(order.id);
            } else if (checkout.checkoutUrl) {
              await Linking.openURL(checkout.checkoutUrl);
              return order.status;
            } else {
              throw new Error('payment_pending');
            }
          }
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
        case 'dispute':
          dto = await ordersApi.openDispute(order.id, {
            reason: 'Buyer opened dispute from app',
            evidenceUrls: [],
          });
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
      // Backend unreachable in mock dev — apply the action to the local order instead.
      if (API_USE_MOCK_FALLBACK) return applyLocalOrderAction(order.id, order.status, action);
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
  payload: { criteria: ReviewCriteriaDto; comment: string },
  isLoggedIn: boolean,
): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      await ordersApi.submitReview(order.id, payload);
      invalidateCatalog();
      return order.status === 'pendingReview' ? 'pendingReview' : 'completed';
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

export async function listPendingReviewOrders(isLoggedIn: boolean): Promise<PendingReviewOrderDto[]> {
  return fetchPendingReviewOrders(isLoggedIn);
}

export async function openOrderDispute(
  order: UiOrder,
  reason: string,
  isLoggedIn: boolean,
  evidenceUrls: string[] = [],
): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      const dto = await ordersApi.openDispute(order.id, { reason, evidenceUrls });
      return mapOrderDtoToUiOrder(dto).status;
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) throw err;
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, 'dispute');
  }
  throw new Error('login_required');
}

export async function requestOrderRefund(
  order: UiOrder,
  reason: string,
  isLoggedIn: boolean,
  evidenceUrls: string[] = [],
): Promise<OrderStatus> {
  if (isLoggedIn) {
    try {
      const dto = await ordersApi.requestRefund(order.id, { reason, evidenceUrls });
      return mapOrderDtoToUiOrder(dto).status;
    } catch (err) {
      if (!API_USE_MOCK_FALLBACK) throw err;
    }
  }
  if (API_USE_MOCK_FALLBACK) {
    return applyLocalOrderAction(order.id, order.status, 'refund');
  }
  throw new Error('login_required');
}

export async function sellerAdjustOrderAmount(
  order: UiOrder,
  amount: number,
  isLoggedIn: boolean,
): Promise<{ status: OrderStatus; amount: number }> {
  if (!isLoggedIn) throw new Error('login_required');
  try {
    const dto = await ordersApi.sellerAdjustAmount(order.id, amount);
    const mapped = mapOrderDtoToUiOrder(dto);
    return { status: mapped.status, amount: mapped.amount };
  } catch {
    if (!API_USE_MOCK_FALLBACK) throw new Error('order_action_failed');
    await updateLocalOrderAmount(order.id, amount);
    return { status: order.status, amount };
  }
}

export function orderActionForStatus(status: OrderStatus): OrderAction | null {
  switch (status) {
    case 'pendingShip':
      return 'remindShip';
    case 'pendingReceive':
    case 'pendingService':
      return 'confirmReceive';
    case 'pendingReview':
      return null;
    default:
      return null;
  }
}
