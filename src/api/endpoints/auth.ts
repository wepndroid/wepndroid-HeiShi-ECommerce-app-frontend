import { apiRequest } from '../client';
import type {
  AuthTokensDto,
  AuthUserDto,
  LoginRequest,
  RegisterRequest,
} from '../types';

export const authApi = {
  /** POST /auth/register */
  register(body: RegisterRequest) {
    return apiRequest<AuthTokensDto>('/auth/register', { method: 'POST', body, auth: false });
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
};
