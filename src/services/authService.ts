import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, authApi, clearAuthTokens, setAuthTokens, userApi } from '../api';
import { API_USE_MOCK_FALLBACK, AUTH_REFRESH_KEY, AUTH_TOKEN_KEY } from '../api/config';
import {
  getSupabaseAccessToken,
  getSupabaseClient,
  isSupabaseAuthConfigured,
} from '../api/supabase';
import type { AuthTokensDto, AuthUserDto } from '../api/types';
import {
  AuthErrorKey,
  AuthUser,
  loadSession,
  loginAccount as localLogin,
  normalizePhone,
  registerAccount as localRegister,
  saveSession,
  validateLoginInput,
  validateRegisterInput,
  validateRegisterPhoneStep,
} from '../data/auth';
import { toE164Phone } from '../utils/phoneE164';
import { uploadAvatarImage } from './listingsService';
import { unregisterDevicePushToken } from './messageNotifications';
import { requestWeChatAuthCode } from './wechatNative';

async function clearStoredSession(): Promise<void> {
  await unregisterDevicePushToken();
  await clearAuthTokens();
  await saveSession(null);
}

const pendingRegisterCodes = new Map<string, string>();
const SUPABASE_RESEND_SECONDS = 60;
const PHONE_AUTH_PROVIDER = (process.env?.EXPO_PUBLIC_PHONE_AUTH_PROVIDER ?? '').trim().toLowerCase();

function isBackendPhoneAuthMode(): boolean {
  return PHONE_AUTH_PROVIDER === 'backend' || PHONE_AUTH_PROVIDER === 'twilio';
}

function shouldUseSupabasePhoneAuth(): boolean {
  if (isBackendPhoneAuthMode()) {
    return false;
  }
  return isSupabaseAuthConfigured();
}

function mapAuthApiError(err: unknown, fallback: AuthErrorKey): AuthErrorKey {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'PHONE_TAKEN':
        return 'phoneTaken';
      case 'INVALID_CREDENTIALS':
        return 'invalidCredentials';
      case 'VALIDATION_ERROR':
        return 'phoneInvalid';
      case 'OTP_INVALID':
        return 'codeInvalid';
      case 'OTP_EXPIRED':
        return 'codeExpired';
      case 'OTP_RATE_LIMIT':
      case 'OTP_TOO_MANY_ATTEMPTS':
        return 'codeRateLimit';
      case 'SUPABASE_NOT_CONFIGURED':
      case 'NETWORK_ERROR':
        return 'networkError';
      default:
        return fallback;
    }
  }
  return 'networkError';
}

function mapSupabaseAuthError(err: unknown, fallback: AuthErrorKey): AuthErrorKey {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: string }).message).toLowerCase();
    if (msg.includes('invalid') && (msg.includes('otp') || msg.includes('token'))) {
      return 'codeInvalid';
    }
    if (msg.includes('expired')) return 'codeExpired';
    if (msg.includes('rate') || msg.includes('too many')) return 'codeRateLimit';
    if (msg.includes('already registered') || msg.includes('user already registered')) {
      return 'phoneTaken';
    }
    if (msg.includes('invalid login credentials')) return 'invalidCredentials';
  }
  return fallback;
}

function mapUser(dto: AuthUserDto): AuthUser {
  return {
    id: dto.id,
    heishiId: dto.heishiId,
    nickname: dto.nickname,
    phone: dto.phone,
    email: dto.email,
    avatarUrl: dto.avatarUrl,
  };
}

async function persistSupabaseAccessToken(): Promise<void> {
  const token = await getSupabaseAccessToken();
  if (token) await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function applyTokens(tokens: AuthTokensDto): Promise<AuthUser> {
  await setAuthTokens(tokens.accessToken, tokens.refreshToken);
  const user = mapUser(tokens.user);
  await saveSession(user);
  return user;
}

async function refreshBackendSession(): Promise<AuthUser | null> {
  const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const user = await applyTokens(await authApi.refresh(refreshToken));
    await clearSupabaseSessionIfBackendPhoneAuth();
    return user;
  } catch {
    return null;
  }
}

async function clearSupabaseSessionIfBackendPhoneAuth(): Promise<void> {
  if (!isBackendPhoneAuthMode() || !isSupabaseAuthConfigured()) return;
  try {
    await getSupabaseClient().auth.signOut();
  } catch {
    // Best-effort cleanup; backend auth is already established.
  }
}

