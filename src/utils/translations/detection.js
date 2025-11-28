/**
 * ✅ PHASE 2.1 : Détection Automatique de la Langue du Navigateur
 * 
 * Intelligence :
 * - Détection automatique de la langue préférée de l'utilisateur
 * - Support de plusieurs sources (navigator.language, navigator.languages)
 * - Gestion des variantes régionales (fr-FR, en-US, etc.)
 * - Fallback intelligent vers français par défaut
 * 
 * Architecture :
 * - Fonction pure (pas de side effects)
 * - Support SSR (vérification de l'existence de navigator)
 * - Performance optimale (pas de calculs inutiles)
 * - Logging pour debugging
 */

import { LANGUAGES } from './constants';
import { getBestAvailableLocale, getBaseLanguage } from './regions';
import logger from '../logger';

const log = logger.module('translations-detection');

/**
 * Détecte la langue du navigateur de manière intelligente
 * 
 * Stratégie de détection :
 * 1. Vérifier navigator.languages (tableau des langues préférées, ordre de préférence)
 * 2. Fallback vers navigator.language (langue principale)
 * 3. Fallback vers navigator.userLanguage (IE/anciens navigateurs)
 * 4. Extraire le code de langue (ex: 'fr-FR' -> 'fr')
 * 5. Vérifier si la langue est supportée
 * 6. Fallback vers français par défaut
 * 
 * @returns {string} Code de langue détecté ('fr' ou 'en')
 * 
 * @example
 * const detected = detectBrowserLanguage();
 * // Retourne 'fr' ou 'en' selon la langue du navigateur
 */
