/**
 * ✅ PHASE 1.3 : Système de Preload des Traductions Critiques
 * 
 * Performance :
 * - Préchargement intelligent des namespaces critiques
 * - Chargement en parallèle pour optimiser les performances
 * - Pas de blocage du rendu initial (chargement asynchrone)
 * - Métriques de performance pour monitoring
 * 
 * Architecture :
 * - Configuration centralisée des namespaces critiques
 * - Initialisation au démarrage de l'application
 * - Gestion des erreurs robuste
 * - Support du changement de langue dynamique
 */

import { loadTranslationNamespaces, preloadNamespace } from './loader';
import { LANGUAGES } from './constants';
import logger from '../logger';

const log = logger.module('translations-preload');

// ==================== CONFIGURATION ====================

/**
 * Namespaces critiques à précharger au démarrage
 * Ces namespaces sont toujours visibles et doivent être disponibles immédiatement
 */
export const CRITICAL_NAMESPACES = [
  'common',  // Boutons, actions communes (save, cancel, etc.)
  'nav',     // Navigation principale
  'home'     // Page d'accueil
];

/**
 * Namespaces secondaires (préchargés après les critiques)
 * Ces namespaces sont souvent utilisés mais peuvent attendre quelques ms
 */
export const SECONDARY_NAMESPACES = [
  'settings',  // Paramètres (accessible depuis plusieurs endroits)
  'general',   // Termes généraux (jours, minutes, etc.)
  'justification', // Justifications de jours
  'calendar',  // Calendrier
  'stats',    // Statistiques
  'today',     // Onglet Aujourd'hui
  'exercises', // Exercices exceptionnels
  'dataEntry', // Saisie de données
  'program',   // Programmes d'entraînement
  'exercisesTab', // Onglet Exercices
  'endurance',  // Onglet Endurance
  'progress',   // Onglet Progression
  'history',     // Onglet Historique
  'charts',      // Onglet Graphiques
  'nutrition',   // Onglet Nutrition
  'garmin',      // Onglet Garmin
  'bodyTracking', // Suivi corporel
  'nutritionAnalyses' // Analyses nutritionnelles
];

/**
 * Priorité de chargement
 */
export const PRELOAD_PRIORITY = {
  CRITICAL: 'critical',
  SECONDARY: 'secondary',
  LAZY: 'lazy'
};

// ==================== ÉTAT DU PRELOAD ====================

/**
 * État du preload par langue
 */
const preloadState = {
  [LANGUAGES.FR]: {
    critical: { loaded: false, loading: false, error: null },
    secondary: { loaded: false, loading: false, error: null }
  },
  [LANGUAGES.EN]: {
    critical: { loaded: false, loading: false, error: null },
    secondary: { loaded: false, loading: false, error: null }
  }
};

/**
 * Métriques de performance
 */
const performanceMetrics = {
  [LANGUAGES.FR]: {
    critical: { startTime: null, endTime: null, duration: null },
    secondary: { startTime: null, endTime: null, duration: null }
  },
  [LANGUAGES.EN]: {
    critical: { startTime: null, endTime: null, duration: null },
    secondary: { startTime: null, endTime: null, duration: null }
  }
};

// ==================== FONCTIONS DE PRELOAD ====================

/**
 * Précharge les namespaces critiques pour une langue donnée
 * @param {string} language - Code de la langue (fr, en)
 * @returns {Promise<void>}
 */
export const preloadCriticalTranslations = async (language) => {
  const lang = language || LANGUAGES.FR;
  
  // Vérifier si déjà chargé ou en cours de chargement
  if (preloadState[lang]?.critical.loaded) {
    log.debug(`[preloadCriticalTranslations] Déjà chargé pour ${lang}`);
    return;
  }
  
  if (preloadState[lang]?.critical.loading) {
    log.debug(`[preloadCriticalTranslations] Chargement en cours pour ${lang}`);
    return;
  }
  
  // Marquer comme en cours de chargement
  if (!preloadState[lang]) {
    preloadState[lang] = { critical: {}, secondary: {} };
  }
  preloadState[lang].critical.loading = true;
  preloadState[lang].critical.error = null;
  
  // Démarrer le chronomètre
  const startTime = performance.now();
  performanceMetrics[lang].critical.startTime = startTime;
  
  try {
    log.debug(`[preloadCriticalTranslations] Début du preload critique pour ${lang}`);
    
    // Charger tous les namespaces critiques en parallèle
    await loadTranslationNamespaces(lang, CRITICAL_NAMESPACES);
    
    // Marquer comme chargé
    preloadState[lang].critical.loaded = true;
    preloadState[lang].critical.loading = false;
    
    // Calculer la durée
    const endTime = performance.now();
    const duration = endTime - startTime;
    performanceMetrics[lang].critical.endTime = endTime;
    performanceMetrics[lang].critical.duration = duration;
    
    log.info(`[preloadCriticalTranslations] Preload critique terminé pour ${lang} en ${duration.toFixed(2)}ms`);
  } catch (error) {
    // Gérer l'erreur sans casser l'application
    preloadState[lang].critical.loading = false;
    preloadState[lang].critical.error = error;
    
    log.error(`[preloadCriticalTranslations] Erreur lors du preload critique pour ${lang}:`, error);
  }
};

/**
 * Précharge les namespaces secondaires pour une langue donnée
 * @param {string} language - Code de la langue (fr, en)
 * @returns {Promise<void>}
 */
