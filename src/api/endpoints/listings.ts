import { apiRequest } from '../client';
import type {
  CreateListingRequest,
  ListingSummaryDto,
  Paginated,
  UploadImageResponse,
} from '../types';

export const listingsApi = {
  /** GET /listings/mine?status=active|draft|inactive */
  getMine(params?: { status?: 'active' | 'draft' | 'inactive'; page?: number; pageSize?: number }) {
    return apiRequest<Paginated<ListingSummaryDto>>('/listings/mine', { query: params });
  },

  /** GET /listings/sold */
  getSold(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<ListingSummaryDto>>('/listings/sold', { query: params });
  },

  /** POST /listings */
  create(body: CreateListingRequest) {
    return apiRequest<ListingSummaryDto>('/listings', { method: 'POST', body });
  },

  /** PATCH /listings/:id */
  update(id: number, body: Partial<CreateListingRequest>) {
    return apiRequest<ListingSummaryDto>(`/listings/${id}`, { method: 'PATCH', body });
  },

  /** DELETE /listings/:id */
  remove(id: number) {
    return apiRequest<void>(`/listings/${id}`, { method: 'DELETE' });
  },

  /** POST /listings/resale/:sourceListingId */
  createResaleDraft(sourceListingId: number) {
    return apiRequest<ListingSummaryDto>(`/listings/resale/${sourceListingId}`, { method: 'POST' });
  },

  /** POST /uploads/images */
  uploadImage(formData: FormData) {
    return apiRequest<UploadImageResponse>('/uploads/images', {
      method: 'POST',
      body: formData,
      auth: true,
    });
  },
};
