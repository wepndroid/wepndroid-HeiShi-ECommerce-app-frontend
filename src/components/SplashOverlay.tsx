import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './typography';
import { LOGO_ASPECT, LOGO_EN, LOGO_ZH } from '../assets/logos';
import { colors, fonts } from '../theme';

const SPLASH_MS = 1600;

export function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const { t, i18n } = useTranslation();
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);
  const logo = i18n.language.startsWith('zh') ? LOGO_ZH : LOGO_EN;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onFinish();
      });
    }, SPLASH_MS);
    return () => clearTimeout(fadeTimer);
  }, [onFinish, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="auto">
      <View style={styles.center}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.tagline}>{t('splash.tagline')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 220,
    height: 220 / LOGO_ASPECT,
  },
  tagline: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.en.medium,
    color: colors.muted,
    textAlign: 'center',
  },
});
