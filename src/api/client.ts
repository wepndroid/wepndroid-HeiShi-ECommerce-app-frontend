import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  AUTH_REFRESH_KEY,
  AUTH_TOKEN_KEY,
} from './config';
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
}

async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

function buildUrl(path: string, query?: ApiRequestOptions['query']) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
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
    const payload = text ? (JSON.parse(text) as unknown) : null;

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
