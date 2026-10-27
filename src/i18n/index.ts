import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FALLBACK_LANGUAGE, resolveLanguage, type Language } from './languages';
import en from './locales/en.json';
import nl from './locales/nl.json';

export function detectDeviceLanguage(): Language {
  return resolveLanguage(getLocales()[0]?.languageCode);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { nl: { translation: nl }, en: { translation: en } },
    lng: detectDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    initAsync: false,
  });
}

export function setLanguage(language: Language): Promise<void> {
  return i18n.changeLanguage(language).then(() => undefined);
}

export default i18n;
export { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, resolveLanguage, isLanguage } from './languages';
export type { Language } from './languages';
