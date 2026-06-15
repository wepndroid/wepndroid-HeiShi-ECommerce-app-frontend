import { messagesApi } from '../api';
import { mapChatMessageDtoToUi, mapConversationDtoToUi } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import {
  listLocalConversations,
  listLocalMessages,
  openLocalConversation,
  sendLocalMessage,
} from '../data/messagesLocal';
import type { UiChatMessage, UiConversation } from '../types';

export async function listConversations(isLoggedIn: boolean): Promise<UiConversation[]> {
  if (isLoggedIn) {
    try {
      const result = await messagesApi.listConversations({ pageSize: 50 });
      return result.items.map(mapConversationDtoToUi);
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  return listLocalConversations();
}

export async function openConversation(
  input: { listingId?: number; counterpartName?: string; listingTitle?: string; conversationId?: string },
  isLoggedIn: boolean,
): Promise<UiConversation> {
  if (input.conversationId) {
    const conversations = await listConversations(isLoggedIn);
    const existing = conversations.find((c) => c.id === input.conversationId);
    if (existing) return existing;
  }

  if (isLoggedIn && input.listingId != null) {
    try {
      const dto = await messagesApi.openConversation({ listingId: input.listingId });
      return mapConversationDtoToUi(dto);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('open_conversation_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return openLocalConversation(input);
  }

  throw new Error('open_conversation_failed');
}

export async function fetchMessages(
  conversationId: string,
  isLoggedIn: boolean,
  currentUserId?: string,
): Promise<UiChatMessage[]> {
  if (isLoggedIn) {
    try {
      const result = await messagesApi.getMessages(conversationId, { limit: 50 });
      return result.items.map((dto) => mapChatMessageDtoToUi(dto, currentUserId));
    } catch {
      if (!API_USE_MOCK_FALLBACK) return [];
    }
  }

  return listLocalMessages(conversationId);
}

export async function sendMessage(
  conversationId: string,
  text: string,
  isLoggedIn: boolean,
  currentUserId?: string,
): Promise<UiChatMessage> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('empty_message');

  if (isLoggedIn) {
    try {
      const dto = await messagesApi.sendMessage(conversationId, { text: trimmed });
      return mapChatMessageDtoToUi(dto, currentUserId);
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('send_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return sendLocalMessage(conversationId, trimmed);
  }

  throw new Error('send_failed');
}
