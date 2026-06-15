/** Document: see Documents/DOC-002_API_Endpoint_Catalog.md */

/** Base URL for HeyMarket REST API (override via EXPO_PUBLIC_API_URL). */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://api.heishi.app/v1';

/** When true, screens may fall back to local demo data if the network fails. */
export const API_USE_MOCK_FALLBACK =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_MOCK_FALLBACK) !== 'false';

export const API_TIMEOUT_MS = 20_000;

export const AUTH_TOKEN_KEY = 'authAccessToken';
export const AUTH_REFRESH_KEY = 'authRefreshToken';
