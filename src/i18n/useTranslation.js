import { useContext } from 'react';
import { I18nContext } from './context';

/**
 * Custom hook for accessing the i18n translation system.
 *
 * @returns {{
 *   t: (key: string, params?: Record<string, string|number>) => string,
 *   language: string,
 *   setLanguage: (lang: string) => void,
 *   languages: string[],
 *   languageNames: Record<string, string>
 * }}
 *
 * @example
 *   const { t, language, setLanguage, languages } = useTranslation();
 *   // Simple lookup
 *   t('navbar.home')          // "Beranda" (id) or "Home" (en)
 *   // With interpolation
 *   t('common.campaign_hash', { id: 5 })  // "Kampanye #5"
 *   // Switch language
 *   setLanguage('en');
 */
const useTranslation = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error(
      'useTranslation must be used within an <I18nProvider>. ' +
      'Wrap your app (or the component tree) with <I18nProvider> from "i18n/I18nContext".'
    );
  }

  return context;
};

export default useTranslation;
