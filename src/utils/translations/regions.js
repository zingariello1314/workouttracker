/**
 * ✅ PHASE 5.1 : Support des Variantes Régionales
 * 
 * Performance :
 * - Chargement des variantes régionales uniquement si nécessaire
 * - Fallback automatique vers la langue de base si variante non disponible
 * - Cache des variantes chargées
 * 
 * Architecture :
 * - Support de fr-FR, fr-CA, en-US, en-GB, etc.
 * - Chargement hiérarchique : base + variante régionale
 * - Détection automatique depuis navigator.language
 * 
 * @module translations/regions
 */

import { LANGUAGES } from './constants';
import logger from '../logger';

const log = logger.module('translations-regions');

/**
 * Mapping des variantes régionales supportées
 */
export const REGIONS = {
  [LANGUAGES.FR]: {
    'fr-FR': 'Français (France)',
    'fr-CA': 'Français (Canada)',
    'fr-BE': 'Français (Belgique)',
    'fr-CH': 'Français (Suisse)'
  },
  [LANGUAGES.EN]: {
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'en-CA': 'English (Canada)',
    'en-AU': 'English (Australia)'
  }
};

/**
 * Liste de toutes les locales supportées
 */
export const SUPPORTED_LOCALES = [
  ...Object.keys(REGIONS[LANGUAGES.FR]),
  ...Object.keys(REGIONS[LANGUAGES.EN])
];

/**
 * Extrait la langue de base depuis une locale (ex: 'fr-FR' -> 'fr')
 * @param {string} locale - Locale complète (ex: 'fr-FR', 'en-US')
 * @returns {string} Langue de base (ex: 'fr', 'en')
 */
export const getBaseLanguage = (locale) => {
  if (!locale) return LANGUAGES.FR;
  
  const parts = locale.split('-');
  return parts[0]?.toLowerCase() || LANGUAGES.FR;
};

/**
 * Extrait la région depuis une locale (ex: 'fr-FR' -> 'FR')
 * @param {string} locale - Locale complète (ex: 'fr-FR', 'en-US')
 * @returns {string|null} Région (ex: 'FR', 'US') ou null si non spécifiée
 */
export const getRegion = (locale) => {
  if (!locale) return null;
  
  const parts = locale.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : null;
};

/**
 * Normalise une locale (ex: 'fr' -> 'fr-FR', 'en' -> 'en-US')
 * @param {string} locale - Locale à normaliser
 * @param {string} defaultRegion - Région par défaut si non spécifiée
 * @returns {string} Locale normalisée
 */
export const normalizeLocale = (locale, defaultRegion = null) => {
  if (!locale) {
    return defaultRegion || 'fr-FR';
  }
  
  // Si déjà au format complet, retourner tel quel
  if (locale.includes('-')) {
    return locale;
  }
  
  // Sinon, ajouter la région par défaut
  const baseLang = getBaseLanguage(locale);
  const region = defaultRegion || getDefaultRegionForLanguage(baseLang);
  
  return region ? `${baseLang}-${region}` : baseLang;
};

/**
 * Retourne la région par défaut pour une langue
 * @param {string} language - Langue de base (ex: 'fr', 'en')
 * @returns {string|null} Région par défaut (ex: 'FR', 'US')
 */
export const getDefaultRegionForLanguage = (language) => {
  const defaults = {
    [LANGUAGES.FR]: 'FR',
    [LANGUAGES.EN]: 'US'
  };
  
  return defaults[language] || null;
};

/**
 * Vérifie si une locale est supportée
 * @param {string} locale - Locale à vérifier
 * @returns {boolean} True si supportée
 */
export const isLocaleSupported = (locale) => {
  if (!locale) return false;
  
  // Vérifier si la locale exacte est supportée
  if (SUPPORTED_LOCALES.includes(locale)) {
    return true;
  }
  
  // Vérifier si au moins la langue de base est supportée
  const baseLang = getBaseLanguage(locale);
  return baseLang === LANGUAGES.FR || baseLang === LANGUAGES.EN;
};

/**
 * Retourne la meilleure locale disponible pour une locale demandée
 * @param {string} requestedLocale - Locale demandée (ex: 'fr-CA')
 * @returns {string} Meilleure locale disponible (ex: 'fr-CA' ou 'fr-FR' en fallback)
 */
