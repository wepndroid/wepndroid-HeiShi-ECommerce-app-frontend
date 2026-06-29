import { apiRequest } from '../client';
import type { ReviewCriteriaDto } from '../data/reviewCriteria';
import type { CreateOrderRequest, OrderDto, OrderReviewDto, Paginated } from '../types';

export const ordersApi = {
  /** GET /orders?status= */
  list(params?: {
    status?: 'pendingPay' | 'pendingShip' | 'pendingReceive' | 'pendingReview' | 'completed' | 'all';
    listingId?: number;
    page?: number;
    pageSize?: number;
  }) {
    return apiRequest<Paginated<OrderDto>>('/orders', { query: params });
  },

  /** GET /orders/sales?status= — seller's sales */
  listSales(params?: {
    status?: 'pendingPay' | 'pendingShip' | 'pendingReceive' | 'pendingReview' | 'completed' | 'all';
    listingId?: number;
    page?: number;
    pageSize?: number;
  }) {
    return apiRequest<Paginated<OrderDto>>('/orders/sales', { query: params });
  },

  /** GET /orders/:id */
  get(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}`);
  },

  /** POST /orders */
  create(body: CreateOrderRequest) {
    return apiRequest<OrderDto>('/orders', { method: 'POST', body });
  },

  /** PATCH /orders/:id — update pendingPay delivery/payment/coupon */
  update(id: number, body: { deliveryMethod?: string; paymentMethodId?: string; couponId?: string | null }) {
    return apiRequest<OrderDto>(`/orders/${id}`, { method: 'PATCH', body });
  },

  /** POST /orders/:id/pay */
  pay(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/pay`, { method: 'POST' });
  },

  /** POST /orders/:id/remind-ship */
  remindShip(id: number) {
    return apiRequest<void>(`/orders/${id}/remind-ship`, { method: 'POST' });
  },

  /** POST /orders/:id/ship — seller marks shipped */
  ship(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/ship`, { method: 'POST' });
  },

  /** POST /orders/:id/confirm-receive */
  confirmReceive(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/confirm-receive`, { method: 'POST' });
  },

  /** POST /orders/:id/review */
  submitReview(id: number, body: { criteria: ReviewCriteriaDto; comment: string }) {
    return apiRequest<void>(`/orders/${id}/review`, { method: 'POST', body });
  },

  /** GET /orders/:id/review */
  getReview(id: number) {
    return apiRequest<OrderReviewDto>(`/orders/${id}/review`);
  },

  /** POST /orders/:id/cancel */
  cancel(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/cancel`, { method: 'POST' });
  },

  /** POST /orders/:id/seller-cancel — seller releases unpaid order */
  sellerCancel(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/seller-cancel`, { method: 'POST' });
  },
};
