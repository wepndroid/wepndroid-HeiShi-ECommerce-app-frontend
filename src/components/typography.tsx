import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  TextProps,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { plainTextInput } from '../theme';

const INTER = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
} as const;

type WeightBucket = keyof typeof INTER;

function weightBucket(fontWeight?: TextStyle['fontWeight']): WeightBucket {
  if (fontWeight == null) return 'regular';
  if (fontWeight === 'bold') return 'bold';
  if (fontWeight === 'normal') return 'regular';

  const numeric =
    typeof fontWeight === 'number' ? fontWeight : parseInt(String(fontWeight), 10);
  if (Number.isNaN(numeric)) return 'regular';
  if (numeric >= 600) return 'bold';
  if (numeric >= 500) return 'medium';
  return 'regular';
}

function englishFontStyle(style: TextProps['style']): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  return { fontFamily: INTER[weightBucket(flat.fontWeight)] };
}

export function Text({ style, ...rest }: TextProps) {
  const { i18n } = useTranslation();
  const isEn = !i18n.language.startsWith('zh');
  return <RNText style={[style, isEn ? englishFontStyle(style) : null]} {...rest} />;
}

export function TextInput({ style, ...rest }: TextInputProps) {
  const { i18n } = useTranslation();
  const isEn = !i18n.language.startsWith('zh');
  return (
    <RNTextInput
      style={[plainTextInput, style, isEn ? englishFontStyle(style) : null]}
      underlineColorAndroid="transparent"
      {...rest}
    />
  );
}

export {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
