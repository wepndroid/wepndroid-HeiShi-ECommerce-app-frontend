import { apiRequest } from '../client';
import type {
  AuthTokensDto,
  AuthUserDto,
  LoginRequest,
  RegisterRequest,
  SendRegisterCodeRequest,
  SyncProfileRequest,
} from '../types';

type DeviceSessionMetadata = {
  deviceId?: string;
  platform?: string;
  deviceName?: string;
};

export type AuthIdentityDto = {
  id: string;
  provider: 'phone' | 'wechat' | 'alipay' | 'google';
  verified: boolean;
  boundAt: string;
  lastUsedAt?: string | null;
};

export type DeviceSessionDto = {
  id: string;
  deviceId: string;
  platform?: string | null;
  deviceName?: string | null;
  countryCode?: string | null;
  suspicious: boolean;
  lastSeenAt: string;
  createdAt: string;
};

export const authApi = {
  /** POST /auth/register/send-code — legacy OTP when Supabase Auth is not configured */
  sendRegisterCode(body: SendRegisterCodeRequest) {
    return apiRequest<import('../types').SendRegisterCodeResponse>('/auth/register/send-code', {
      method: 'POST',
      body,
      auth: false,
    });
  },

  /** POST /auth/register — legacy when Supabase Auth is not configured */
  register(body: RegisterRequest) {
    return apiRequest<AuthTokensDto>('/auth/register', { method: 'POST', body, auth: false });
  },

  /** POST /auth/sync-profile — create app profile after Supabase phone OTP */
  syncProfile(body: SyncProfileRequest) {
    return apiRequest<AuthUserDto>('/auth/sync-profile', { method: 'POST', body });
  },

  /** POST /auth/oauth/provision — create-or-return app profile after Supabase OAuth (Google/Apple/WeChat) */
  provisionOAuth(body?: { nickname?: string; city?: string }) {
    return apiRequest<AuthUserDto>('/auth/oauth/provision', { method: 'POST', body: body ?? {} });
  },

  /** POST /auth/wechat - native WeChat Open Platform login/register */
  wechat(body: { code: string; nickname?: string; city?: string } & DeviceSessionMetadata) {
    return apiRequest<AuthTokensDto>('/auth/wechat', { method: 'POST', body, auth: false });
  },

  alipayAuthorize() {
    return apiRequest<{
      authorizationUrl: string;
      state: string;
      redirectUri: string;
      expiresIn: number;
    }>('/auth/alipay/authorize', { auth: false });
  },

  alipay(
    body: {
      authCode: string;
      oauthState?: string;
      nickname?: string;
      city?: string;
    } & DeviceSessionMetadata,
  ) {
    return apiRequest<AuthTokensDto>('/auth/alipay', { method: 'POST', body, auth: false });
  },

  bindWechat(code: string) {
    return apiRequest<{ bound: true; provider: 'wechat' }>('/auth/identities/wechat/bind', {
      method: 'POST',
      body: { code },
    });
  },

  bindAlipay(authCode: string, oauthState?: string) {
    return apiRequest<{ bound: true; provider: 'alipay' }>('/auth/identities/alipay/bind', {
      method: 'POST',
      body: { authCode, oauthState },
    });
  },

  sendBindPhoneCode(phone: string) {
    return apiRequest<import('../types').SendRegisterCodeResponse>(
      '/auth/identities/phone/send-code',
      { method: 'POST', body: { phone } },
    );
  },

  verifyBindPhone(phone: string, verificationCode: string) {
    return apiRequest<{ bound: true; provider: 'phone' }>(
      '/auth/identities/phone/verify',
      { method: 'POST', body: { phone, verificationCode } },
    );
  },

  /** POST /auth/google/login - native Google Sign-In for existing accounts */
  googleLogin(body: { idToken: string } & DeviceSessionMetadata) {
    return apiRequest<AuthTokensDto>('/auth/google/login', { method: 'POST', body, auth: false });
  },

  /** POST /auth/google/register - native Google Sign-In for new accounts */
  googleRegister(
    body: { idToken: string; nickname?: string; city?: string } & DeviceSessionMetadata,
  ) {
    return apiRequest<AuthTokensDto>('/auth/google/register', { method: 'POST', body, auth: false });
  },

  /** POST /auth/google/dev-register - local-dev fallback while Google Web OAuth is unavailable */
  googleDevRegister(body: { nickname?: string; city?: string }) {
    return apiRequest<AuthTokensDto>('/auth/google/dev-register', { method: 'POST', body, auth: false });
  },

  /** POST /auth/login */
  login(body: LoginRequest) {
    return apiRequest<AuthTokensDto>('/auth/login', { method: 'POST', body, auth: false });
  },

  /** POST /auth/login/send-code */
  sendLoginCode(body: SendRegisterCodeRequest) {
    return apiRequest<import('../types').SendRegisterCodeResponse>('/auth/login/send-code', {
      method: 'POST',
      body,
      auth: false,
    });
  },

  /** POST /auth/login/verify */
  loginVerify(body: { phone: string; verificationCode: string; deviceId?: string; platform?: string; deviceName?: string }) {
    return apiRequest<AuthTokensDto>('/auth/login/verify', { method: 'POST', body, auth: false });
  },

  /** POST /auth/logout */
  logout() {
    return apiRequest<void>('/auth/logout', { method: 'POST' });
  },

  /** POST /auth/refresh */
  refresh(refreshToken: string) {
    return apiRequest<AuthTokensDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    });
  },

  /** GET /auth/me */
  me() {
    return apiRequest<AuthUserDto>('/auth/me');
  },

  /** POST /auth/change-password */
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return apiRequest<void>('/auth/change-password', { method: 'POST', body });
  },

  identities() {
    return apiRequest<AuthIdentityDto[]>('/auth/identities');
  },

  unbindIdentity(identityId: string) {
    return apiRequest<void>(`/auth/identities/${encodeURIComponent(identityId)}`, {
      method: 'DELETE',
    });
  },

  sessions() {
    return apiRequest<DeviceSessionDto[]>('/auth/sessions');
  },

  revokeSession(sessionId: string) {
    return apiRequest<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },

  mergePhoneAccount(body: { phone: string; password: string }) {
    return apiRequest<AuthTokensDto>('/auth/account-merge/phone', {
      method: 'POST',
      body,
    });
  },

  mergeThirdPartyAccount(
    provider: 'wechat' | 'alipay',
    authorizationCode: string,
  ) {
    return apiRequest<{ merged: boolean; provider: 'wechat' | 'alipay' }>(
      '/auth/account-merge/identity',
      { method: 'POST', body: { provider, authorizationCode } },
    );
  },
};
