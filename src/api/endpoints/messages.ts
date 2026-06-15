import { apiRequest } from '../client';
import type { ChatMessageDto, ConversationDto, Paginated } from '../types';

export const messagesApi = {
  /** GET /conversations */
  listConversations(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<ConversationDto>>('/conversations', { query: params });
  },

  /** GET /conversations/:id/messages */
  getMessages(conversationId: string, params?: { before?: string; limit?: number }) {
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

  /** GET /notifications/system */
  getSystemNotifications(params?: { page?: number; pageSize?: number }) {
    return apiRequest<Paginated<{ id: string; title: string; body: string; createdAt: string; unread?: boolean }>>(
      '/notifications/system',
      { query: params },
    );
  },
};
