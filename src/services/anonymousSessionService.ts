import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const SESSION_KEY = 'heymarket:anonymous-session-id';
const DEVICE_KEY = 'heymarket:anonymous-device-id';
const CONSENT_PROMPTED_KEY = 'heymarket:anonymous-consent-prompted';
let sessionCreationPromise: Promise<string> | null = null;

async function anonymousDeviceId(): Promise<string> {
  let value = await AsyncStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    await AsyncStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

export async function ensureAnonymousSession(): Promise<string> {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  if (sessionCreationPromise) return sessionCreationPromise;
  sessionCreationPromise = (async () => {
    // Recheck after acquiring the in-process single-flight slot because another
    // caller may have persisted a session between the first read and this task.
    const persisted = await AsyncStorage.getItem(SESSION_KEY);
    if (persisted) return persisted;
    const row = await apiRequest<{ id: string }>('/anonymous-sessions', {
      method: 'POST',
      auth: false,
      body: { deviceId: await anonymousDeviceId(), consentStatus: 'unknown' },
    });
    await AsyncStorage.setItem(SESSION_KEY, row.id);
    return row.id;
  })();
  try {
    return await sessionCreationPromise;
  } finally {
    sessionCreationPromise = null;
  }
}

export async function linkAnonymousSessionAfterLogin(): Promise<void> {
  const sessionId = await AsyncStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  const result = await apiRequest<{ dataAssociated: boolean }>(
    `/anonymous-sessions/${encodeURIComponent(sessionId)}/link`,
    { method: 'POST' },
  );
  if (result.dataAssociated) {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export async function setAnonymousAnalyticsConsent(
  consentStatus: 'granted' | 'denied',
): Promise<void> {
  const sessionId = await ensureAnonymousSession();
  await apiRequest(
    `/anonymous-sessions/${encodeURIComponent(sessionId)}/consent`,
    {
      method: 'PATCH',
      auth: false,
      body: { consentStatus },
    },
  );
  await AsyncStorage.setItem(CONSENT_PROMPTED_KEY, 'true');
}

export async function hasPromptedForAnonymousAnalyticsConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(CONSENT_PROMPTED_KEY)) === 'true';
}
