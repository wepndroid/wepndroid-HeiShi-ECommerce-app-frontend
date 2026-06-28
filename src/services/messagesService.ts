import { messagesApi } from '../api';
import { ApiError } from '../api/client';
import { mapChatMessageDtoToUi, mapConversationDtoToUi } from '../api/mappers';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import {
  listLocalConversations,
  listLocalMessages,
  markLocalConversationRead,
  markLocalConversationUnread,
  openLocalConversation,
  sendLocalMessage,
} from '../data/messagesLocal';
import type { UiChatMessage, UiConversation } from '../types';

const inboxRefreshListeners = new Set<() => void>();
const inboxPollListeners = new Set<(conversations: UiConversation[]) => void>();

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollInFlight = false;
let pollEnabled = false;
let pollIsLoggedIn = false;
let pollAppState: 'active' | 'background' | 'inactive' | 'unknown' | 'extension' = 'active';

const POLL_MS_ACTIVE = 6000;
const POLL_MS_BACKGROUND = 3000;

export function subscribeInboxRefresh(listener: () => void): () => void {
  inboxRefreshListeners.add(listener);
  return () => inboxRefreshListeners.delete(listener);
}

export function notifyInboxRefresh(): void {
  inboxRefreshListeners.forEach((listener) => listener());
}

export function subscribeInboxPoll(listener: (conversations: UiConversation[]) => void): () => void {
  inboxPollListeners.add(listener);
  return () => inboxPollListeners.delete(listener);
}

export function setInboxPollAppState(state: typeof pollAppState): void {
  const prev = pollAppState;
  pollAppState = state;
  if (pollEnabled && state !== 'active' && prev === 'active') {
    scheduleInboxPoll(0);
  }
}

/** Start polling the inbox for new messages (logged-in API users). */
export function startInboxPolling(isLoggedIn: boolean): () => void {
  pollEnabled = true;
  pollIsLoggedIn = isLoggedIn;
  scheduleInboxPoll(0);
  return () => {
    pollEnabled = false;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  };
}

function scheduleInboxPoll(delayMs: number): void {
  if (!pollEnabled) return;
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(() => void runInboxPoll(), delayMs);
}

async function runInboxPoll(): Promise<void> {
  pollTimer = null;
  if (!pollEnabled) return;
  if (pollInFlight) {
    scheduleInboxPoll(1000);
    return;
  }
  pollInFlight = true;
  try {
    const conversations = await listConversations(pollIsLoggedIn);
    inboxPollListeners.forEach((listener) => listener(conversations));
  } catch {
    // Retry on the next tick.
  } finally {
    pollInFlight = false;
    if (pollEnabled) {
      const ms = pollAppState === 'active' ? POLL_MS_ACTIVE : POLL_MS_BACKGROUND;
      scheduleInboxPoll(ms);
    }
  }
}

export function conversationShowsUnread(row: UiConversation): boolean {
  return row.unreadCount > 0 || Boolean(row.markedAsUnread);
}

export function inboxUnreadCount(
  rows: Array<{ unreadCount: number; markedAsUnread?: boolean }>,
): number {
  return rows.reduce((sum, row) => {
    if (row.unreadCount > 0) return sum + row.unreadCount;
    if (row.markedAsUnread) return sum + 1;
    return sum;
  }, 0);
}

