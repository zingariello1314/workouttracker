/**
 * Helpers pour les tests
 * Fournit des wrappers et utilitaires communs
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import { LANGUAGES } from '../context/LanguageContext';

/**
 * Wrapper avec LanguageProvider pour les tests
 */
export const renderWithLanguageProvider = (ui, options = {}) => {
  const { language = LANGUAGES.FR, ...renderOptions } = options;
  
  const Wrapper = ({ children }) => (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock simple pour useTranslation dans les tests
 */
export const mockTranslation = (key, params = {}) => {
  // Retourner la clé par défaut pour les tests
  return key;
};

