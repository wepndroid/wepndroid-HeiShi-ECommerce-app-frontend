import { ordersApi } from '../api';
import { mapOrderDtoToUiOrder } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { CreateOrderRequest, OrderDto } from '../api/types';
import {
  applyLocalOrderAction,
  createLocalOrder,
  listLocalOrders,
} from '../data/ordersLocal';
import type { OrderFilterKey, OrderStatus, Product, UiOrder } from '../types';

export type OrderAction = 'pay' | 'remindShip' | 'confirmReceive';

export async function listOrders(
  filter: OrderFilterKey,
  isLoggedIn: boolean,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
): Promise<UiOrder[]> {
  if (isLoggedIn) {
    try {
      const result = await ordersApi.list({
        status: filter === 'all' ? undefined : filter,
        pageSize: 50,
      });
      return result.items
        .filter((item) => item.status !== 'cancelled')
        .map(mapOrderDtoToUiOrder);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  return listLocalOrders(filter, products, resolveTitle, resolveSeller);
}

export async function checkoutOrder(input: {
  listingId: number;
  deliveryMethod: string;
  paymentMethodId?: string;
  product: Product;
  title: string;
  sellerName: string;
  isLoggedIn: boolean;
}): Promise<UiOrder> {
  const body: CreateOrderRequest = {
    listingId: input.listingId,
    deliveryMethod: input.deliveryMethod,
    paymentMethodId: input.paymentMethodId,
  };

  if (input.isLoggedIn) {
    try {
      const created = await ordersApi.create(body);
      const paid = await ordersApi.pay(created.id);
      return mapOrderDtoToUiOrder(paid);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('checkout_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return createLocalOrder({
      listingId: input.listingId,
      deliveryMethod: input.deliveryMethod,
      product: input.product,
      title: input.title,
      sellerName: input.sellerName,
    });
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
        case 'confirmReceive':
          dto = await ordersApi.confirmReceive(order.id);
          break;
      }
      if (dto) return mapOrderDtoToUiOrder(dto).status;
      return order.status;
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('order_action_failed');
    }
  }

  return applyLocalOrderAction(order.id, order.status, action);
}

export function orderActionForStatus(status: OrderStatus): OrderAction | null {
  switch (status) {
    case 'pendingPay':
      return 'pay';
    case 'pendingShip':
      return 'remindShip';
    case 'pendingReceive':
      return 'confirmReceive';
    default:
      return null;
  }
}