export const detectBrowserLanguage = () => {
  // ✅ Vérifier si on est dans un environnement navigateur (SSR safe)
  if (typeof navigator === 'undefined') {
    log.debug('[detectBrowserLanguage] Navigator non disponible (SSR), fallback vers FR');
    return LANGUAGES.FR;
  }

  try {
    // ✅ OPTIMISATION : Utiliser navigator.languages en priorité (plus précis)
    // navigator.languages est un tableau ordonné par préférence
    // Exemple: ['fr-FR', 'fr', 'en-US', 'en']
    const languages = navigator.languages || [];
    
    // Parcourir les langues préférées dans l'ordre
    for (const lang of languages) {
      const detected = extractLanguageCode(lang);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.languages: ${lang} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK : Utiliser navigator.language (langue principale)
    if (navigator.language) {
      const detected = extractLanguageCode(navigator.language);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.language: ${navigator.language} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK : Utiliser navigator.userLanguage (IE/anciens navigateurs)
    if (navigator.userLanguage) {
      const detected = extractLanguageCode(navigator.userLanguage);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.userLanguage: ${navigator.userLanguage} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK FINAL : Français par défaut
    log.debug('[detectBrowserLanguage] Aucune langue détectée, fallback vers FR');
    return LANGUAGES.FR;
  } catch (error) {
    // ✅ GESTION D'ERREUR : En cas d'erreur, retourner français par défaut
    log.error('[detectBrowserLanguage] Erreur lors de la détection:', error);
    return LANGUAGES.FR;
  }
};

/**
 * Extrait le code de langue depuis une chaîne de locale
 * 
 * Exemples :
 * - 'fr-FR' -> 'fr'
 * - 'en-US' -> 'en'
 * - 'fr' -> 'fr'
 * - 'en' -> 'en'
 * - 'de-DE' -> null (non supporté)
 * 
 * @param {string} locale - Chaîne de locale (ex: 'fr-FR', 'en-US')
 * @returns {string|null} Code de langue supporté ('fr' ou 'en') ou null
 */
const extractLanguageCode = (locale) => {
  if (!locale || typeof locale !== 'string') {
    return null;
  }
  
  // Extraire le code de langue (première partie avant le tiret)
  // Exemple: 'fr-FR' -> 'fr', 'en-US' -> 'en'
  const langCode = locale.split('-')[0].toLowerCase();
  
  // Vérifier si la langue est supportée
  if (langCode === 'fr') {
    return LANGUAGES.FR;
  }
  
  if (langCode === 'en') {
    return LANGUAGES.EN;
  }
  
  // Langue non supportée
  return null;
};

/**
 * Détecte la langue avec priorité au localStorage
 * 
 * Ordre de priorité :
 * 1. localStorage (préférence utilisateur explicite)
 * 2. Détection automatique du navigateur
 * 3. Français par défaut
 * 
 * ✅ PHASE 5.1 : Support des locales complètes (fr-FR, en-US, etc.)
 * 
 * @param {Function} getStoredLanguage - Fonction pour récupérer la langue depuis localStorage
 * @param {boolean} returnLocale - Si true, retourne la locale complète (ex: 'fr-FR'), sinon la langue de base (ex: 'fr')
 * @returns {string} Code de langue final ('fr' ou 'en') ou locale complète si returnLocale=true
 */
export const detectLanguageWithPriority = (getStoredLanguage, returnLocale = false) => {
  try {
    // 1. Vérifier localStorage en priorité (préférence utilisateur)
    const stored = getStoredLanguage();
    if (stored) {
      // Support rétrocompatible : si c'est une langue de base (fr, en), la retourner
      if (stored === LANGUAGES.FR || stored === LANGUAGES.EN) {
        if (returnLocale) {
          // Convertir en locale complète
          const locale = getBestAvailableLocale(`${stored}-${stored === LANGUAGES.FR ? 'FR' : 'US'}`);
          log.debug(`[detectLanguageWithPriority] Locale depuis localStorage: ${locale}`);
          return locale;
        }
        log.debug(`[detectLanguageWithPriority] Langue depuis localStorage: ${stored}`);
        return stored;
      }
      
      // Si c'est déjà une locale complète (fr-FR, en-US, etc.)
      if (stored.includes('-')) {
        const bestLocale = getBestAvailableLocale(stored);
        log.debug(`[detectLanguageWithPriority] Locale depuis localStorage: ${bestLocale}`);
        return returnLocale ? bestLocale : getBaseLanguage(bestLocale);
      }
    }
    
    // 2. Détecter depuis le navigateur
    if (returnLocale) {
      // Détecter la locale complète depuis navigator
      const browserLocale = detectBrowserLocale();
      const bestLocale = getBestAvailableLocale(browserLocale);
      log.debug(`[detectLanguageWithPriority] Locale détectée: ${bestLocale}`);
      return bestLocale;
    } else {
      const detected = detectBrowserLanguage();
      log.debug(`[detectLanguageWithPriority] Langue détectée: ${detected}`);
      return detected;
    }
  } catch (error) {
    log.error('[detectLanguageWithPriority] Erreur lors de la détection:', error);
    return returnLocale ? 'fr-FR' : LANGUAGES.FR;
  }
};

/**
 * ✅ PHASE 5.1 : Détecte la locale complète du navigateur (ex: 'fr-FR', 'en-US')
 * @returns {string} Locale complète détectée
 */
export const detectBrowserLocale = () => {
  if (typeof navigator === 'undefined') {
    return 'fr-FR';
  }
  
  try {
    // Utiliser navigator.languages en priorité
    const languages = navigator.languages || [];
    for (const lang of languages) {
      if (lang && typeof lang === 'string') {
        const bestLocale = getBestAvailableLocale(lang);
        if (bestLocale) {
          log.debug(`[detectBrowserLocale] Locale détectée depuis navigator.languages: ${lang} -> ${bestLocale}`);
          return bestLocale;
        }
      }
    }
    
    // Fallback vers navigator.language
    if (navigator.language) {
      const bestLocale = getBestAvailableLocale(navigator.language);
      if (bestLocale) {
        log.debug(`[detectBrowserLocale] Locale détectée depuis navigator.language: ${navigator.language} -> ${bestLocale}`);
        return bestLocale;
      }
    }
    
    // Fallback final
    return 'fr-FR';
  } catch (error) {
    log.error('[detectBrowserLocale] Erreur lors de la détection:', error);
    return 'fr-FR';
  }
};


