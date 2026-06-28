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

  /** POST /auth/login */
  login(body: LoginRequest) {
    return apiRequest<AuthTokensDto>('/auth/login', { method: 'POST', body, auth: false });
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
