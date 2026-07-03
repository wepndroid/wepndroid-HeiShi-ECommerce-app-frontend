import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { nav } from '../store/navigation';
import { toast } from '../store/uiStore';

/** Redirect guests to login when a protected screen mounts. */
export function useAuthGuard() {
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (authReady && !isLoggedIn) {
      toast(t('toast.loginRequired'));
      nav('login');
    }
  }, [authReady, isLoggedIn, nav, toast, t]);
}