export const preloadSecondaryTranslations = async (language) => {
  const lang = language || LANGUAGES.FR;
  
  // Vérifier si déjà chargé ou en cours de chargement
  if (preloadState[lang]?.secondary.loaded) {
    log.debug(`[preloadSecondaryTranslations] Déjà chargé pour ${lang}`);
    return;
  }
  
  if (preloadState[lang]?.secondary.loading) {
    log.debug(`[preloadSecondaryTranslations] Chargement en cours pour ${lang}`);
    return;
  }
  
  // Marquer comme en cours de chargement
  if (!preloadState[lang]) {
    preloadState[lang] = { critical: {}, secondary: {} };
  }
  preloadState[lang].secondary.loading = true;
  preloadState[lang].secondary.error = null;
  
  // Démarrer le chronomètre
  const startTime = performance.now();
  performanceMetrics[lang].secondary.startTime = startTime;
  
  try {
    log.debug(`[preloadSecondaryTranslations] Début du preload secondaire pour ${lang}`);
    
    // Attendre un court délai pour ne pas bloquer le rendu initial
    // Les namespaces secondaires peuvent attendre quelques millisecondes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Charger tous les namespaces secondaires en parallèle
    await loadTranslationNamespaces(lang, SECONDARY_NAMESPACES);
    
    // Marquer comme chargé
    preloadState[lang].secondary.loaded = true;
    preloadState[lang].secondary.loading = false;
    
    // Calculer la durée
    const endTime = performance.now();
    const duration = endTime - startTime;
    performanceMetrics[lang].secondary.endTime = endTime;
    performanceMetrics[lang].secondary.duration = duration;
    
    log.info(`[preloadSecondaryTranslations] Preload secondaire terminé pour ${lang} en ${duration.toFixed(2)}ms`);
  } catch (error) {
    // Gérer l'erreur sans casser l'application
    preloadState[lang].secondary.loading = false;
    preloadState[lang].secondary.error = error;
    
    log.error(`[preloadSecondaryTranslations] Erreur lors du preload secondaire pour ${lang}:`, error);
  }
};

/**
 * Initialise le système i18n en préchargeant les traductions critiques
 * @param {string} language - Code de la langue (fr, en)
 * @param {Object} options - Options de configuration
 * @param {boolean} options.preloadSecondary - Précharger aussi les namespaces secondaires (défaut: true)
 * @param {boolean} options.waitForCritical - Attendre le chargement critique avant de continuer (défaut: false)
 * @returns {Promise<void>}
 */
export const initI18n = async (language, options = {}) => {
  const lang = language || LANGUAGES.FR;
  const {
    preloadSecondary = true,
    waitForCritical = false
  } = options;
  
  log.debug(`[initI18n] Initialisation i18n pour ${lang}`, options);
  
  // Précharger les namespaces critiques
  const criticalPromise = preloadCriticalTranslations(lang);
  
  // Si waitForCritical est true, attendre le chargement critique
  if (waitForCritical) {
    await criticalPromise;
  } else {
    // Sinon, lancer en arrière-plan (ne pas bloquer)
    criticalPromise.catch(error => {
      log.warn(`[initI18n] Erreur lors du preload critique (non bloquant):`, error);
    });
  }
  
  // Précharger les namespaces secondaires si demandé
  if (preloadSecondary) {
    // Attendre que le preload critique soit terminé avant de lancer le secondaire
    criticalPromise
      .then(() => {
        // Petit délai pour laisser le navigateur respirer
        return new Promise(resolve => setTimeout(resolve, 10));
      })
      .then(() => preloadSecondaryTranslations(lang))
      .catch(error => {
        log.warn(`[initI18n] Erreur lors du preload secondaire (non bloquant):`, error);
      });
  }
  
  log.debug(`[initI18n] Initialisation i18n lancée pour ${lang}`);
};

/**
 * Réinitialise le preload pour une langue (utile lors du changement de langue)
 * @param {string} language - Code de la langue (fr, en)
 */
export const resetPreloadState = (language) => {
  const lang = language || LANGUAGES.FR;
  
  if (preloadState[lang]) {
    preloadState[lang].critical.loaded = false;
    preloadState[lang].critical.loading = false;
    preloadState[lang].critical.error = null;
    preloadState[lang].secondary.loaded = false;
    preloadState[lang].secondary.loading = false;
    preloadState[lang].secondary.error = null;
  }
  
  log.debug(`[resetPreloadState] État du preload réinitialisé pour ${lang}`);
};

/**
 * Récupère l'état du preload pour une langue
 * @param {string} language - Code de la langue (fr, en)
 * @returns {Object} État du preload
 */
export const getPreloadState = (language) => {
  const lang = language || LANGUAGES.FR;
  return preloadState[lang] || {
    critical: { loaded: false, loading: false, error: null },
    secondary: { loaded: false, loading: false, error: null }
  };
};

/**
 * Récupère les métriques de performance du preload
 * @param {string} language - Code de la langue (fr, en)
 * @returns {Object} Métriques de performance
 */
export const getPreloadMetrics = (language) => {
  const lang = language || LANGUAGES.FR;
  return performanceMetrics[lang] || {
    critical: { startTime: null, endTime: null, duration: null },
    secondary: { startTime: null, endTime: null, duration: null }
  };
};

/**
 * Précharge un namespace spécifique (utile pour les namespaces utilisés fréquemment)
 * @param {string} language - Code de la langue (fr, en)
 * @param {string} namespace - Nom du namespace à précharger
 */
export const preloadNamespaceForLanguage = (language, namespace) => {
  const lang = language || LANGUAGES.FR;
  preloadNamespace(lang, namespace);
  log.debug(`[preloadNamespaceForLanguage] Preload lancé pour ${lang}:${namespace}`);
};

