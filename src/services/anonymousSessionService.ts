import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const SESSION_KEY = 'heymarket:anonymous-session-id';
const DEVICE_KEY = 'heymarket:anonymous-device-id';

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
  const row = await apiRequest<{ id: string }>('/anonymous-sessions', {
    method: 'POST',
    auth: false,
    body: { deviceId: await anonymousDeviceId(), consentStatus: 'unknown' },
  });
  await AsyncStorage.setItem(SESSION_KEY, row.id);
  return row.id;
}

export async function linkAnonymousSessionAfterLogin(): Promise<void> {
  const sessionId = await AsyncStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  await apiRequest(`/anonymous-sessions/${encodeURIComponent(sessionId)}/link`, {
    method: 'POST',
  });
  await AsyncStorage.removeItem(SESSION_KEY);
}
