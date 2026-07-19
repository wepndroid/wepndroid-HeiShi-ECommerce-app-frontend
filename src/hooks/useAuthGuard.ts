import React from 'react';
import { usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { nav } from '../store/navigation';
import { createPendingAction } from '../services/pendingActionService';
import { toast } from '../store/uiStore';

/** Redirect guests to login when a protected screen mounts. */
export function useAuthGuard() {
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { t } = useTranslation();
  const pathname = usePathname();

  React.useEffect(() => {
    if (authReady && !isLoggedIn) {
      useAuthStore.getState().setPendingAuthPath(pathname);
      void createPendingAction(pathname).catch(() => undefined);
      toast(t('toast.loginRequired'));
      nav('login');
    }
  }, [authReady, isLoggedIn, pathname, t]);
}
