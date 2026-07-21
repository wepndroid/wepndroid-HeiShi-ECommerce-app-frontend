import React, { useEffect, useRef } from 'react';
import { Alert, AppState, Platform, StyleSheet, View } from 'react-native';
import * as Application from 'expo-application';
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
import {
  ensureAnonymousSession,
  hasPromptedForAnonymousAnalyticsConsent,
  linkAnonymousSessionAfterLogin,
  setAnonymousAnalyticsConsent,
} from '../services/anonymousSessionService';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import i18n from '../i18n';

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
  const [initialLinkCheckDone, setInitialLinkCheckDone] = React.useState(false);
  const user = useAuthStore((state) => state.user);
  const authReady = useAuthStore((state) => state.authReady);
  const clipboardCheckInProgress = useRef(false);
  const preferredNavigationHandled = useRef(false);
  const consentPromptInProgress = useRef(false);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url.includes('auth/callback')) {
        void completeOAuthFromUrl(url);
        return true;
      }
      const shareToken = url.match(/[?&]share=([^&#]+)/)?.[1];
      const listingId = url.match(/(?:listing|detail)\/(\d+)/)?.[1];
      if (listingId) {
        if (shareToken) {
          const token = decodeURIComponent(shareToken);
          void resolveSharedListing(token)
            .then((shared) => {
              void recordShareEvent(token, 'open').catch(() => undefined);
              router.push(`/detail/${shared.listingId}`);
            })
            .catch(() => {
              router.replace('/shared-unavailable' as Href);
            });
          return true;
        }
        router.push(`/detail/${listingId}`);
        return true;
      }
      const supportId = url.match(/support\/([A-Za-z0-9-]+)/)?.[1];
      if (supportId) {
        router.push('/support' as Href);
        return true;
      }
      const tokenFromPath = url.match(/\/(?:shares|s)\/([^/?#]+)/)?.[1];
      if (tokenFromPath) {
        const token = decodeURIComponent(tokenFromPath);
        void resolveSharedListing(token)
          .then((shared) => {
            void recordShareEvent(token, 'open').catch(() => undefined);
            router.push(`/detail/${shared.listingId}`);
          })
          .catch(() => {
            router.replace('/shared-unavailable' as Href);
          });
        return true;
      }
      return false;
    };
    const inspectInitialNavigation = async () => {
      const initialUrl = await Linking.getInitialURL().catch(() => null);
      if (initialUrl && handleUrl(initialUrl)) {
        preferredNavigationHandled.current = true;
        return;
      }
      if (Platform.OS !== 'android') return;
      const referrer = await Application.getInstallReferrerAsync().catch(() => '');
      const token = extractShareToken(referrer);
      if (!token) return;
      const lastToken = await AsyncStorage.getItem('heymarket:lastInstallReferrerShareToken');
      if (lastToken === token) return;
      try {
        const shared = await resolveSharedListing(token);
        await AsyncStorage.setItem('heymarket:lastInstallReferrerShareToken', token);
        // Attribution is best-effort and must never make a valid shared
        // product look unavailable when analytics delivery is interrupted.
        await recordShareEvent(token, 'open').catch(() => undefined);
        preferredNavigationHandled.current = true;
        router.replace(`/detail/${shared.listingId}`);
      } catch {
        preferredNavigationHandled.current = true;
        router.replace('/shared-unavailable' as Href);
      }
    };
    void inspectInitialNavigation().finally(() => setInitialLinkCheckDone(true));
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (handleUrl(url)) preferredNavigationHandled.current = true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const inspectClipboardShare = async () => {
      if (clipboardCheckInProgress.current) return;
      if (!initialLinkCheckDone || preferredNavigationHandled.current) return;
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
                void recordShareEvent(token, 'open').catch(() => undefined);
                router.push(`/detail/${shared.listingId}`);
              },
            },
          ],
        );
      } catch {
        const text = await Clipboard.getStringAsync().catch(() => '');
        if (extractShareToken(text)) {
          router.replace('/shared-unavailable' as Href);
        }
      } finally {
        clipboardCheckInProgress.current = false;
      }
    };
    if (splashDone && initialLinkCheckDone) void inspectClipboardShare();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // A verified/deferred deep link only outranks clipboard recognition for
        // the current app entry. A later foreground entry must be eligible to
        // recognize a newly copied share command.
        preferredNavigationHandled.current = false;
        return;
      }
      if (splashDone) void inspectClipboardShare();
    });
    return () => subscription.remove();
  }, [initialLinkCheckDone, splashDone]);

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

  useEffect(() => {
    if (!authReady || user || !splashDone || consentPromptInProgress.current) return;
    const requestConsent = async () => {
      if (await hasPromptedForAnonymousAnalyticsConsent()) return;
      consentPromptInProgress.current = true;
      const zh = i18n.language.toLowerCase().startsWith('zh');
      Alert.alert(
        zh ? '帮助改善商品推荐' : 'Help improve recommendations',
        zh
          ? '是否允许我们使用游客浏览和分享事件来改善推荐？我们不会将这些数据关联到您的账户，除非您同意并后续登录。'
          : 'Allow guest browsing and sharing events to improve recommendations? We will not associate this data with your account unless you consent and later sign in.',
        [
          {
            text: zh ? '不允许' : "Don't allow",
            style: 'cancel',
            onPress: () => {
              void setAnonymousAnalyticsConsent('denied').finally(() => {
                consentPromptInProgress.current = false;
              });
            },
          },
          {
            text: zh ? '允许' : 'Allow',
            onPress: () => {
              void setAnonymousAnalyticsConsent('granted').finally(() => {
                consentPromptInProgress.current = false;
              });
            },
          },
        ],
        { cancelable: false },
      );
    };
    void requestConsent().catch(() => {
      consentPromptInProgress.current = false;
    });
  }, [authReady, splashDone, user]);

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
