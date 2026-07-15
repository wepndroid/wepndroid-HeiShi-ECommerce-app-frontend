import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getApiBaseUrl,
  API_TIMEOUT_MS,
  AUTH_REFRESH_KEY,
  AUTH_TOKEN_KEY,
} from './config';
import { getApiLanguage } from '../i18n';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** True when a request failed because the backend was unreachable (offline / mock dev). */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.status === 0);
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function getAccessToken(): Promise<string | null> {
  const { getSupabaseAccessToken, isSupabaseAuthConfigured } = await import('./supabase');
  if (isSupabaseAuthConfigured()) {
    const token = await getSupabaseAccessToken();
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      return token;
    }
  }
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

function buildUrl(path: string, query?: ApiRequestOptions['query']) {
  const url = new URL(path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal, timeoutMs = API_TIMEOUT_MS } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getApiLanguage(),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    try {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // AsyncStorage / Supabase unavailable — continue as guest.
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const mergedSignal = signal ?? controller.signal;

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      signal: mergedSignal,
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        throw new ApiError(
          response.ok ? 'Invalid JSON response' : `Request failed (${response.status})`,
          response.status,
        );
      }
    }

    if (!response.ok) {
      const err = payload as ApiErrorBody | null;
      throw new ApiError(
        err?.message ?? `Request failed (${response.status})`,
        response.status,
        err?.code,
        err?.details,
      );
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(aborted ? 'Request timed out' : 'Network request failed', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}

export async function setAuthTokens(accessToken: string, refreshToken?: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) await AsyncStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
}

export async function clearAuthTokens() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_REFRESH_KEY]);
}

/** Headers for authenticated multipart uploads (native FileSystem.uploadAsync). */
export async function getAuthRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getApiLanguage(),
  };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
