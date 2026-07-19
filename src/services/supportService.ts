import { apiRequest } from '../api/client';

export interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: 'buyer' | 'seller' | 'both' | 'admin';
  body: string;
  officialPlatformMessage: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface SupportConversation {
  id: string;
  type: string;
  adminId: string;
  userId: string;
  userRoleContext: 'buyer' | 'seller' | 'both';
  orderId: number | null;
  subject: string;
  status: string;
  messages: SupportMessage[];
}

export function listSupportConversations(): Promise<SupportConversation[]> {
  return apiRequest('/support/conversations');
}

export function createSupportConversation(input: {
  subject: string;
  body: string;
  userRoleContext: 'buyer' | 'seller' | 'both';
  orderId?: number;
}): Promise<SupportConversation> {
  return apiRequest('/support/conversations', { method: 'POST', body: input });
}

export function replyToSupportConversation(id: string, body: string): Promise<SupportConversation> {
  return apiRequest(`/support/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: { body },
  });
}
