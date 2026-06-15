import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { AppLanguage, setAppLanguage } from '../i18n';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius } from '../theme';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const { toast } = useApp();
  const current = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const setLang = async (lang: AppLanguage) => {
    if ((lang === 'zh' && current === 'zh') || (lang === 'en' && current === 'en')) return;
    await setAppLanguage(lang);
    toast(t('toast.languageChanged'));
  };

  return (
    <View style={styles.wrap}>
      {!compact ? <Text style={styles.label}>{t('common.fields.language')}</Text> : null}
      <View style={styles.row}>
        {(['zh', 'en'] as AppLanguage[]).map((lang) => (
          <Pressable
            key={lang}
            style={[styles.pill, current === lang && styles.pillActive]}
            onPress={() => setLang(lang)}
          >
            <Text style={[styles.pillText, current === lang && styles.pillTextActive]}>
              {lang === 'zh' ? t('common.chinese') : t('common.english')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  label: {
    fontWeight: fonts.weights.bold,
    fontSize: 13,
    marginBottom: 8,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#ffffff',
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  pillText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  pillTextActive: {
    color: colors.text,
  },
});
