import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import type { NotificationCategory, UiInboxNotification, UiNotificationGroup } from '../types';

const STORAGE_KEY = 'localInboxNotifications';

export interface LocalInboxRecord {
  id: string;
  category: NotificationCategory;
  titleKey?: string;
  bodyKey?: string;
  title?: string;
  body?: string;
  createdAt: string;
  unread: boolean;
  actionType?: string;
  actionRef?: string;
}

const DEMO_ITEMS: LocalInboxRecord[] = [
  {
    id: 'local-sys-1',
    category: 'system',
    titleKey: 'screens.messages.inbox.systemPolicyTitle',
    bodyKey: 'screens.messages.inbox.systemPolicyBody',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    unread: true,
  },
  {
    id: 'local-sys-2',
    category: 'system',
    titleKey: 'screens.messages.inbox.systemWelcomeTitle',
    bodyKey: 'screens.messages.inbox.systemWelcomeBody',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    unread: true,
  },
  {
    id: 'local-order-1',
    category: 'order',
    titleKey: 'screens.messages.inbox.orderShippedTitle',
    bodyKey: 'screens.messages.inbox.orderShippedBody',
    createdAt: (() => { const d = new Date(); d.setHours(9, 24, 0, 0); return d.toISOString(); })(),
    unread: true,
    actionType: 'orders',
  },
  {
    id: 'local-follow-1',
    category: 'follow',
    titleKey: 'screens.messages.inbox.followNewTitle',
    bodyKey: 'screens.messages.inbox.followNewBody',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    unread: false,
    actionType: 'following',
  },
];

function resolveText(record: Pick<LocalInboxRecord, 'title' | 'titleKey' | 'body' | 'bodyKey'>) {
  return {
    title: record.titleKey ? i18n.t(record.titleKey) : record.title ?? '',
    body: record.bodyKey ? i18n.t(record.bodyKey) : record.body ?? '',
  };
}

async function readAll(): Promise<LocalInboxRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEMO_ITEMS.map((item) => ({ ...item, createdAt: typeof item.createdAt === 'number' ? new Date(item.createdAt).toISOString() : item.createdAt }));
  try {
    const parsed = JSON.parse(raw) as LocalInboxRecord[];
    return parsed.length ? parsed : DEMO_ITEMS;
  } catch {
    return DEMO_ITEMS;
  }
}

async function writeAll(items: LocalInboxRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toUi(record: LocalInboxRecord): UiInboxNotification {
  const { title, body } = resolveText(record);
  return {
    id: record.id,
    category: record.category,
    title,
    body,
    timeLabel: record.createdAt,
    unread: record.unread,
    actionType: record.actionType,
    actionRef: record.actionRef,
  };
}

const GROUP_ICONS: Record<NotificationCategory, UiNotificationGroup['icon']> = {
  system: 'bell',
  order: 'package',
  follow: 'star',
};

const GROUP_TITLE_KEYS: Record<NotificationCategory, string> = {
  system: 'screens.messages.systemTitle',
  order: 'screens.messages.orderTitle',
  follow: 'screens.messages.followTitle',
};

const GROUP_PREVIEW_KEYS: Record<NotificationCategory, { title: string; body: string }> = {
  system: { title: 'screens.messages.systemMsg', body: 'screens.messages.systemMsg' },
  order: { title: 'screens.messages.orderMsg', body: 'screens.messages.orderMsg' },
  follow: { title: 'screens.messages.followMsg', body: 'screens.messages.followMsg' },
};

export async function listLocalNotificationGroups(): Promise<UiNotificationGroup[]> {
  const items = await readAll();
  const categories: NotificationCategory[] = ['system', 'order', 'follow'];
  return categories.map((category) => {
    const inCategory = items.filter((item) => item.category === category);
    const unreadCount = inCategory.filter((item) => item.unread).length;
    const latest = inCategory.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const preview = latest ? resolveText(latest) : { title: i18n.t(GROUP_PREVIEW_KEYS[category].title), body: i18n.t(GROUP_PREVIEW_KEYS[category].body) };
    return {
      category,
      unreadCount,
      previewTitle: preview.title || i18n.t(GROUP_TITLE_KEYS[category]),
      previewBody: preview.body,
      timeLabel: latest?.createdAt ?? '',
      icon: GROUP_ICONS[category],
    };
  });
}

export async function listLocalGroupNotifications(category: NotificationCategory): Promise<UiInboxNotification[]> {
  const items = await readAll();
  return items
    .filter((item) => item.category === category)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toUi);
}

export async function deleteLocalNotification(notificationId: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((item) => item.id !== notificationId));
}

export async function markLocalGroupRead(category: NotificationCategory): Promise<void> {
  const items = await readAll();
  await writeAll(
    items.map((item) => (item.category === category ? { ...item, unread: false } : item)),
  );
}