import { useCallback } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { en } from '@/lib/translations/en';
import { it } from '@/lib/translations/it';

type TranslationType = typeof en;

// Type to get all possible paths in the translations object
type DotNotation<T extends object> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}` | `${K}.${DotNotation<T[K]>}`
    : `${K}`;
}[keyof T & (string | number)];

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  const getTranslations = useCallback(() => {
    switch (language) {
      case 'it':
        return it;
      case 'en':
      default:
        return en;
    }
  }, [language]);

  const t = useCallback(
    (key: DotNotation<TranslationType>) => {
      const translations = getTranslations();
      const keys = key.split('.');
      
      let value: unknown = translations;
      
      for (const k of keys) {
        if (typeof value !== 'object' || value === null || !(k in (value as Record<string, unknown>))) {
          console.warn(`Translation key not found: ${key}`);
          return key; // Return the key if translation is missing
        }
        value = (value as Record<string, unknown>)[k];
      }
      
      return value as string;
    },
    [getTranslations]
  );

  return { t, language };
}; 