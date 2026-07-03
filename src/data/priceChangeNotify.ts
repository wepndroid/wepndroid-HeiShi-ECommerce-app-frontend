import AsyncStorage from '@react-native-async-storage/async-storage';

const PRICE_CHANGE_NOTICES_KEY = 'priceChangeNotices';

export interface PriceChangeNotice {
  listingId: number;
  newPrice: number;
  sellerUserId: string;
  createdAt: number;
}

type NoticeMap = Record<string, PriceChangeNotice>;

async function loadNotices(): Promise<NoticeMap> {
  const raw = await AsyncStorage.getItem(PRICE_CHANGE_NOTICES_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as NoticeMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function saveNotices(notices: NoticeMap) {
  await AsyncStorage.setItem(PRICE_CHANGE_NOTICES_KEY, JSON.stringify(notices));
}

export async function savePriceChangeNotice(
  conversationId: string,
  notice: PriceChangeNotice,
): Promise<void> {
  const notices = await loadNotices();
  notices[conversationId] = notice;
  await saveNotices(notices);
}

export async function peekPriceChangeNotice(
  conversationId: string,
): Promise<PriceChangeNotice | null> {
  const notices = await loadNotices();
  return notices[conversationId] ?? null;
}

export async function consumePriceChangeNotice(
  conversationId: string,
): Promise<PriceChangeNotice | null> {
  const notices = await loadNotices();
  const notice = notices[conversationId] ?? null;
  if (!notice) return null;
  delete notices[conversationId];
  await saveNotices(notices);
  return notice;
}
