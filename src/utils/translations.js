import { useCallback, useRef, useEffect, useState } from 'react';
import { LANGUAGES } from './translations/constants';
import { useLanguage } from '../context/LanguageContext';
import { LRUCache } from './lruCache';
import logger from './logger';
import { loadTranslationNamespace, getCachedNamespace } from './translations/loader';
import { tPluralFromNamespaces, getPluralKey } from './translations/pluralization';

const log = logger.module('translations');

// ==================== CACHE DES TRADUCTIONS ====================

/**
 * ✅ PHASE 1.1 : Cache LRU pour les traductions avec interpolation
 * 
 * Performance :
 * - Lookup : O(1) après premier accès
 * - Limite : 1000 entrées (évite fuite mémoire)
 * - Invalidation automatique lors du changement de langue
 * 
 * Architecture :
 * - Utilise LRUCache existant (cohérence codebase)
 * - Clé de cache : `${language}:${key}:${paramsHash}`
 * - Support interpolation de paramètres
 */
const TRANSLATION_CACHE_SIZE = 1000;
const translationCache = new LRUCache(TRANSLATION_CACHE_SIZE, { enableStats: false });

// Cache de la langue actuelle pour invalidation
let currentCachedLanguage = null;

/**
 * Génère un hash simple des paramètres pour la clé de cache
 * @param {Object} params - Paramètres d'interpolation
 * @returns {string} Hash des paramètres
 */
const hashParams = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  // Tri des clés pour garantir cohérence
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys.map(key => `${key}:${params[key]}`).join('|');
};

/**
 * Interpole les paramètres dans un template de traduction
 * @param {string} template - Template avec {{variable}}
 * @param {Object} params - Paramètres à interpoler
 * @returns {string} Texte interpolé
 */
const interpolateTranslation = (template, params) => {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }
  
  // Support de {{variable}} et {variable} pour flexibilité
  return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (match, key1, key2) => {
    const key = key1 || key2;
    return params[key] !== undefined ? String(params[key]) : match;
  });
};

// ==================== TRADUCTIONS ====================

// Traductions de l'application
export const translations = {
  [LANGUAGES.FR]: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.today': "Aujourd'hui",
    'nav.calendar': 'Calendrier',
    'nav.stats': 'Statistiques',
    'nav.program': 'Programme',
    'nav.exercises': 'Exercices',
    'nav.history': 'Historique',
    'nav.settings': 'Paramètres',
    
    // HomePage
    'home.title.line1': 'Où',
    'home.title.line2': 'Imagination',
    'home.title.line3': 'Rencontre l\'Intelligence',
    'home.cta': 'COMMENCER L\'ENTRAÎNEMENT',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.language.description': 'Choisissez la langue de l\'interface',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Justifications
    'justification.maladie': 'Maladie',
    'justification.flemme': 'Flemme',
    'justification.pas_le_temps': 'Pas le temps',
    'justification.autre': 'Autre',
    'justification.title': 'Justifier l\'absence d\'activité',
    'justification.select_reason': 'Sélectionnez une raison',
    'justification.note': 'Note (optionnel)',
    'justification.note.placeholder': 'Ajoutez des détails...',
    'justification.monthly': 'Justifications du mois',
    
    // Calendar
    'calendar.stats.reps_endurance': 'reps + endurance',
    'calendar.stats.total_time': 'temps total',
    'calendar.sessions': 'séances',
    
    // Stats
    'stats.current_streak': 'Streak actuel',
    'stats.longest_streak': 'Record personnel',
    'stats.justified_days': 'Jours justifiés',
    
    // Today
    'today.no_activity': 'Aucune activité enregistrée',
    'today.justify': 'Justifier l\'absence',
    
    // General
    'general.days': 'jours',
    'general.minutes': 'minutes',
    'general.reps': 'répétitions'
  },
  
  [LANGUAGES.EN]: {
    // Navigation
    'nav.home': 'Home',
    'nav.today': 'Today',
    'nav.calendar': 'Calendar',
    'nav.stats': 'Statistics',
    'nav.program': 'Program',
    'nav.exercises': 'Exercises',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    
    // HomePage
    'home.title.line1': 'Where',
    'home.title.line2': 'Imagination',
    'home.title.line3': 'Meets Intelligence',
    'home.cta': 'START TRAINING',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.description': 'Choose the interface language',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Justifications
    'justification.maladie': 'Sickness',
    'justification.flemme': 'Laziness',
    'justification.pas_le_temps': 'No time',
    'justification.autre': 'Other',
    'justification.title': 'Justify absence of activity',
    'justification.select_reason': 'Select a reason',
    'justification.note': 'Note (optional)',
    'justification.note.placeholder': 'Add details...',
    'justification.monthly': 'Monthly justifications',
    
    // Calendar
    'calendar.stats.reps_endurance': 'reps + endurance',
    'calendar.stats.total_time': 'total time',
    'calendar.sessions': 'sessions',
    
    // Stats
    'stats.current_streak': 'Current streak',
    'stats.longest_streak': 'Personal record',
    'stats.justified_days': 'Justified days',
    
    // Today
    'today.no_activity': 'No activity recorded',
    'today.justify': 'Justify absence',
    
    // General
    'general.days': 'days',
    'general.minutes': 'minutes',
    'general.reps': 'repetitions'
  }
};

