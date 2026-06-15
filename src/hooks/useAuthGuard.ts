import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

/** Redirect guests to login when a protected screen mounts. */
export function useAuthGuard() {
  const { isLoggedIn, authReady, nav, toast } = useApp();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (authReady && !isLoggedIn) {
      toast(t('toast.loginRequired'));
      nav('login');
    }
  }, [authReady, isLoggedIn, nav, toast, t]);
}