async function bootstrapBackendSession(): Promise<AuthUser | null> {
  const refreshed = await refreshBackendSession();
  if (refreshed) return refreshed;

  const accessToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!accessToken) return null;

  try {
    const me = await authApi.me();
    const user = mapUser(me);
    await saveSession(user);
    await clearSupabaseSessionIfBackendPhoneAuth();
    return user;
  } catch {
    return null;
  }
}

async function uploadRegistrationAvatar(
  avatarUri: string,
  avatarMimeType?: string,
  avatarFileName?: string,
): Promise<string> {
  return uploadAvatarImage(avatarUri, true, avatarMimeType, avatarFileName ?? 'avatar.jpg');
}

async function syncProfileAfterAuth(
  nickname: string,
  phone: string,
  avatarUrl: string,
  city: string,
): Promise<AuthUser> {
  const dto = await authApi.syncProfile({
    nickname: nickname.trim(),
    phone: normalizePhone(phone.trim()),
    city,
    avatarUrl,
  });
  const user = mapUser(dto);
  await saveSession(user);
  return user;
}

/** Refresh JWT / Supabase session after a 401. Used by settings and other authed reads. */
export async function refreshAuthSession(): Promise<AuthUser | null> {
  if (isBackendPhoneAuthMode()) {
    const backendUser = await refreshBackendSession();
    if (backendUser) return backendUser;
  }

  if (isSupabaseAuthConfigured()) {
    const { data, error } = await getSupabaseClient().auth.refreshSession();
    if (!error && data.session?.access_token) {
      await persistSupabaseAccessToken();
      try {
        const me = await authApi.me();
        const user = mapUser(me);
        await saveSession(user);
        return user;
      } catch {
        return null;
      }
    }
    return null;
  }

  if (!isBackendPhoneAuthMode()) {
    const backendUser = await refreshBackendSession();
    if (backendUser) return backendUser;
  }

  return null;
}

/** Restore session from JWT (`/auth/me`) or local demo storage. */
export async function bootstrapAuth(): Promise<AuthUser | null> {
  if (isBackendPhoneAuthMode()) {
    const backendUser = await bootstrapBackendSession();
    if (backendUser) return backendUser;
  }

  if (isSupabaseAuthConfigured()) {
    const { data } = await getSupabaseClient().auth.getSession();
    if (data.session?.access_token) {
      await persistSupabaseAccessToken();
      try {
        const me = await authApi.me();
        const user = mapUser(me);
        await saveSession(user);
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const refreshed = await refreshAuthSession();
          if (refreshed) return refreshed;
          await getSupabaseClient().auth.signOut();
          await clearStoredSession();
        }
      }
      if (!API_USE_MOCK_FALLBACK) return null;
    }
  }

  if (!isBackendPhoneAuthMode()) {
    const backendUser = await bootstrapBackendSession();
    if (backendUser) return backendUser;
  }

  return API_USE_MOCK_FALLBACK ? loadSession() : null;
}

export async function loginWithAuth(
  phone: string,
  password: string,
): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateLoginInput(phone, password);
  if (validationError) return { error: validationError };

  const normalized = normalizePhone(phone.trim());

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        phone: toE164Phone(normalized),
        password,
      });
      if (error) return { error: mapSupabaseAuthError(error, 'invalidCredentials') };
      await persistSupabaseAccessToken();
      const user = mapUser(await authApi.me());
      await saveSession(user);
      return { user };
    } catch (err) {
      return { error: mapAuthApiError(err, 'invalidCredentials') };
    }
  }

  try {
    const tokens = await authApi.login({ phone: normalized, password });
    const user = await applyTokens(tokens);
    await clearSupabaseSessionIfBackendPhoneAuth();
    return { user };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      return localLogin(phone, password);
    }
    return { error: mapAuthApiError(err, 'invalidCredentials') };
  }
}

export async function sendLoginCode(
  phone: string,
): Promise<{ resendAfter: number; devCode?: string } | { error: AuthErrorKey }> {
  const validationError = validateRegisterPhoneStep({ phone });
  if (validationError) return { error: validationError };

  const normalized = normalizePhone(phone.trim());

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const { error } = await getSupabaseClient().auth.signInWithOtp({
        phone: toE164Phone(normalized),
      });
      if (error) return { error: mapSupabaseAuthError(error, 'invalidCredentials') };
      return { resendAfter: SUPABASE_RESEND_SECONDS };
    } catch (err) {
      return { error: mapAuthApiError(err, 'networkError') };
    }
  }

  try {
    const result = await authApi.sendLoginCode({ phone: normalized });
    return { resendAfter: result.resendAfter, devCode: result.devCode };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      pendingRegisterCodes.set(normalized, '123456');
      return { resendAfter: 60, devCode: '123456' };
    }
    return { error: mapAuthApiError(err, 'networkError') };
  }
}

