import { useCallback, useRef, useEffect, useState } from 'react';
import { LANGUAGES } from './translations/constants';
import { useLanguage } from '../context/LanguageContext';
import { LRUCache } from './lruCache';
import logger from './logger';
import { loadTranslationNamespace, getCachedNamespace } from './translations/loader';
import { tPluralFromNamespaces, getPluralKey } from './translations/pluralization';
import { validateAndWarn } from './translations/validator';
import { initHotReload } from './translations/hot-reload';

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

// ✅ PHASE 4.3 : Initialiser le hot-reload en développement
if (process.env.NODE_ENV === 'development') {
  initHotReload(translationCache);
}

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
 * ✅ PHASE 5.3 : Support de l'interpolation avancée avec fallback vers simple
 * 
 * @param {string} template - Template avec {{variable}} ou syntaxe avancée
 * @param {Object} params - Paramètres à interpoler
 * @param {string} language - Langue actuelle (pour les formatters)
 * @returns {string} Texte interpolé
 */
const interpolateTranslation = (template, params, language = LANGUAGES.FR) => {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }
  
  // ✅ PHASE 5.3 : Essayer l'interpolation avancée d'abord
  // Si le template contient des patterns avancés (conditions, formatage), utiliser interpolateAdvanced
  const hasAdvancedPatterns = /\{\{if\s+\w+\s+then/.test(template) || 
                                /\{\{\w+\|[^}]+\}\}/.test(template);
  
  if (hasAdvancedPatterns) {
    // Préparer les formatters avec la locale
    const locale = language === LANGUAGES.FR ? 'fr-FR' : 'en-US';
    const formatters = {
      number: (value, options) => builtInFormatters.number(value, locale, options),
      date: (value, options) => builtInFormatters.date(value, locale, options),
      currency: (value, currency) => builtInFormatters.currency(value, currency, locale),
      percent: (value) => builtInFormatters.percent(value, locale),
      duration: (value) => builtInFormatters.duration(value)
    };
    
    return interpolateAdvanced(template, params, formatters);
  }
  
  // ✅ RÉTROCOMPATIBILITÉ : Fallback vers interpolation simple
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
    'common.show': 'Afficher',
    'common.hide': 'Masquer',
    
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
    'general.reps': 'répétitions',

    // Books (fallback ancien système pour compatibilité / validation)
    'books.subtitle': 'Gère ta bibliothèque personnelle, tes sessions de lecture et tes sauvegardes — tout est stocké localement dans ton navigateur.',
    'books.pages': 'pages',
    'books.form.title': 'Titre du livre',
    'books.form.author': 'Auteur',
    'books.form.year': 'Année',
    'books.form.genre': 'Genre',
    'books.form.genre.placeholder': 'Ex : Science-Fiction, Essai...',
    'books.form.pages': 'Nombre de pages',
    'books.form.status': 'Statut',
    'books.form.coverUpload': 'Image de couverture (upload)',
    'books.form.shortSummary': 'Résumé court',
    'books.form.longSummary': 'Résumé détaillé',
    'books.form.score': 'Note perso (0–5 étoiles)',
    'books.form.score.help': 'Cette note est purement indicative et reste locale.',
    'books.status.inProgress': 'En cours',
    'books.status.completed': 'Terminé',
    'books.status.toRead': 'À lire',
    'books.status.abandoned': 'Abandonné',
    'books.status.paused': 'En pause',
    'books.actions.title': 'Actions',
    'books.actions.addBook': 'Ajouter le livre',
    'books.actions.updateBook': 'Mettre à jour le livre',
    'books.actions.cancelEdit': 'Annuler la modification',
    'books.actions.export': 'Exporter JSON',
    'books.actions.import': 'Importer JSON',
    'books.actions.editBook': 'Éditer',
    'books.actions.deleteBook': 'Supprimer',
    'books.actions.addSession': 'Ajouter session',
    'books.search.label': 'Recherche',
    'books.search.placeholder': 'Filtrer par titre ou auteur...',
    'books.hint.localStorage': 'Toutes les données sont stockées localement (localStorage). Tu peux les sauvegarder ou les restaurer via les boutons ci-dessus.',
    'books.sections.inProgress': 'Livres en cours',
    'books.sections.completed': 'Livres terminés',
    'books.sections.toRead': 'Livres à lire',
    'books.empty.inProgress': 'Aucun livre en cours pour le moment. Ajoute un livre avec le formulaire ci-dessus.',
    'books.empty.completed': 'Tu n’as pas encore marqué de livre comme terminé.',
    'books.empty.toRead': 'Tu n’as pas encore de livres marqués comme "À lire".',
    'books.detail.noTitle': 'Livre sans titre',
    'books.detail.noSelection': 'Aucun livre sélectionné',
    'books.detail.subtitle': 'Historique de lecture et statistiques pour ce livre.',
    'books.detail.subtitle.empty': 'Clique sur un livre dans les carrousels pour voir son détail et ajouter des sessions de lecture.',
    'books.detail.author': 'Auteur',
    'books.detail.genre': 'Genre',
    'books.detail.year': 'Année',
    'books.detail.pages': 'Pages',
    'books.detail.status': 'Statut',
    'books.detail.shortSummary': 'Résumé court',
    'books.detail.longSummary': 'Résumé détaillé',
    'books.detail.notes': 'Notes',
    'books.detail.noSelectionLong': 'Sélectionne un livre dans les listes ci-dessus pour voir ses détails, son historique de lecture et ajouter des sessions.',
    'books.stats.totalTime': 'Temps total de lecture',
    'books.stats.minutes': 'minutes',
    'books.stats.totalPages': 'Pages lues au total',
    'books.stats.sessionsCount': 'Nombre de sessions',
    'books.stats.avgPagesPerSession': 'Pages moyennes par session',
    'books.stats.avgDurationPerSession': 'Durée moyenne par session (minutes)',
    'books.stats.progress': 'Progression estimée du livre (%)',
    'books.stats.estimatedRemaining': 'Temps estimé restant',
    'books.sessions.listTitle': 'Sessions de lecture',
    'books.sessions.empty': 'Aucune session enregistrée pour le moment.',
    'books.sessions.addTitle': 'Ajouter une session de lecture',
    'books.sessions.date': 'Date',
    'books.sessions.duration': 'Durée (minutes)',
    'books.sessions.pages': 'Pages lues pendant la session',
    'books.sessions.note': 'Note (optionnel)',
    'books.sessions.addButton': 'Ajouter la session de lecture',
    'books.footer.info': 'Cette première version de l’onglet Livres implémente la gestion locale des livres et des sessions de lecture. Les fonctionnalités avancées décrites dans la documentation (sphère 3D, PDFs en IndexedDB, sauvegardes multi‑formats) pourront être ajoutées progressivement sans impacter le reste du site.',
    'books.assets.pdfAttached': 'PDF associé',
    'books.assets.noPdf': 'Aucun PDF associé',
    'books.assets.attachPdf': 'Joindre un PDF',
    'books.assets.removePdf': 'Supprimer le PDF',
    'books.assets.coverAttached': 'Couverture associée',
    'books.assets.noCover': 'Aucune couverture associée',
    'books.assets.attachCover': 'Ajouter une couverture',
    'books.assets.changeCover': 'Changer la couverture',
    'books.assets.removeCover': 'Supprimer la couverture',
    'books.assets.viewCover': 'Voir la couverture',
    'books.dome.show': 'Activer la vue 3D',
    'books.dome.hide': 'Masquer la vue 3D',
    'books.dome.loading': 'Chargement de la vue 3D...',
    'books.filters.title': 'Filtres avancés',
    'books.filters.genre': 'Filtrer par genre',
    'books.filters.minYear': 'Année min',
    'books.filters.maxYear': 'Année max',
    'books.filters.minScore': 'Note minimale',
    'books.filters.sortTitle': 'Tri',
    'books.filters.sortBy': 'Trier par',
    'books.filters.sort.recent': 'Plus récents d’abord',
    'books.filters.sort.title': 'Titre (A → Z)',
    'books.filters.sort.author': 'Auteur (A → Z)',
    'books.filters.sort.pages': 'Nombre de pages (décroissant)',
    'books.filters.sort.score': 'Note perso (décroissante)',
    
    // Charts
    'charts.empty.title': 'Aucune donnée disponible',
    'charts.empty.message': 'Commencez à enregistrer vos entraînements pour voir vos graphiques ici.'
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
    'general.reps': 'repetitions',

    // Books (fallback old system for compatibility / validation)
    'books.subtitle': 'Manage your personal library, reading sessions and backups — everything is stored locally in your browser.',
    'books.pages': 'pages',
    'books.form.title': 'Book title',
    'books.form.author': 'Author',
    'books.form.year': 'Year',
    'books.form.genre': 'Genre',
    'books.form.genre.placeholder': 'Ex: Science-Fiction, Essay...',
    'books.form.pages': 'Number of pages',
    'books.form.status': 'Status',
    'books.form.coverUpload': 'Cover image (upload)',
    'books.form.shortSummary': 'Short summary',
    'books.form.longSummary': 'Detailed summary',
    'books.form.score': 'Personal rating (0–5 stars)',
    'books.form.score.help': 'This rating is purely indicative and stays local.',
    'books.status.inProgress': 'In progress',
    'books.status.completed': 'Completed',
    'books.status.toRead': 'To read',
    'books.status.abandoned': 'Abandoned',
    'books.status.paused': 'Paused',
    'books.actions.title': 'Actions',
    'books.actions.addBook': 'Add book',
    'books.actions.updateBook': 'Update book',
    'books.actions.cancelEdit': 'Cancel edit',
    'books.actions.export': 'Export JSON',
    'books.actions.import': 'Import JSON',
    'books.actions.editBook': 'Edit',
    'books.actions.deleteBook': 'Delete',
    'books.actions.addSession': 'Add session',
    'books.search.label': 'Search',
    'books.search.placeholder': 'Filter by title or author...',
    'books.hint.localStorage': 'All data is stored locally (localStorage). You can back it up or restore it using the buttons above.',
    'books.sections.inProgress': 'Books in progress',
    'books.sections.completed': 'Completed books',
    'books.sections.toRead': 'Books to read',
    'books.empty.inProgress': 'No books in progress yet. Add a book using the form above.',
    'books.empty.completed': 'You haven’t marked any book as completed yet.',
    'books.empty.toRead': 'You don’t have any books marked as "To read" yet.',
    'books.detail.noTitle': 'Untitled book',
    'books.detail.noSelection': 'No book selected',
    'books.detail.subtitle': 'Reading history and statistics for this book.',
    'books.detail.subtitle.empty': 'Click a book in the carrousels to see its details and add reading sessions.',
    'books.detail.author': 'Author',
    'books.detail.genre': 'Genre',
    'books.detail.year': 'Year',
    'books.detail.pages': 'Pages',
    'books.detail.status': 'Status',
    'books.detail.shortSummary': 'Short summary',
    'books.detail.longSummary': 'Detailed summary',
    'books.detail.notes': 'Notes',
    'books.detail.noSelectionLong': 'Select a book from the lists above to see its details, reading history and to add sessions.',
    'books.stats.totalTime': 'Total reading time',
    'books.stats.minutes': 'minutes',
    'books.stats.totalPages': 'Total pages read',
    'books.stats.sessionsCount': 'Number of sessions',
    'books.stats.estimatedRemaining': 'Estimated remaining time',
    'books.sessions.listTitle': 'Reading sessions',
    'books.sessions.empty': 'No sessions recorded yet.',
    'books.sessions.addTitle': 'Add a reading session',
    'books.sessions.date': 'Date',
    'books.sessions.duration': 'Duration (minutes)',
    'books.sessions.pages': 'Pages read during the session',
    'books.sessions.note': 'Note (optional)',
    'books.sessions.addButton': 'Add reading session',
    'books.footer.info': 'This first version of the Books tab implements local management of books and reading sessions. The advanced features described in the documentation (3D sphere, PDFs in IndexedDB, multi‑format backups) can be added progressively without impacting the rest of the site.',
    'books.assets.pdfAttached': 'PDF attached',
    'books.assets.noPdf': 'No PDF attached',
    'books.assets.attachPdf': 'Attach PDF',
    'books.assets.removePdf': 'Remove PDF',
    'books.assets.coverAttached': 'Cover attached',
    'books.assets.noCover': 'No cover attached',
    'books.assets.attachCover': 'Add cover',
    'books.assets.changeCover': 'Change cover',
    'books.assets.removeCover': 'Remove cover',
    'books.assets.viewCover': 'View cover',
    'books.dome.show': 'Enable 3D view',
    'books.dome.hide': 'Hide 3D view',
    'books.dome.loading': 'Loading 3D view...',
    'books.filters.title': 'Advanced filters',
    'books.filters.genre': 'Filter by genre',
    'books.filters.minYear': 'Min year',
    'books.filters.maxYear': 'Max year',
    'books.filters.minScore': 'Minimum rating',
    'books.filters.sortTitle': 'Sorting',
    'books.filters.sortBy': 'Sort by',
    'books.filters.sort.recent': 'Most recent first',
    'books.filters.sort.title': 'Title (A → Z)',
    'books.filters.sort.author': 'Author (A → Z)',
    'books.filters.sort.pages': 'Number of pages (descending)',
    'books.filters.sort.score': 'Personal rating (descending)',
    
    // Charts
    'charts.empty.title': 'No data available',
    'charts.empty.message': 'Start recording your workouts to see your charts here.'
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
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // ✅ OPTIMISATION : Invalider le cache si la langue change
  useEffect(() => {
    if (languageRef.current !== language) {
      // La langue a changé, vider le cache pour éviter traductions obsolètes
      translationCache.clear();
      currentCachedLanguage = language;
      languageRef.current = language;
      setLoadedNamespaces({}); // Réinitialiser les namespaces chargés
      setForceUpdate(prev => prev + 1); // Forcer le re-render pour recharger les traductions
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
    const knownNamespaces = [
      'nav',
      'home',
      'settings',
      'common',
      'justification',
      'calendar',
      'stats',
      'today',
      'general',
      'exercises',
      'dataEntry',
      'program',
      'exercisesTab',
      'endurance',
      'progress',
      'history',
      'charts',
      'nutrition',
      'garmin',
      'bodyTracking',
      'nutritionAnalyses',
      'messages',
      'sessionFeedback',
      'books'
    ];
    
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
  
  // ✅ PHASE 4.3 : Écouter les événements de hot-reload pour recharger les namespaces
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    const handleHotReload = (event) => {
      const { namespaces, languages, force } = event.detail || {};
      
      // Si force est true, tout recharger
      if (force) {
        translationCache.clear();
        setLoadedNamespaces({});
        log.debug('[useTranslation] Hot-reload: tous les namespaces rechargés');
        return;
      }
      
      // Sinon, recharger seulement les namespaces affectés
      if (languages && languages.includes(language)) {
        const affectedNamespaces = namespaces || [];
        
        // Invalider les namespaces affectés
        affectedNamespaces.forEach(namespace => {
          setLoadedNamespaces(prev => {
            const updated = { ...prev };
            delete updated[namespace];
            return updated;
          });
        });
        
        // Invalider le cache de traduction
        translationCache.clear();
        
        log.debug(`[useTranslation] Hot-reload: namespaces ${affectedNamespaces.join(', ')} rechargés`);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('i18n:reload', handleHotReload);
      
      return () => {
        window.removeEventListener('i18n:reload', handleHotReload);
      };
    }
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
  const t = useCallback((key, fallbackOrParams = key, paramsOrUndefined = {}) => {
    const lang = language || LANGUAGES.FR;
    
    // ✅ Détection automatique : si le deuxième argument est un objet (et pas une string), c'est params
    let fallback = key;
    let params = {};
    
    if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null && !Array.isArray(fallbackOrParams)) {
      // Le deuxième argument est un objet → c'est params, pas fallback
      params = fallbackOrParams;
      fallback = key; // Utiliser la clé comme fallback par défaut
    } else {
      // Le deuxième argument est une string → c'est fallback
      fallback = fallbackOrParams;
      params = paramsOrUndefined;
    }
    
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
    const { namespace, key: parsedNamespaceKey } = parseKey(key);
    if (!translation && namespace) {
      // Vérifier d'abord si le namespace est déjà chargé dans le loader (via preload)
      const cachedNamespace = getCachedNamespace(lang, namespace);
      if (cachedNamespace) {
        // Le namespace est chargé via preload, utiliser directement
        const cachedTranslation = getNestedValue(cachedNamespace, parsedNamespaceKey);
        if (cachedTranslation) {
          translation = cachedTranslation;
        }
      } else if (!loadedNamespaces[namespace]) {
        // Le namespace n'est pas chargé, le charger maintenant
        loadTranslationNamespace(lang, namespace).then(() => {
          setLoadedNamespaces(prev => ({
            ...prev,
            [namespace]: true
          }));
          setForceUpdate(prev => prev + 1); // Forcer le re-render pour afficher la traduction
        }).catch(error => {
          log.warn(`[useTranslation] Error loading namespace ${namespace}:`, error);
        });
      }
    }
    
    // ✅ PHASE 4.1 : Validation des clés manquantes (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      // Valider la clé même si on utilise le fallback (pour détecter les clés manquantes)
      validateAndWarn(key, lang, translations);
    }
    
    // Utiliser le fallback si traduction non trouvée
    if (!translation) {
      translation = fallback;
    }
    
    // Interpoler les paramètres si présents
    const result = params && Object.keys(params).length > 0
      ? interpolateTranslation(translation, params, lang)
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

