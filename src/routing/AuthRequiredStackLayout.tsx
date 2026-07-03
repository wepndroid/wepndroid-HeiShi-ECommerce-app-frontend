import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/uiStore';

/** Stack layout that redirects guests to login (settings, profile, local/category, etc.). */
export function AuthRequiredStackLayout() {
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (authReady && !isLoggedIn) {
      toast(t('toast.loginRequired'));
    }
  }, [authReady, isLoggedIn, toast, t]);

  if (!authReady) return null;

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}