export async function loginWithOtp(
  phone: string,
  verificationCode: string,
): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateRegisterPhoneStep({ phone });
  if (validationError) return { error: validationError };
  if (!verificationCode.trim()) return { error: 'codeInvalid' };

  const normalized = normalizePhone(phone.trim());

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const { error } = await getSupabaseClient().auth.verifyOtp({
        phone: toE164Phone(normalized),
        token: verificationCode.trim(),
        type: 'sms',
      });
      if (error) return { error: mapSupabaseAuthError(error, 'codeInvalid') };
      await persistSupabaseAccessToken();
      const user = mapUser(await authApi.me());
      await saveSession(user);
      return { user };
    } catch (err) {
      return { error: mapAuthApiError(err, 'codeInvalid') };
    }
  }

  try {
    const tokens = await authApi.loginVerify({
      phone: normalized,
      verificationCode: verificationCode.trim(),
    });
    const user = await applyTokens(tokens);
    await clearSupabaseSessionIfBackendPhoneAuth();
    return { user };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      const expected = pendingRegisterCodes.get(normalized) ?? '123456';
      if (verificationCode.trim() !== expected) return { error: 'codeInvalid' };
      return localLogin(phone, 'demo123');
    }
    return { error: mapAuthApiError(err, 'codeInvalid') };
  }
}

export async function changePasswordWithAuth(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { error: AuthErrorKey }> {
  if (!currentPassword) return { error: 'passwordRequired' };
  if (!newPassword) return { error: 'passwordRequired' };
  if (newPassword.length < 6) return { error: 'passwordShort' };

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
      if (error) return { error: mapSupabaseAuthError(error, 'networkError') };
      return { ok: true };
    } catch (err) {
      return { error: mapAuthApiError(err, 'networkError') };
    }
  }

  try {
    await authApi.changePassword({ currentPassword, newPassword });
    return { ok: true };
  } catch (err) {
    return { error: mapAuthApiError(err, 'invalidCredentials') };
  }
}

export async function sendRegisterCode(
  phone: string,
): Promise<{ resendAfter: number; devCode?: string } | { error: AuthErrorKey }> {
  const validationError = validateRegisterPhoneStep({ phone });
  if (validationError) return { error: validationError };

  const normalized = normalizePhone(phone.trim());

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const { error } = await getSupabaseClient().auth.signInWithOtp({
        phone: toE164Phone(normalized),
      });
      if (error) return { error: mapSupabaseAuthError(error, 'phoneTaken') };
      return { resendAfter: SUPABASE_RESEND_SECONDS };
    } catch (err) {
      return { error: mapSupabaseAuthError(err, 'networkError') };
    }
  }

  try {
    const result = await authApi.sendRegisterCode({ phone: normalized });
    if (result.devCode) pendingRegisterCodes.set(normalized, result.devCode);
    return { resendAfter: result.resendAfter, devCode: result.devCode };
  } catch (err) {
    if (API_USE_MOCK_FALLBACK) {
      pendingRegisterCodes.set(normalized, '123456');
      return { resendAfter: 60, devCode: '123456' };
    }
    return { error: mapAuthApiError(err, 'networkError') };
  }
}

