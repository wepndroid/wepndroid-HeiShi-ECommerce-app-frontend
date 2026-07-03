import { create } from 'zustand';
import i18n from '../i18n';
import { clearAppCache, getAppCacheSizeLabel } from '../services/settingsService';
import { invalidateCatalog } from '../utils/catalogSync';
import { useAuthStore } from './authStore';
import { useSearchStore } from './searchStore';
import { toast } from './uiStore';

// App storage/cache management (display label + clear action).
interface SettingsState {
  cacheSize: string;
  setCacheSize: (size: string) => void;
  clearCache: () => Promise<void>;
  refreshCacheSize: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  cacheSize: '',
  setCacheSize: (size) => set({ cacheSize: size }),
  clearCache: async () => {
    const loggedIn = useAuthStore.getState().user != null;
    try {
      await clearAppCache(loggedIn);
      useSearchStore.getState().clearImageSearch();
      invalidateCatalog();
      set({ cacheSize: await getAppCacheSizeLabel() });
      toast(i18n.t('toast.cacheCleared'));
    } catch {
      set({ cacheSize: await getAppCacheSizeLabel() });
      toast(i18n.t('toast.cacheClearFailed'));
    }
  },
  refreshCacheSize: async () => {
    set({ cacheSize: await getAppCacheSizeLabel() });
  },
}));
