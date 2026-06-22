import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { personAvatarUrlForKey } from './avatarPhotos';
import type { UiChatMessage, UiConversation } from '../types';

const CONVERSATIONS_KEY = 'localConversations';
const MESSAGES_KEY = 'localMessages';

export interface LocalConversationRecord {
  id: string;
  counterpartName?: string;
  counterpartNameKey?: string;
  listingId?: number;
  listingTitle?: string;
  lastMessageText?: string;
  lastMessageKey?: string;
  lastMessageAt: string;
  lastMessageAtKey?: string;
  unreadCount: number;
  verified?: boolean;
}

export interface LocalMessageRecord {
  id: string;
  conversationId: string;
  text?: string;
  textKey?: string;
  side: 'left' | 'right';
  sentAt: string;
}

const DEMO_CONVERSATIONS: LocalConversationRecord[] = [
  {
    id: 'demo-1',
    counterpartNameKey: 'screens.messages.contacts.mia',
    lastMessageKey: 'screens.messages.chat1',
    lastMessageAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    unreadCount: 1,
    verified: true,
  },
  {
    id: 'demo-2',
    counterpartNameKey: 'screens.messages.contacts.shop',
    lastMessageKey: 'screens.messages.chat2',
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    unreadCount: 2,
    verified: true,
  },
  {
    id: 'demo-3',
    counterpartNameKey: 'screens.messages.contacts.pte',
    lastMessageKey: 'screens.messages.chat3',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 60_000).toISOString(),
    unreadCount: 0,
    verified: true,
  },
];

const DEMO_MESSAGES: Record<string, LocalMessageRecord[]> = {
  'demo-1': [
    { id: 'm1', conversationId: 'demo-1', textKey: 'screens.chat.msg1', side: 'left', sentAt: '' },
    { id: 'm2', conversationId: 'demo-1', textKey: 'screens.chat.msg2', side: 'right', sentAt: '' },
    { id: 'm3', conversationId: 'demo-1', textKey: 'screens.chat.msg3', side: 'left', sentAt: '' },
  ],
};

function resolveText(record: { text?: string; textKey?: string }): string {
  if (record.textKey) return i18n.t(record.textKey);
  return record.text ?? '';
}

async function readConversations(): Promise<LocalConversationRecord[]> {
  const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
  if (!raw) return DEMO_CONVERSATIONS;
  try {
    const parsed = JSON.parse(raw) as LocalConversationRecord[];
    return parsed.length ? parsed : DEMO_CONVERSATIONS;
  } catch {
    return DEMO_CONVERSATIONS;
  }
}

async function writeConversations(conversations: LocalConversationRecord[]) {
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

async function readMessages(): Promise<LocalMessageRecord[]> {
  const raw = await AsyncStorage.getItem(MESSAGES_KEY);
  if (!raw) return Object.values(DEMO_MESSAGES).flat();
  try {
    const parsed = JSON.parse(raw) as LocalMessageRecord[];
    return Array.isArray(parsed) ? parsed : Object.values(DEMO_MESSAGES).flat();
  } catch {
    return Object.values(DEMO_MESSAGES).flat();
  }
}

async function writeMessages(messages: LocalMessageRecord[]) {
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function mapLocalConversationToUi(record: LocalConversationRecord): UiConversation {
  const counterpartName = record.counterpartNameKey
    ? i18n.t(record.counterpartNameKey)
    : (record.counterpartName ?? i18n.t('common.sellerDefault'));
  const counterpartKey = record.counterpartNameKey?.split('.').pop() ?? counterpartName;
  return {
    id: record.id,
    counterpartName,
    counterpartKey,
    counterpartAvatarUrl: personAvatarUrlForKey(counterpartKey, 88),
    lastMessage: record.lastMessageKey
      ? i18n.t(record.lastMessageKey)
      : (record.lastMessageText ?? ''),
    timeLabel: record.lastMessageAt,
    unreadCount: record.unreadCount,
    verified: record.verified,
    listingId: record.listingId,
    listingTitle: record.listingTitle,
  };
}

export function mapLocalMessageToUi(record: LocalMessageRecord): UiChatMessage {
  return {
    id: record.id,
    text: resolveText(record),
    side: record.side,
  };
}

export async function listLocalConversations(): Promise<UiConversation[]> {
  const conversations = await readConversations();
  return conversations.map(mapLocalConversationToUi);
}

export async function listLocalMessages(conversationId: string): Promise<UiChatMessage[]> {
  const stored = await readMessages();
  const seeded = DEMO_MESSAGES[conversationId] ?? [];
  const merged = [...seeded, ...stored.filter((m) => m.conversationId === conversationId)];
  const unique = new Map(merged.map((m) => [m.id, m]));
  return [...unique.values()].map(mapLocalMessageToUi);
}

export async function openLocalConversation(input: {
  listingId?: number;
  counterpartName?: string;
  listingTitle?: string;
}): Promise<UiConversation> {
  const conversations = await readConversations();
  const existing = conversations.find(
    (c) =>
      (input.listingId != null && c.listingId === input.listingId) ||
      (input.counterpartName &&
        (c.counterpartName === input.counterpartName ||
          (c.counterpartNameKey && i18n.t(c.counterpartNameKey) === input.counterpartName))),
  );
  if (existing) return mapLocalConversationToUi(existing);

  const record: LocalConversationRecord = {
    id: `local-${Date.now()}`,
    counterpartName: input.counterpartName ?? i18n.t('common.sellerDefault'),
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    lastMessageText: '',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  };
  await writeConversations([record, ...conversations]);
  return mapLocalConversationToUi(record);
}

export async function sendLocalMessage(conversationId: string, text: string): Promise<UiChatMessage> {
  const trimmed = text.trim();
  const messages = await readMessages();
  const record: LocalMessageRecord = {
    id: `msg-${Date.now()}`,
    conversationId,
    text: trimmed,
    side: 'right',
    sentAt: new Date().toISOString(),
  };
  await writeMessages([...messages, record]);

  const conversations = await readConversations();
  const sentAt = new Date().toISOString();
  const next = conversations.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessageText: trimmed,
          lastMessageKey: undefined,
          lastMessageAt: sentAt,
          lastMessageAtKey: undefined,
        }
      : c,
  );
  await writeConversations(next);
  return mapLocalMessageToUi(record);
}
