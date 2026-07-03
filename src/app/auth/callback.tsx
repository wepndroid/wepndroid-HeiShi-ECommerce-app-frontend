import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { completeOAuthFromUrl } from '../../services/authService';
import { colors } from '../../theme';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const initial = await Linking.getInitialURL();
      const url = initial ?? '';
      const user = url ? await completeOAuthFromUrl(url) : null;
      if (cancelled) return;
      router.replace(user ? '/' : '/login');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.brand2} />
    </View>
  );
}
