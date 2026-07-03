import { create } from 'zustand';
import { router } from 'expo-router';
import i18n from '../i18n';
import { AuthErrorKey, AuthUser, saveSession } from '../data/auth';
import { loginWithAuth, logoutWithAuth, registerWithAuth } from '../services/authService';
import { ROOT_PATH } from '../routing/paths';
import { toast } from './uiStore';

interface RegisterInput {
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  avatarUri: string;
  avatarMimeType?: string;
  avatarFileName?: string;
  city: string;
}

// Auth/session slice: the logged-in user, bootstrap-ready flag, and the
// resolved profile avatar. Auth actions live here so any layer can call them.
interface AuthState {
  user: AuthUser | null;
  authReady: boolean;
  profileAvatarUrl?: string;
  setUser: (user: AuthUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  setProfileAvatarUrl: (url?: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  login: (phone: string, password: string) => Promise<{ error?: AuthErrorKey }>;
  register: (input: RegisterInput) => Promise<{ error?: AuthErrorKey }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authReady: false,
  profileAvatarUrl: undefined,
  setUser: (user) => set({ user }),
  setAuthReady: (ready) => set({ authReady: ready }),
  setProfileAvatarUrl: (url) => set({ profileAvatarUrl: url }),
  updateUser: (patch) => {
    set((state) => {
      if (!state.user) return state;
      const next = { ...state.user, ...patch };
      void saveSession(next);
      return {
        user: next,
        ...(patch.avatarUrl !== undefined ? { profileAvatarUrl: patch.avatarUrl } : {}),
      };
    });
  },
  login: async (phone, password) => {
    const result = await loginWithAuth(phone, password);
    if ('error' in result) return { error: result.error };
    set({ user: result.user });
    return {};
  },
  register: async (input) => {
    const result = await registerWithAuth(input);
    if ('error' in result) return { error: result.error };
    set({ user: result.user });
    return {};
  },
  logout: async () => {
    await logoutWithAuth();
    set({ user: null, profileAvatarUrl: undefined });
    // Lazy require breaks the import cycle: chat/checkout stores import authStore.
    // These are only needed at logout time, long after modules have initialized.
    const { useChatStore } = require('./chatStore') as typeof import('./chatStore');
    const { useCheckoutStore } = require('./checkoutStore') as typeof import('./checkoutStore');
    useChatStore.getState().reset();
    useCheckoutStore.getState().reset();
    toast(i18n.t('toast.loggedOut'));
    router.replace(ROOT_PATH);
  },
}));

/** Convenience accessor for non-React callers that just need the current user. */
export const getUser = () => useAuthStore.getState().user;
export const isLoggedIn = () => useAuthStore.getState().user != null;