export function sortChatMessagesAsc(messages: UiChatMessage[]): UiChatMessage[] {
  return [...messages].sort((a, b) => {
    const ta = Date.parse(a.sentAt) || 0;
    const tb = Date.parse(b.sentAt) || 0;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

function counterpartKeyForRow(row: UiConversation): string {
  return row.counterpartKey || row.counterpartName;
}

/** Hide empty threads when the same counterpart already has messages (mirrors backend inbox filter). */
export function dedupeInboxConversations(conversations: UiConversation[]): UiConversation[] {
  const byCounterpart = new Map<string, UiConversation[]>();
  for (const row of conversations) {
    const key = counterpartKeyForRow(row);
    const group = byCounterpart.get(key) ?? [];
    group.push(row);
    byCounterpart.set(key, group);
  }

  const visible: UiConversation[] = [];
  for (const group of byCounterpart.values()) {
    const withMessages = group.filter((row) => row.lastMessage.trim().length > 0);
    if (withMessages.length > 0) {
      visible.push(...withMessages);
      continue;
    }
    const newest = group.reduce((best, row) =>
      (Date.parse(row.timeLabel) || 0) > (Date.parse(best.timeLabel) || 0) ? row : best,
    );
    visible.push(newest);
  }

  return visible.sort(
    (a, b) => (Date.parse(b.timeLabel) || 0) - (Date.parse(a.timeLabel) || 0),
  );
}

export async function listConversations(isLoggedIn: boolean): Promise<UiConversation[]> {
  if (isLoggedIn) {
    try {
      const pageSize = 50;
      let page = 1;
      let total = 0;
      const all: UiConversation[] = [];
      do {
        const result = await messagesApi.listConversations({ page, pageSize });
        total = result.total;
        all.push(...result.items.map(mapConversationDtoToUi));
        page += 1;
      } while (all.length < total);
      return dedupeInboxConversations(all);
    } catch {
      throw new Error('list_conversations_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return dedupeInboxConversations(await listLocalConversations());
  }
  return [];
}

export function triggerInboxPollNow(): void {
  if (pollEnabled) scheduleInboxPoll(0);
}

export async function openConversation(
  input: {
    listingId?: number;
    counterpartUserId?: string;
    counterpartName?: string;
    listingTitle?: string;
    conversationId?: string;
  },
  isLoggedIn: boolean,
): Promise<UiConversation> {
  if (input.conversationId) {
    const conversations = await listConversations(isLoggedIn);
    const existing = conversations.find((c) => c.id === input.conversationId);
    if (existing) {
      return {
        ...existing,
        listingId: existing.listingId ?? input.listingId,
        listingTitle: existing.listingTitle ?? input.listingTitle,
      };
    }

    if (isLoggedIn) {
      try {
        const dto = await messagesApi.getConversation(input.conversationId);
        return mapConversationDtoToUi(dto);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new Error('open_conversation_failed');
      }
    }

    if (API_USE_MOCK_FALLBACK) {
      const localRows = await listLocalConversations();
      const local = localRows.find((c) => c.id === input.conversationId);
      if (local) return local;
    }

    throw new Error('open_conversation_failed');
  }

  if (isLoggedIn && input.listingId != null) {
    try {
      const dto = await messagesApi.openConversation({
        listingId: input.listingId,
        counterpartUserId: input.counterpartUserId,
      });
      return mapConversationDtoToUi(dto);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('open_conversation_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
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
      const merged: UiChatMessage[] = [];
      let before: string | undefined;
      let beforeId: string | undefined;
      const limit = 50;
      for (let page = 0; page < 20; page += 1) {
        const result = await messagesApi.getMessages(conversationId, { limit, before, beforeId });
        if (!result.items.length) break;
        merged.push(
          ...result.items.map((dto) => mapChatMessageDtoToUi(dto, currentUserId)),
        );
        if (result.items.length < limit || !result.hasMore) break;
        const oldest = result.items[result.items.length - 1];
        before = oldest?.sentAt;
        beforeId = oldest?.id;
        if (!before || !beforeId) break;
      }
      return sortChatMessagesAsc(merged);
    } catch {
      throw new Error('fetch_messages_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK) {
    return listLocalMessages(conversationId);
  }
  return [];
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
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('send_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
    return sendLocalMessage(conversationId, trimmed);
  }

  throw new Error('send_failed');
}

export async function markConversationRead(
  conversationId: string,
  isLoggedIn: boolean,
  maxMessageId?: string,
): Promise<void> {
  if (isLoggedIn) {
    try {
      await messagesApi.markConversationRead(conversationId, maxMessageId ? { maxMessageId } : {});
      notifyInboxRefresh();
      triggerInboxPollNow();
      return;
    } catch {
      throw new Error('mark_read_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
    await markLocalConversationRead(conversationId);
    notifyInboxRefresh();
    triggerInboxPollNow();
    return;
  }

  throw new Error('mark_read_failed');
}

export async function setConversationMarkedUnread(
  conversationId: string,
  isLoggedIn: boolean,
  markedAsUnread: boolean,
): Promise<void> {
  if (isLoggedIn) {
    try {
      await messagesApi.setConversationMarkedUnread(conversationId, markedAsUnread);
      notifyInboxRefresh();
      return;
    } catch {
      throw new Error('mark_unread_failed');
    }
  }

  if (API_USE_MOCK_FALLBACK && !isLoggedIn) {
    await markLocalConversationUnread(conversationId, markedAsUnread);
    notifyInboxRefresh();
    return;
  }

  throw new Error('mark_unread_failed');
}
