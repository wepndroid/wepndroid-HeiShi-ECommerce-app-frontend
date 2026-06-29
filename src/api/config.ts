/** Document: see Documents/DOC-002_API_Endpoint_Catalog.md */

import { Platform } from 'react-native';

const PRODUCTION_API = 'https://api.heishi.app/v1';
const DEFAULT_LOCAL_API_PORT = 8000;

function envApiBaseUrl(): string | undefined {
  const raw = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function localDevApiPort(): number {
  const envUrl = envApiBaseUrl();
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (parsed.port) return Number.parseInt(parsed.port, 10);
    } catch {
      // ignore malformed env URL
    }
  }
  return DEFAULT_LOCAL_API_PORT;
}

/** When Expo web runs on localhost/LAN, always use the local FastAPI port. */
function localWebApiBaseUrl(): string | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined' || !window.location?.hostname) return null;

  const { hostname } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

  if (!isLocalHost) return null;

  // Same hostname as the web app (localhost:8081 → localhost:8000). Do not map to 127.0.0.1 —
  // Chrome Private Network Access blocks cross-host localhost → 127.0.0.1 fetch.
  const port = localDevApiPort();
  return `http://${hostname}:${port}/v1`;
}

/** Resolve API base URL at call time (required for web — do not cache at module load). */
export function resolveApiBaseUrl(): string {
  const localWeb = localWebApiBaseUrl();
  if (localWeb) return localWeb;
  return envApiBaseUrl() ?? PRODUCTION_API;
}

/** Base URL for HeyMarket REST API. Resolved at call time (Metro env / LDPlayer port can change). */
export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

/** @deprecated Prefer getApiBaseUrl() — kept for older imports. */
export const API_BASE_URL = PRODUCTION_API;

/** When true, screens may fall back to local demo data if the network fails. */
export const API_USE_MOCK_FALLBACK =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_MOCK_FALLBACK) !== 'false';

export const API_TIMEOUT_MS = 20_000;

export const AUTH_TOKEN_KEY = 'authAccessToken';
export const AUTH_REFRESH_KEY = 'authRefreshToken';
