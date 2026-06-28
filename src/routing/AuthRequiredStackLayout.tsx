import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

/** Stack layout that redirects guests to login (settings, profile, local/category, etc.). */
export function AuthRequiredStackLayout() {
  const { isLoggedIn, authReady, toast } = useApp();
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