/**
 * ✅ PHASE 1.1 + 1.2 : Hook optimisé avec cache LRU et lazy loading par namespace
 * 
 * Performance :
 * - Cache LRU des traductions fréquemment utilisées
 * - Lazy loading des namespaces (code splitting)
 * - Support interpolation de paramètres
 * - Invalidation automatique lors du changement de langue
 * - Rétrocompatibilité avec l'ancien système
 * 
 * @returns {Function} Fonction de traduction `t(key, fallback, params)`
 * 
 * @example
 * const t = useTranslation();
 * t('nav.home'); // Charge le namespace 'nav' si nécessaire
 * t('home.title.line1'); // Charge le namespace 'home' et accède à title.line1
 * t('common.save', 'Enregistrer'); // Fallback vers ancien système si namespace non trouvé
 */
export const useTranslation = () => {
  const { language } = useLanguage();
  const languageRef = useRef(language);
  const [loadedNamespaces, setLoadedNamespaces] = useState({});
  
  // ✅ OPTIMISATION : Invalider le cache si la langue change
  useEffect(() => {
    if (languageRef.current !== language) {
      // La langue a changé, vider le cache pour éviter traductions obsolètes
      translationCache.clear();
      currentCachedLanguage = language;
      languageRef.current = language;
      setLoadedNamespaces({}); // Réinitialiser les namespaces chargés
      log.debug(`[useTranslation] Cache invalidé - changement de langue: ${languageRef.current} → ${language}`);
    }
  }, [language]);
  
  /**
   * Extrait le namespace et la clé depuis une clé de traduction
   * Exemples :
   * - 'nav.home' -> { namespace: 'nav', key: 'home' }
   * - 'home.title.line1' -> { namespace: 'home', key: 'title.line1' }
   * - 'common.save' -> { namespace: 'common', key: 'save' }
   */
  const parseKey = (key) => {
    const parts = key.split('.');
            const knownNamespaces = ['nav', 'home', 'settings', 'common', 'justification', 'calendar', 'stats', 'today', 'general', 'exercises', 'dataEntry', 'program', 'exercisesTab', 'endurance', 'progress', 'history', 'charts', 'nutrition', 'garmin', 'bodyTracking', 'nutritionAnalyses'];
    
    // Si le premier segment est un namespace connu, l'utiliser
    if (knownNamespaces.includes(parts[0])) {
      return {
        namespace: parts[0],
        key: parts.slice(1).join('.')
      };
    }
    
    // Sinon, pas de namespace (ancien format)
    return {
      namespace: null,
      key: key
    };
  };
  
  /**
   * Récupère une valeur depuis un objet en utilisant une clé avec points
   * Exemple: getNestedValue({ title: { line1: 'Hello' } }, 'title.line1') -> 'Hello'
   */
  const getNestedValue = (obj, keyPath) => {
    if (!obj || !keyPath) return null;
    
    const parts = keyPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return typeof current === 'string' ? current : null;
  };
  
  // ✅ PHASE 1.3 : Le preload est maintenant géré par LanguageContext via initI18n()
  // On vérifie simplement si les namespaces critiques sont déjà chargés
  useEffect(() => {
    // Vérifier si les namespaces critiques sont déjà chargés (via preload)
    const criticalNamespaces = ['common', 'nav', 'home'];
    criticalNamespaces.forEach(namespace => {
      const cached = getCachedNamespace(language || LANGUAGES.FR, namespace);
      if (cached) {
        setLoadedNamespaces(prev => ({
          ...prev,
          [namespace]: true
        }));
      }
    });
  }, [language]);
  
  /**
   * Récupère une traduction depuis les namespaces ou l'ancien système
   * @param {string} key - Clé de traduction
   * @param {string} lang - Code de la langue
   * @returns {string|null} Traduction ou null si non trouvée
   */
  const getTranslationFromSource = useCallback((key, lang) => {
    // Parser la clé pour détecter le namespace
    const { namespace, key: namespaceKey } = parseKey(key);
    
    // ✅ PHASE 1.2 : Essayer le nouveau système (namespaces) d'abord
    if (namespace) {
      const namespaceData = getCachedNamespace(lang, namespace);
      if (namespaceData && namespaceKey) {
        const translation = getNestedValue(namespaceData, namespaceKey);
        if (translation) {
          return translation;
        }
      }
    }
    
    // ✅ RÉTROCOMPATIBILITÉ : Fallback vers l'ancien système
    return translations[lang]?.[key] || translations[LANGUAGES.FR]?.[key] || null;
  }, [loadedNamespaces]);
  
  // ✅ OPTIMISATION : Mémoriser la fonction t avec la langue actuelle
  const t = useCallback((key, fallback = key, params = {}) => {
    const lang = language || LANGUAGES.FR;
    
    // ✅ PHASE 2.3 : Support de la pluralisation si params.count est présent
    if (params && typeof params.count === 'number') {
      const count = params.count;
      
      // Générer la clé de cache pour la pluralisation
      const paramsHash = hashParams(params);
      const cacheKey = `${lang}:${key}:plural:${count}:${paramsHash}`;
      
      // Vérifier le cache
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
      }
      
      // Fonction helper pour récupérer une traduction
      const getTranslation = (translationKey, fallbackValue) => {
        const result = getTranslationFromSource(translationKey, lang);
        return result || fallbackValue;
      };
      
      // Utiliser tPluralFromNamespaces pour la pluralisation
      const result = tPluralFromNamespaces(key, count, lang, getTranslation, fallback);
      
      // Mettre en cache
      translationCache.set(cacheKey, result);
      return result;
    }
    
    // Générer la clé de cache (inclut langue, clé, et hash des paramètres)
    const paramsHash = hashParams(params);
    const cacheKey = paramsHash 
      ? `${lang}:${key}:${paramsHash}` 
      : `${lang}:${key}`;
    
    // ✅ OPTIMISATION : Vérifier le cache d'abord (O(1) lookup)
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey);
      return cached;
    }
    
    // Récupérer la traduction depuis les namespaces ou l'ancien système
    let translation = getTranslationFromSource(key, lang);
    
    // Si namespace pas encore chargé, déclencher le chargement en arrière-plan
    const { namespace } = parseKey(key);
    if (!translation && namespace && !loadedNamespaces[namespace]) {
      loadTranslationNamespace(lang, namespace).then(() => {
        setLoadedNamespaces(prev => ({
          ...prev,
          [namespace]: true
        }));
      }).catch(error => {
        log.warn(`[useTranslation] Error loading namespace ${namespace}:`, error);
      });
    }
    
    // Utiliser le fallback si traduction non trouvée
    if (!translation) {
      translation = fallback;
    }
    
    // Interpoler les paramètres si présents
    const result = params && Object.keys(params).length > 0
      ? interpolateTranslation(translation, params)
      : translation;
    
    // ✅ OPTIMISATION : Mettre en cache (éviction automatique si limite atteinte)
    translationCache.set(cacheKey, result);
    
    return result;
  }, [language, loadedNamespaces, getTranslationFromSource]);
  
  return t;
};

/**
 * Fonction utilitaire pour obtenir une traduction
 * @param {string} language - Code de la langue
 * @param {string} key - Clé de traduction
 * @param {string} fallback - Valeur par défaut si la clé n'existe pas
 * @returns {string} Texte traduit
 */
export const getTranslation = (language, key, fallback = key) => {
  const lang = language || LANGUAGES.FR;
  return translations[lang]?.[key] || translations[LANGUAGES.FR]?.[key] || fallback;
};

