import { apiRequest } from '../client';
import type {
  AddressDto,
  CreditProfileDto,
  NotificationSettingsDto,
  Paginated,
  PaymentMethodDto,
  PayoutMethodDto,
  PrivacySettingsDto,
  ReviewSummaryDto,
  UserProfileUpdateRequest,
  PublicUserProfileDto,
  ListingSummaryDto,
} from '../types';

export const userApi = {
  /** GET /users/me/profile */
  getProfile() {
    return apiRequest<import('../types').AuthUserDto>('/users/me/profile');
  },

  /** PATCH /users/me/profile */
  updateProfile(body: UserProfileUpdateRequest) {
    return apiRequest<import('../types').AuthUserDto>('/users/me/profile', { method: 'PATCH', body });
  },

  /** GET /users/me/addresses */
  getAddresses() {
    return apiRequest<AddressDto[]>('/users/me/addresses');
  },

  /** POST /users/me/addresses */
  addAddress(body: Omit<AddressDto, 'id'>) {
    return apiRequest<AddressDto>('/users/me/addresses', { method: 'POST', body });
  },

  /** PATCH /users/me/addresses/:id */
  updateAddress(id: string, body: Partial<AddressDto>) {
    return apiRequest<AddressDto>(`/users/me/addresses/${id}`, { method: 'PATCH', body });
  },

  /** DELETE /users/me/addresses/:id */
  deleteAddress(id: string) {
    return apiRequest<void>(`/users/me/addresses/${id}`, { method: 'DELETE' });
  },

  /** GET /users/me/credit */
  getCreditProfile() {
    return apiRequest<CreditProfileDto>('/users/me/credit');
  },

  /** GET /users/me/reviews/summary */
  getReviewSummary() {
    return apiRequest<ReviewSummaryDto>('/users/me/reviews/summary');
  },

  /** GET /users/me/verification */
  getVerificationStatus() {
    return apiRequest<{
      phoneVerified: boolean;
      wechatBound: boolean;
      alipayBound: boolean;
      identityVerified: boolean;
      businessVerified: boolean;
    }>('/users/me/verification');
  },

  /** GET /users/:id/profile — public seller profile */
  getPublicProfile(userId: string) {
    return apiRequest<PublicUserProfileDto>(`/users/${encodeURIComponent(userId)}/profile`);
  },

  /** GET /users/:id/listings — public active listings */
  getPublicListings(userId: string, params?: { page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return apiRequest<Paginated<ListingSummaryDto>>(
      `/users/${encodeURIComponent(userId)}/listings${query ? `?${query}` : ''}`,
    );
  },
};

export const paymentsApi = {
  /** GET /payments/methods */
  listPaymentMethods() {
    return apiRequest<PaymentMethodDto[]>('/payments/methods');
  },

  /** POST /payments/methods */
  addPaymentMethod(body: { type: PaymentMethodDto['type']; token: string }) {
    return apiRequest<PaymentMethodDto>('/payments/methods', { method: 'POST', body });
  },

  /** GET /payouts/methods */
  listPayoutMethods() {
    return apiRequest<PayoutMethodDto[]>('/payouts/methods');
  },

  /** POST /payouts/methods */
  addPayoutMethod(body: { type: PayoutMethodDto['type']; accountToken: string }) {
    return apiRequest<PayoutMethodDto>('/payouts/methods', { method: 'POST', body });
  },
};

export const settingsApi = {
  /** GET /settings/notifications */
  getNotificationSettings() {
    return apiRequest<NotificationSettingsDto>('/settings/notifications');
  },

  /** PATCH /settings/notifications */
  updateNotificationSettings(body: Partial<NotificationSettingsDto>) {
    return apiRequest<NotificationSettingsDto>('/settings/notifications', { method: 'PATCH', body });
  },

  /** GET /settings/privacy */
  getPrivacySettings() {
    return apiRequest<PrivacySettingsDto>('/settings/privacy');
  },

  /** PATCH /settings/privacy */
  updatePrivacySettings(body: Partial<PrivacySettingsDto>) {
    return apiRequest<PrivacySettingsDto>('/settings/privacy', { method: 'PATCH', body });
  },

  /** POST /settings/cache/clear */
  clearCache() {
    return apiRequest<{ freedBytes: number }>('/settings/cache/clear', { method: 'POST' });
  },
};

export const regionApi = {
  /** GET /regions — optional if region tree is served dynamically */
  getRegionTree() {
    return apiRequest<import('../types').RegionDto[]>('/regions');
  },
};

export const safetyApi = {
  /** GET /safety/reports */
  listReports(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<{ id: string; targetType: string; status: string; createdAt: string }>>(
      '/safety/reports',
      { query: params },
    );
  },

  /** POST /safety/reports */
  submitReport(body: { targetType: 'listing' | 'user'; targetId: string; reason: string; details?: string }) {
    return apiRequest<void>('/safety/reports', { method: 'POST', body });
  },

  /** GET /safety/blocklist */
  getBlocklist() {
    return apiRequest<{ userId: string; nickname: string }[]>('/safety/blocklist');
  },

  /** POST /safety/blocklist/:userId */
  blockUser(userId: string) {
    return apiRequest<void>(`/safety/blocklist/${userId}`, { method: 'POST' });
  },
};