export async function registerWithAuth(input: {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  avatarUri: string;
  avatarMimeType?: string;
  avatarFileName?: string;
  city: string;
}): Promise<{ user: AuthUser } | { error: AuthErrorKey }> {
  const validationError = validateRegisterInput(input);
  if (validationError) return { error: validationError };

  const normalizedPhone = normalizePhone(input.phone.trim());

  if (shouldUseSupabasePhoneAuth()) {
    try {
      const e164 = toE164Phone(normalizedPhone);
      const { data, error } = await getSupabaseClient().auth.verifyOtp({
        phone: e164,
        token: input.verificationCode.trim(),
        type: 'sms',
      });
      if (error) return { error: mapSupabaseAuthError(error, 'codeInvalid') };
      if (!data.session) return { error: 'codeInvalid' };

      const { error: pwError } = await getSupabaseClient().auth.updateUser({
        password: input.password,
      });
      if (pwError) return { error: mapSupabaseAuthError(pwError, 'networkError') };

      await persistSupabaseAccessToken();
      const avatarUrl = await uploadRegistrationAvatar(
        input.avatarUri,
        input.avatarMimeType,
        input.avatarFileName,
      );
      const user = await syncProfileAfterAuth(input.nickname, normalizedPhone, avatarUrl, input.city);
      return { user };
    } catch (err) {
      if (err instanceof Error && err.message === 'AVATAR_UPLOAD_FAILED') {
        return { error: 'avatarUploadFailed' };
      }
      return { error: mapAuthApiError(err, 'networkError') };
    }
  }

  try {
    const tokens = await authApi.register({
      nickname: input.nickname.trim(),
      phone: normalizedPhone,
      password: input.password,
      verificationCode: input.verificationCode.trim(),
      city: input.city,
    });
    pendingRegisterCodes.delete(normalizedPhone);
    await applyTokens(tokens);
    await clearSupabaseSessionIfBackendPhoneAuth();
    const avatarUrl = await uploadRegistrationAvatar(
      input.avatarUri,
      input.avatarMimeType,
      input.avatarFileName,
    );
    const profile = await userApi.updateProfile({ avatarUrl, city: input.city });
    const user = mapUser(profile);
    await saveSession(user);
    return { user };
  } catch (err) {
    if (err instanceof Error && err.message === 'AVATAR_UPLOAD_FAILED') {
      return { error: 'avatarUploadFailed' };
    }
    if (API_USE_MOCK_FALLBACK) {
      const expected = pendingRegisterCodes.get(normalizedPhone) ?? '123456';
      if (input.verificationCode.trim() !== expected) {
        return { error: 'codeInvalid' };
      }
      return localRegister(input);
    }
    return { error: mapAuthApiError(err, 'networkError') };
  }
}

export async function logoutWithAuth() {
  if (isSupabaseAuthConfigured()) {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // Best-effort Supabase sign-out.
    }
  }
  try {
    await authApi.logout();
  } catch {
    // Best-effort server logout; always clear local session.
  }
  await clearStoredSession();
}

export type OAuthProvider = 'google' | 'apple' | 'wechat';

export async function loginWithOAuth(
  provider: OAuthProvider,
): Promise<{ user: AuthUser } | { error: AuthErrorKey } | { pending: true }> {
  if (provider === 'wechat') {
    const nativeResult = await requestWeChatAuthCode();
    if ('code' in nativeResult) {
      try {
        const user = await applyTokens(await authApi.wechat({ code: nativeResult.code }));
        await clearSupabaseSessionIfBackendPhoneAuth();
        return { user };
      } catch (err) {
        return { error: mapAuthApiError(err, 'networkError') };
      }
    }
    if (
      nativeResult.error === 'cancelled'
      || nativeResult.error === 'denied'
      || !isSupabaseAuthConfigured()
    ) {
      return {
        error:
          nativeResult.error === 'cancelled'
            ? 'oauthCancelled'
            : nativeResult.error === 'denied'
              ? 'oauthDenied'
              : nativeResult.error === 'unavailable'
                ? 'oauthUnavailable'
                : 'networkError',
      };
    }
  }

  if (!isSupabaseAuthConfigured()) {
    return { error: 'oauthUnavailable' };
  }
  const supabaseProvider =
    provider === 'wechat' ? 'custom:wechat' : provider === 'apple' ? 'apple' : 'google';
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: 'heishi://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error: mapSupabaseAuthError(error, 'networkError') };
    if (data?.url) {
      const { Linking } = await import('react-native');
      await Linking.openURL(data.url);
      return { pending: true };
    }
    return { error: 'networkError' };
  } catch (err) {
    return { error: mapAuthApiError(err, 'networkError') };
  }
}

/** Complete Supabase OAuth after deep-link redirect to heishi://auth/callback */
export async function completeOAuthFromUrl(url: string): Promise<AuthUser | null> {
  if (!isSupabaseAuthConfigured() || !url.includes('auth/callback')) {
    return null;
  }
  const supabase = getSupabaseClient();
  try {
    const codeMatch = url.match(/[?&#]code=([^&#]+)/);
    if (codeMatch?.[1]) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
      if (error || !data.session) return null;
    } else {
      const hash = url.includes('#') ? url.split('#')[1] : '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) return null;
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return null;
    }
    await persistSupabaseAccessToken();
    // OAuth users are email-based (no phone) — provision creates the app profile from the
    // provider's claims on first sign-in, or returns the existing one. This replaces a bare
    // /auth/me, which would 401 for a brand-new Google/Apple/WeChat user.
    const dto = await authApi.provisionOAuth();
    const user = mapUser(dto);
    await saveSession(user);
    return user;
  } catch {
    return null;
  }
}
