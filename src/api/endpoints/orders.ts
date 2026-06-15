import { apiRequest } from '../client';
import type { CreateOrderRequest, OrderDto, Paginated } from '../types';

export const ordersApi = {
  /** GET /orders?status= */
  list(params?: {
    status?: 'pendingPay' | 'pendingShip' | 'pendingReceive' | 'pendingReview' | 'completed' | 'all';
    page?: number;
    pageSize?: number;
  }) {
    return apiRequest<Paginated<OrderDto>>('/orders', { query: params });
  },

  /** GET /orders/:id */
  get(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}`);
  },

  /** POST /orders */
  create(body: CreateOrderRequest) {
    return apiRequest<OrderDto>('/orders', { method: 'POST', body });
  },

  /** POST /orders/:id/pay */
  pay(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/pay`, { method: 'POST' });
  },

  /** POST /orders/:id/remind-ship */
  remindShip(id: number) {
    return apiRequest<void>(`/orders/${id}/remind-ship`, { method: 'POST' });
  },

  /** POST /orders/:id/confirm-receive */
  confirmReceive(id: number) {
    return apiRequest<OrderDto>(`/orders/${id}/confirm-receive`, { method: 'POST' });
  },

  /** POST /orders/:id/review */
  submitReview(id: number, body: { rating: number; comment?: string }) {
    return apiRequest<void>(`/orders/${id}/review`, { method: 'POST', body });
  },
};
