import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initI18n, resetPreloadState } from '../utils/translations/preload';
import { LANGUAGES, LANGUAGE_LABELS } from '../utils/translations/constants';
import { detectLanguageWithPriority } from '../utils/translations/detection';
import logger from '../utils/logger';

// Ré-exporter pour rétrocompatibilité
export { LANGUAGES, LANGUAGE_LABELS };

const log = logger.module('LanguageContext');

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // ✅ PHASE 2.1 : Charger la langue avec priorité localStorage puis détection automatique
  const [language, setLanguageState] = useState(() => {
    try {
      // Fonction helper pour récupérer la langue depuis localStorage
      const getStoredLanguage = () => {
        try {
          const saved = localStorage.getItem('app_language');
          return saved && (saved === LANGUAGES.FR || saved === LANGUAGES.EN) ? saved : null;
        } catch {
          return null;
        }
      };
      
      // Détecter avec priorité localStorage puis navigateur
      const detected = detectLanguageWithPriority(getStoredLanguage);
      log.debug(`[LanguageProvider] Langue initiale détectée: ${detected}`);
      return detected;
    } catch (error) {
      log.error('[LanguageProvider] Erreur lors de l\'initialisation de la langue:', error);
      return LANGUAGES.FR;
    }
  });

  // Sauvegarder la langue dans localStorage
  const setLanguage = useCallback(async (newLanguage) => {
    if (newLanguage !== LANGUAGES.FR && newLanguage !== LANGUAGES.EN) {
      console.warn(`[LanguageContext] Langue invalide: ${newLanguage}, utilisation de ${LANGUAGES.FR}`);
      newLanguage = LANGUAGES.FR;
    }
    
    try {
      localStorage.setItem('app_language', newLanguage);
      
      // ✅ OPTIMISATION : Réinitialiser et précharger les traductions critiques AVANT de changer la langue
      // Cela évite d'afficher les clés de traduction lors du premier changement
      resetPreloadState(newLanguage);
      
      // Attendre le chargement des traductions critiques avant de changer la langue
      // waitForCritical: true pour garantir que les traductions sont disponibles
      await initI18n(newLanguage, { preloadSecondary: false, waitForCritical: true });
      
      // Maintenant que les traductions critiques sont chargées, changer la langue
      setLanguageState(newLanguage);
      
      // Précharger les traductions secondaires en arrière-plan (non bloquant)
      initI18n(newLanguage, { preloadSecondary: true, waitForCritical: false }).catch(error => {
        log.warn('[LanguageContext] Erreur lors du preload secondaire (non bloquant):', error);
      });
    } catch (error) {
      console.error('[LanguageContext] Erreur lors de la sauvegarde de la langue:', error);
      // En cas d'erreur, changer quand même la langue (fallback)
      setLanguageState(newLanguage);
    }
  }, []);

  // ✅ PHASE 1.3 : Précharger les traductions critiques au démarrage et lors du changement de langue
  useEffect(() => {
    // Initialiser i18n avec preload des traductions critiques
    // waitForCritical: false pour ne pas bloquer le rendu initial
    initI18n(language, {
      preloadSecondary: true,
      waitForCritical: false
    }).catch(error => {
      console.error('[LanguageContext] Erreur lors de l\'initialisation i18n:', error);
    });
  }, [language]); // Exécuté au montage et lors du changement de langue

  const value = {
    language,
    setLanguage,
    isFrench: language === LANGUAGES.FR,
    isEnglish: language === LANGUAGES.EN
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // ✅ FIX : Retourner une valeur par défaut au lieu de lancer une erreur
  // Cela permet d'éviter les erreurs pendant l'initialisation du provider
  if (!context) {
    console.warn('[useLanguage] Context not available, using default language (fr)');
    return {
      language: LANGUAGES.FR,
      setLanguage: () => {},
      isFrench: true,
      isEnglish: false
    };
  }
  return context;
};

