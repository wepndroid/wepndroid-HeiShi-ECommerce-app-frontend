import { apiRequest } from '../client';
import type {
  ChatMessageDto,
  ConversationDto,
  InboxNotificationDto,
  NotificationCategory,
  NotificationGroupDto,
  Paginated,
  PrivateOfferDto,
} from '../types';

export const messagesApi = {
  /** GET /conversations */
  listConversations(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<ConversationDto>>('/conversations', { query: params });
  },

  /** GET /conversations/:id */
  getConversation(conversationId: string) {
    return apiRequest<ConversationDto>(`/conversations/${conversationId}`);
  },

  /** GET /conversations/:id/messages */
  getMessages(conversationId: string, params?: { before?: string; beforeId?: string; limit?: number }) {
    return apiRequest<Paginated<ChatMessageDto>>(`/conversations/${conversationId}/messages`, {
      query: params,
    });
  },

  /** POST /conversations/:id/messages */
  sendMessage(conversationId: string, body: { text: string }) {
    return apiRequest<ChatMessageDto>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body,
    });
  },

  /** POST /conversations — open or resume chat about a listing */
  openConversation(body: { listingId: number; counterpartUserId?: string }) {
    return apiRequest<ConversationDto>('/conversations', { method: 'POST', body });
  },

  /** POST /conversations/:id/read — mark incoming messages read up to maxMessageId */
  markConversationRead(conversationId: string, body?: { maxMessageId?: string }) {
    return apiRequest<ConversationDto>(`/conversations/${conversationId}/read`, {
      method: 'POST',
      body: body ?? {},
    });
  },

  /** PATCH /conversations/:id/read-state — manual mark as unread/read */
  setConversationMarkedUnread(conversationId: string, markedAsUnread: boolean) {
    return apiRequest<ConversationDto>(`/conversations/${conversationId}/read-state`, {
      method: 'PATCH',
      body: { markedAsUnread },
    });
  },

  /** GET /notifications/system */
  getSystemNotifications(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<{ id: string; title: string; body: string; createdAt: string; unread?: boolean }>>(
      '/notifications/system',
      { query: params },
    );
  },

  /** GET /notifications/groups */
  listNotificationGroups() {
    return apiRequest<NotificationGroupDto[]>('/notifications/groups');
  },

  /** GET /notifications/groups/:category */
  listGroupNotifications(category: NotificationCategory, params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<InboxNotificationDto>>(`/notifications/groups/${category}`, {
      query: params,
    });
  },

  /** POST /notifications/groups/:category/mark-read */
  markGroupRead(category: NotificationCategory) {
    return apiRequest<void>(`/notifications/groups/${category}/mark-read`, { method: 'POST' });
  },

  /** DELETE /notifications/:id */
  deleteNotification(notificationId: string) {
    return apiRequest<void>(`/notifications/${notificationId}`, { method: 'DELETE' });
  },

  createPrivateOffer(
    conversationId: string,
    body: {
      negotiatedPrice: number;
      quantity?: number;
      shippingFee?: number;
      expiresInMinutes?: number;
    },
  ) {
    return apiRequest<PrivateOfferDto>(`/conversations/${conversationId}/offers`, {
      method: 'POST',
      body,
    });
  },

  getPrivateOffer(offerId: string) {
    return apiRequest<PrivateOfferDto>(`/offers/${offerId}`);
  },

  acceptPrivateOffer(offerId: string) {
    return apiRequest<{ offer: PrivateOfferDto; orderId: number; idempotent: boolean }>(
      `/offers/${offerId}/accept`,
      { method: 'POST' },
    );
  },

  rejectPrivateOffer(offerId: string) {
    return apiRequest<PrivateOfferDto>(`/offers/${offerId}/reject`, { method: 'POST' });
  },

  cancelPrivateOffer(offerId: string) {
    return apiRequest<PrivateOfferDto>(`/offers/${offerId}/cancel`, { method: 'POST' });
  },
};