export const getBestAvailableLocale = (requestedLocale) => {
  if (!requestedLocale) {
    return 'fr-FR'; // Par défaut
  }
  
  // Si la locale exacte est supportée, la retourner
  if (SUPPORTED_LOCALES.includes(requestedLocale)) {
    return requestedLocale;
  }
  
  // Sinon, essayer de trouver une variante de la même langue
  const baseLang = getBaseLanguage(requestedLocale);
  const region = getRegion(requestedLocale);
  
  // Si une région est spécifiée, essayer de trouver une variante proche
  if (region && REGIONS[baseLang]) {
    // Chercher une variante avec la même région
    const variant = Object.keys(REGIONS[baseLang]).find(loc => 
      loc.endsWith(`-${region}`)
    );
    
    if (variant) {
      return variant;
    }
  }
  
  // Fallback vers la variante par défaut de la langue
  const defaultRegion = getDefaultRegionForLanguage(baseLang);
  if (defaultRegion) {
    return `${baseLang}-${defaultRegion}`;
  }
  
  // Dernier fallback : langue de base
  return baseLang;
};

/**
 * Charge les traductions régionales pour un namespace
 * ✅ PHASE 5.2 : Support des sous-namespaces (ex: 'calendar/heatmap')
 * 
 * @param {string} locale - Locale complète (ex: 'fr-CA')
 * @param {string} namespace - Nom du namespace (peut être un sous-namespace comme 'calendar/heatmap')
 * @returns {Promise<Object>} Traductions régionales (base + variante)
 */
export const loadRegionalTranslations = async (locale, namespace) => {
  const baseLang = getBaseLanguage(locale);
  const region = getRegion(locale);
  
  // ✅ PHASE 5.2 : Support des sous-namespaces
  const namespacePath = namespace.replace(/\//g, '/');
  
  try {
    // Charger les traductions de base
    let baseModule;
    try {
      baseModule = await import(`./${baseLang}/${namespacePath}.json`);
    } catch (error) {
      // Si le sous-namespace n'existe pas, essayer le namespace plat
      const fallbackNamespace = namespace.replace(/\//g, '');
      log.debug(`[loadRegionalTranslations] Fallback vers namespace plat: ${fallbackNamespace}`);
      baseModule = await import(`./${baseLang}/${fallbackNamespace}.json`);
    }
    const baseTranslations = baseModule.default || baseModule;
    
    // Si une région est spécifiée et différente de la région par défaut,
    // essayer de charger les variantes régionales
    if (region && region !== getDefaultRegionForLanguage(baseLang)) {
      try {
        // Essayer d'abord avec le sous-namespace
        let regionalModule;
        try {
          regionalModule = await import(`./${baseLang}/${region}/${namespacePath}.json`);
        } catch (error) {
          // Si le sous-namespace régional n'existe pas, essayer le namespace plat
          const fallbackNamespace = namespace.replace(/\//g, '');
          regionalModule = await import(`./${baseLang}/${region}/${fallbackNamespace}.json`);
        }
        const regionalTranslations = regionalModule.default || regionalModule;
        
        // Fusionner : variantes régionales écrasent les traductions de base
        return {
          ...baseTranslations,
          ...regionalTranslations
        };
      } catch (error) {
        // Si les variantes régionales n'existent pas, utiliser seulement la base
        log.debug(`[loadRegionalTranslations] Variantes régionales non trouvées pour ${locale}:${namespace}, utilisation de la base`);
        return baseTranslations;
      }
    }
    
    // Sinon, retourner seulement les traductions de base
    return baseTranslations;
  } catch (error) {
    log.error(`[loadRegionalTranslations] Erreur lors du chargement de ${locale}:${namespace}:`, error);
    return {};
  }
};

/**
 * Retourne le label d'affichage pour une locale
 * @param {string} locale - Locale (ex: 'fr-FR')
 * @returns {string} Label d'affichage (ex: 'Français (France)')
 */
export const getLocaleLabel = (locale) => {
  if (!locale) return '';
  
  const baseLang = getBaseLanguage(locale);
  const regions = REGIONS[baseLang];
  
  if (regions && regions[locale]) {
    return regions[locale];
  }
  
  // Fallback : retourner la locale telle quelle
  return locale;
};

/**
 * Retourne toutes les locales disponibles pour une langue
 * @param {string} language - Langue de base (ex: 'fr', 'en')
 * @returns {string[]} Liste des locales disponibles
 */
export const getAvailableLocalesForLanguage = (language) => {
  return Object.keys(REGIONS[language] || {});
};

