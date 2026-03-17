import { createContext } from 'react';

/**
 * I18n React context — holds language state and the translation function.
 * Separated into its own file to satisfy React Fast Refresh (only components
 * should be exported from .jsx files).
 */
export const I18nContext = createContext(null);
