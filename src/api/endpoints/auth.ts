import { apiRequest } from '../client';
import type {
  AuthTokensDto,
  AuthUserDto,
  LoginRequest,
  RegisterRequest,
  SendRegisterCodeRequest,
  SyncProfileRequest,
} from '../types';

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
  wechat(body: { code: string; nickname?: string; city?: string }) {
    return apiRequest<AuthTokensDto>('/auth/wechat', { method: 'POST', body, auth: false });
  },

  /** POST /auth/google/login - native Google Sign-In for existing accounts */
  googleLogin(body: { idToken: string }) {
    return apiRequest<AuthTokensDto>('/auth/google/login', { method: 'POST', body, auth: false });
  },

  /** POST /auth/google/register - native Google Sign-In for new accounts */
  googleRegister(body: { idToken: string; nickname?: string; city?: string }) {
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
};
