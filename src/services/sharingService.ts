import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Linking, Share } from 'react-native';
import { ApiError, apiRequest } from '../api/client';
import { ensureAnonymousSession } from './anonymousSessionService';

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
  let normalized = text;
  try {
    normalized = decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    // A normal share message is not necessarily URI encoded.
  }
  const explicit = normalized.match(SHARE_TOKEN_PATTERN)?.[1];
  if (explicit) return explicit;
  const urlToken = normalized.match(
    /(?:\/(?:shares|s)\/|[?&](?:share|share_token)=)([A-Za-z0-9_-]{20,})/i,
  )?.[1];
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
  let anonymousSessionId = await AsyncStorage.getItem('heymarket:anonymous-session-id');
  if (!anonymousSessionId) {
    anonymousSessionId = await ensureAnonymousSession();
  }
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
    } catch (error) {
      if (
        error instanceof ApiError
        && error.code === 'REGISTRATION_NOT_ATTRIBUTABLE'
      ) {
        // The recipient already had an account before the share. This is a
        // conclusive non-conversion, so do not retry it on every future login.
        recordedTokens.add(token);
      }
      // Transient failures remain eligible for retry after the next login.
    }
  }

  await AsyncStorage.setItem(
    SHARE_REGISTRATION_RECORDED_KEY,
    JSON.stringify([...recordedTokens]),
  );
}

export type ExternalShareChannel = 'wechat' | 'system_share' | 'clipboard';

export async function shareListing(
  listingId: number,
  title: string,
  channel: ExternalShareChannel = 'system_share',
): Promise<void> {
  const wechatAvailable =
    channel === 'wechat' && await Linking.canOpenURL('weixin://').catch(() => false);
  const recordedChannel =
    channel === 'wechat' && !wechatAvailable ? 'system_share' : channel;
  const link = await createListingShare(listingId, recordedChannel);
  const message = `${title}\n${link.deepLink}\n【HeyMarket】${link.token}`;
  if (channel === 'clipboard') {
    await Clipboard.setStringAsync(message);
    return;
  }
  if (channel === 'wechat' && wechatAvailable) {
    // The user explicitly selected WeChat. Copying the structured share text
    // before opening WeChat preserves the secure token without pretending that
    // a generic share-sheet destination is known.
    await Clipboard.setStringAsync(message);
    await Linking.openURL('weixin://');
    return;
  }
  await Share.share({
    title,
    message,
    url: link.deepLink,
  });
}
