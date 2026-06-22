import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zh from './locales/zh';

export const LANGUAGE_KEY = 'appLanguage';
export type AppLanguage = 'en' | 'zh';

const deviceLang = Localization.getLocales()[0]?.languageCode;
const fallbackLng: AppLanguage = deviceLang === 'zh' ? 'zh' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: fallbackLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
  if (stored === 'en' || stored === 'zh') {
    void i18n.changeLanguage(stored);
  }
});

export async function setAppLanguage(lang: AppLanguage) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

/** Language code sent to the API (`Accept-Language` header). */
export function getApiLanguage(): AppLanguage {
  return i18n.language.startsWith('zh') ? 'zh' : 'en';
}

export default i18n;
