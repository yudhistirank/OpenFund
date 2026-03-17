import React, { useState, useEffect, useCallback } from 'react';
import { I18nContext } from './context';
import en from './locales/en.json';
import id from './locales/id.json';

const STORAGE_KEY = 'openfund_language';
const DEFAULT_LANGUAGE = 'id';
const SUPPORTED_LANGUAGES = ['id', 'en'];

const translations = { en, id };

const languageNames = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

/**
 * Resolves a nested key like "navbar.home" from a translations object.
 * Returns the value if found, or the key itself as a fallback.
 */
const getNestedValue = (obj, keyPath) => {
  const keys = keyPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return keyPath;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : keyPath;
};

/**
 * I18nProvider — wraps the app and provides language state + translation function.
 *
 * Usage:
 *   <I18nProvider>
 *     <App />
 *   </I18nProvider>
 */
const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
    return DEFAULT_LANGUAGE;
  });

  // Persist language preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage not available
    }
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    } else {
      console.warn(`[i18n] Unsupported language: "${lang}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }
  }, []);

  /**
   * Translation function.
   * Supports nested keys (e.g. "navbar.home") and simple interpolation
   * via {{placeholder}} syntax.
   *
   * @param {string} key - Dot-separated translation key
   * @param {Record<string, string|number>} [params] - Optional interpolation values
   * @returns {string} Translated string, or the key if not found
   */
  const t = useCallback(
    (key, params) => {
      const currentTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
      let value = getNestedValue(currentTranslations, key);

      // If not found in the current language, try the default language
      if (value === key && language !== DEFAULT_LANGUAGE) {
        value = getNestedValue(translations[DEFAULT_LANGUAGE], key);
      }

      // Interpolation: replace {{placeholder}} with provided params
      if (typeof value === 'string' && params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue));
        });
      }

      return typeof value === 'string' ? value : key;
    },
    [language]
  );

  const contextValue = {
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    languageNames,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;
