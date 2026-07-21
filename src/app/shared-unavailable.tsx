import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { Text } from '../components/typography';
import { colors, radius, spacing } from '../theme';

export default function SharedListingUnavailableScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <AppIcon name="warning" size={34} color={colors.muted} />
        </View>
        <Text style={styles.title}>{t('sharedUnavailable.title')}</Text>
        <Text style={styles.body}>{t('sharedUnavailable.body')}</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>{t('sharedUnavailable.home')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 360,
  },
  button: {
    minWidth: 220,
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand2,
    marginTop: 28,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
