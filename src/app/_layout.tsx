import React, { useEffect, useRef } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, usePathname, type Href } from 'expo-router';
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
import {
  extractShareToken,
  recordRegistrationAttribution,
  recordShareEvent,
  resolveSharedListing,
} from '../services/sharingService';
import { ensureAnonymousSession, linkAnonymousSessionAfterLogin } from '../services/anonymousSessionService';
import { useAuthStore } from '../store/authStore';
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
  const user = useAuthStore((state) => state.user);
  const authReady = useAuthStore((state) => state.authReady);
  const clipboardCheckInProgress = useRef(false);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url.includes('auth/callback')) {
        void completeOAuthFromUrl(url);
        return;
      }
      const shareToken = url.match(/[?&]share=([^&#]+)/)?.[1];
      const listingId = url.match(/(?:listing|detail)\/(\d+)/)?.[1];
      if (listingId) {
        if (shareToken) void recordShareEvent(decodeURIComponent(shareToken), 'open');
        router.push(`/detail/${listingId}`);
        return;
      }
      const supportId = url.match(/support\/([A-Za-z0-9-]+)/)?.[1];
      if (supportId) {
        router.push('/support' as Href);
        return;
      }
      const tokenFromPath = url.match(/\/shares\/([^/?#]+)/)?.[1];
      if (tokenFromPath) {
        const token = decodeURIComponent(tokenFromPath);
        void resolveSharedListing(token)
          .then((shared) => {
            void recordShareEvent(token, 'open');
            router.push(`/detail/${shared.listingId}`);
          })
          .catch(() => {
            Alert.alert(
              'Listing unavailable',
              'This shared listing has expired or is no longer available.',
            );
          });
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const inspectClipboardShare = async () => {
      if (clipboardCheckInProgress.current) return;
      clipboardCheckInProgress.current = true;
      try {
        const text = await Clipboard.getStringAsync();
        const token = extractShareToken(text);
        if (!token) return;
        const lastToken = await AsyncStorage.getItem('heymarket:lastClipboardShareToken');
        if (lastToken === token) return;
        const shared = await resolveSharedListing(token);
        Alert.alert(
          'Shared product found',
          `Open “${shared.title}”?`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Open',
              onPress: () => {
                void AsyncStorage.setItem('heymarket:lastClipboardShareToken', token);
                void recordShareEvent(token, 'open');
                router.push(`/detail/${shared.listingId}`);
              },
            },
          ],
        );
      } catch {
        const text = await Clipboard.getStringAsync().catch(() => '');
        if (extractShareToken(text)) {
          Alert.alert(
            'Listing unavailable',
            'This shared listing has expired or is no longer available.',
          );
        }
      } finally {
        clipboardCheckInProgress.current = false;
      }
    };
    if (splashDone) void inspectClipboardShare();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && splashDone) void inspectClipboardShare();
    });
    return () => subscription.remove();
  }, [splashDone]);

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      void linkAnonymousSessionAfterLogin()
        .then(() => recordRegistrationAttribution())
        .catch(() => undefined);
    } else {
      void ensureAnonymousSession().catch(() => undefined);
    }
  }, [authReady, user]);

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
