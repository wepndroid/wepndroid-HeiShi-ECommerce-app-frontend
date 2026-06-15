import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, authApi, clearAuthTokens, setAuthTokens } from '../api';
import { API_USE_MOCK_FALLBACK, AUTH_REFRESH_KEY, AUTH_TOKEN_KEY } from '../api/config';
import type { AuthTokensDto, AuthUserDto } from '../api/types';
import {
  AuthErrorKey,
  AuthUser,
  loadSession,
  loginAccount as localLogin,
  logoutSession as localLogout,
  normalizePhone,
  registerAccount as localRegister,
  saveSession,
  validateLoginInput,
  validateRegisterInput,
} from '../data/auth';

function mapAuthApiError(err: unknown, fallback: AuthErrorKey): AuthErrorKey {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'PHONE_TAKEN':
        return 'phoneTaken';
      case 'INVALID_CREDENTIALS':
        return 'invalidCredentials';
      case 'VALIDATION_ERROR':
        return 'phoneInvalid';
      default:
        return fallback;
    }
  }
  return 'networkError';
}

function mapUser(dto: AuthUserDto): AuthUser {
  return {
    id: dto.heishiId || dto.id,
    nickname: dto.nickname,
    phone: dto.phone,
  };
}

async function applyTokens(tokens: AuthTokensDto): Promise<AuthUser> {
  await setAuthTokens(tokens.accessToken, tokens.refreshToken);
  const user = mapUser(tokens.user);
  await saveSession(user);
  return user;
}

async function tryRefreshSession(): Promise<AuthUser | null> {
  const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    return applyTokens(await authApi.refresh(refreshToken));
  } catch {
    return null;
  }
}

/** Restore session from JWT (`/auth/me`) or local demo storage. */
export async function bootstrapAuth(): Promise<AuthUser | null> {
  const accessToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  if (accessToken) {
    try {
      const me = await authApi.me();
      const user = mapUser(me);
      await saveSession(user);
      return user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const refreshed = await tryRefreshSession();
        if (refreshed) return refreshed;
        await clearAuthTokens();
        await saveSession(null);
      }
    }
  }

  return loadSession();
}

export async function loginWithAuth(
  phone: string,
  password: string,
): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateLoginInput(phone, password);
  if (validationError) return { error: validationError };

  try {
    const tokens = await authApi.login({ phone: normalizePhone(phone.trim()), password });
    const user = await applyTokens(tokens);
    return { user };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      return localLogin(phone, password);
    }
    return { error: mapAuthApiError(err, 'invalidCredentials') };
  }
}

export async function registerWithAuth(input: {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateRegisterInput(input);
  if (validationError) return { error: validationError };

  try {
    const tokens = await authApi.register({
      nickname: input.nickname.trim(),
      phone: normalizePhone(input.phone.trim()),
      password: input.password,
    });
    const user = await applyTokens(tokens);
    return { user };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      return localRegister(input);
    }
    return { error: mapAuthApiError(err, 'invalidCredentials') };
  }
}

export async function logoutWithAuth() {
  try {
    await authApi.logout();
  } catch {
    // Best-effort server logout; always clear local session.
  }
  await clearAuthTokens();
  await localLogout();
}
