import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { RegionSheet } from '../components/RegionSheet';
import { BottomNav, Toast } from '../components/UI';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, useFonts } from '../components/typography';
import { showBottomNav } from '../routing/paths';
import { colors } from '../theme';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = showBottomNav(pathname);
  const blurTargetRef = useRef<View>(null);

  return (
    <View style={styles.app}>
      <BlurTargetView ref={blurTargetRef} style={styles.content} collapsable={false}>
        {children}
      </BlurTargetView>
      {showNav ? <BottomNav blurTarget={blurTargetRef} /> : null}
      <RegionSheet />
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={styles.root} edges={['top']}>
          <AppShell>
            <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
          </AppShell>
          <StatusBar style="dark" />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
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
