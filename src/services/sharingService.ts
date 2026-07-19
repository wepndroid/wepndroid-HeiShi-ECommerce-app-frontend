import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { apiRequest } from '../api/client';

export interface ListingShare {
  shareId: string;
  token: string;
  path: string;
  deepLink: string;
  expiresAt: string;
}

const SHARE_TOKEN_PATTERN = /(?:Share code:\s*|【HeyMarket】)([A-Za-z0-9_-]{20,})/i;
const SHARE_ATTRIBUTION_KEY = 'heymarket:share-attribution';
const SHARE_REGISTRATION_RECORDED_KEY = 'heymarket:share-registration-recorded';

type ShareEventType =
  | 'open'
  | 'view'
  | 'favorite'
  | 'registration'
  | 'conversation'
  | 'order'
  | 'payment';

async function loadShareAttribution(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(SHARE_ATTRIBUTION_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object'
      ? parsed as Record<string, string>
      : {};
  } catch {
    return {};
  }
}

async function rememberShareAttribution(listingId: number, token: string): Promise<void> {
  const current = await loadShareAttribution();
  current[String(listingId)] = token;
  await AsyncStorage.setItem(SHARE_ATTRIBUTION_KEY, JSON.stringify(current));
}

export function extractShareToken(text: string): string | null {
  const explicit = text.match(SHARE_TOKEN_PATTERN)?.[1];
  if (explicit) return explicit;
  const urlToken = text.match(/(?:\/shares\/|[?&]share=)([A-Za-z0-9_-]{20,})/i)?.[1];
  return urlToken ?? null;
}

export async function createListingShare(
  listingId: number,
  channel: string = 'system_share',
): Promise<ListingShare> {
  return apiRequest<ListingShare>(`/listings/${listingId}/shares`, {
    method: 'POST',
    body: { channel, expiresInDays: 30 },
  });
}

export async function resolveSharedListing(token: string): Promise<{
  shareId: string;
  listingId: number;
  title: string;
  deepLink: string;
}> {
  const shared = await apiRequest<{
    shareId: string;
    listingId: number;
    title: string;
    deepLink: string;
  }>(`/shares/${encodeURIComponent(token)}`, { auth: false });
  await rememberShareAttribution(shared.listingId, token);
  return shared;
}

export async function recordShareEvent(
  token: string,
  eventType: ShareEventType,
  businessId?: string,
): Promise<void> {
  const anonymousSessionId = await AsyncStorage.getItem('heymarket:anonymous-session-id');
  await apiRequest(`/shares/${encodeURIComponent(token)}/events`, {
    method: 'POST',
    body: {
      eventType,
      anonymousSessionId: anonymousSessionId ?? undefined,
      businessId,
    },
  });
}

export async function recordShareEventForListing(
  listingId: number,
  eventType: ShareEventType,
  businessId?: string,
): Promise<void> {
  const token = (await loadShareAttribution())[String(listingId)];
  if (!token) return;
  await recordShareEvent(token, eventType, businessId);
}

export async function recordRegistrationAttribution(): Promise<void> {
  const uniqueTokens = new Set(Object.values(await loadShareAttribution()));
  const rawRecorded = await AsyncStorage.getItem(SHARE_REGISTRATION_RECORDED_KEY);
  const recordedTokens = new Set<string>();

  if (rawRecorded) {
    try {
      const parsed = JSON.parse(rawRecorded) as unknown;
      if (Array.isArray(parsed)) {
        parsed
          .filter((value): value is string => typeof value === 'string')
          .forEach((value) => recordedTokens.add(value));
      }
    } catch {
      // Invalid legacy state is safely replaced after successful event delivery.
    }
  }

  for (const token of uniqueTokens) {
    if (recordedTokens.has(token)) continue;
    try {
      await recordShareEvent(token, 'registration');
      recordedTokens.add(token);
    } catch {
      // Leave failed events eligible for retry after the next successful login.
    }
  }

  await AsyncStorage.setItem(
    SHARE_REGISTRATION_RECORDED_KEY,
    JSON.stringify([...recordedTokens]),
  );
}

export async function shareListing(listingId: number, title: string): Promise<void> {
  const link = await createListingShare(listingId);
  await Share.share({
    title,
    message: `${title}\n${link.deepLink}\n【HeyMarket】${link.token}`,
    url: link.deepLink,
  });
}
