import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../store/queryClient';
import { AppBootstrap } from '../store/AppBootstrap';
import { CheckoutPickerHost } from '../components/CheckoutPickerHost';
import { RegionSheet } from '../components/RegionSheet';
import { StripeProvider } from '../components/StripeProvider';
import { BottomNav, Toast, TopBanner } from '../components/UI';
import { SplashOverlay } from '../components/SplashOverlay';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, useFonts } from '../components/typography';
import { showBottomNav } from '../routing/paths';
import { completeOAuthFromUrl } from '../services/authService';
import { colors } from '../theme';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = showBottomNav(pathname);
  const blurTargetRef = useRef<View>(null);

  return (
    <View style={styles.app}>
      <TopBanner />
      <BlurTargetView ref={blurTargetRef} style={styles.content} collapsable={false}>
        {children}
      </BlurTargetView>
      {showNav ? <BottomNav blurTarget={blurTargetRef} /> : null}
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  const [splashDone, setSplashDone] = React.useState(false);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url.includes('auth/callback')) {
        void completeOAuthFromUrl(url);
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppBootstrap />
          <SafeAreaView style={styles.root} edges={['top']}>
            <AppShell>
              <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
            </AppShell>
            <RegionSheet />
            <CheckoutPickerHost />
            <StatusBar style="dark" />
            {!splashDone ? <SplashOverlay onFinish={() => setSplashDone(true)} /> : null}
          </SafeAreaView>
        </QueryClientProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  app: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
