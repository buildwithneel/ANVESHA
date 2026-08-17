import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from './dictionaries/en.json';
import hi from './dictionaries/hi.json';
import gu from './dictionaries/gu.json';

const dictionaries = { en, hi, gu };

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

const I18nContext = createContext(null);

const STORAGE_KEY = 'railguard_language_preference';

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((langCode) => {
    if (dictionaries[langCode]) {
      setLanguageState(langCode);
      try {
        localStorage.setItem(STORAGE_KEY, langCode);
      } catch (e) {
        console.warn('Could not save language preference:', e);
      }
    }
  }, []);

  const t = useCallback(
    (keyPath, fallback = '') => {
      const dict = dictionaries[language] || dictionaries.en;
      const keys = keyPath.split('.');
      let result = dict;
      for (const k of keys) {
        if (result && result[k] !== undefined) {
          result = result[k];
        } else {
          // Fallback to English dict if missing in selected language
          let engResult = dictionaries.en;
          for (const ek of keys) {
            if (engResult && engResult[ek] !== undefined) {
              engResult = engResult[ek];
            } else {
              return fallback || keyPath;
            }
          }
          return typeof engResult === 'string' ? engResult : (fallback || keyPath);
        }
      }
      return typeof result === 'string' ? result : (fallback || keyPath);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGES,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
