import { create } from 'zustand';

// Transient UI feedback (toast + top banner). Previously lived in AppContext.
// Timers are module-scoped so actions can be called from anywhere (including
// other store actions) without a React component in scope.
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let topBannerTimer: ReturnType<typeof setTimeout> | null = null;

interface UiState {
  toastMessage: string;
  toastVisible: boolean;
  topBannerMessage: string;
  topBannerVisible: boolean;
  toast: (msg: string) => void;
  showTopBanner: (msg: string) => void;
  clearTopBanner: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toastMessage: '',
  toastVisible: false,
  topBannerMessage: '',
  topBannerVisible: false,
  toast: (msg) => {
    set({ toastMessage: msg, toastVisible: true });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toastVisible: false }), 1700);
  },
  showTopBanner: (msg) => {
    set({ topBannerMessage: msg, topBannerVisible: true });
    if (topBannerTimer) clearTimeout(topBannerTimer);
    topBannerTimer = setTimeout(() => set({ topBannerVisible: false }), 5000);
  },
  clearTopBanner: () => {
    set({ topBannerVisible: false });
    if (topBannerTimer) clearTimeout(topBannerTimer);
  },
}));

/** Imperative toast for use inside non-React store actions/services. */
export const toast = (msg: string) => useUiStore.getState().toast(msg);
export const showTopBanner = (msg: string) => useUiStore.getState().showTopBanner(msg);
