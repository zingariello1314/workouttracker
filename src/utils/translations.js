import { useCallback, useRef, useEffect, useState } from 'react';
import { LANGUAGES } from './translations/constants';
import { useLanguage } from '../context/LanguageContext';
import { LRUCache } from './lruCache';
import logger from './logger';
import { loadTranslationNamespace, getCachedNamespace } from './translations/loader';
import { getBaseLanguage } from './translations/regions';
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
    'nav.dashboard': 'Dashboard',
    'nav.today': "Aujourd'hui",
    'nav.sport': 'Sport',
    'nav.quests': 'Quêtes',
    'nav.apprentissage': 'Apprentissage',
    'nav.books': 'Livres',
    'nav.calendar': 'Calendrier',
    'nav.stats': 'Statistiques',
    'nav.program': 'Programme',
    'nav.exercises': 'Exercices',
    'nav.history': 'Historique',
    'nav.settings': 'Paramètres',
    'nav.finance': 'Finance',
    'nav.mainTabs': 'Onglets principaux',
    'nav.sportTabs': 'Onglets Sport',
    'nav.dataEntry': 'Saisie données',
    'nav.nutrition': 'Nutrition',
    'nav.progress': 'Progression',
    'nav.endurance': 'Endurance',
    'nav.charts': 'Graphiques',
    'nav.predictions': 'Prédictions',
    'nav.smartBalancing': 'Smart Balancing',
    'nav.garmin': 'Garmin',
    'nav.recap': 'Récap',

    // Récap (Sport — carte musculaire)
    'recap.title': 'Récap musculaire',
    'recap.subtitle':
      'Carte 3D, scores par zone (même moteur que les couleurs), endurance et défis sur la période sélectionnée.',
    'recap.bodyMapHeading': 'Carte corporelle',
    'recap.bodyMapStats.reps': '{{n}} reps muscu (cochées)',
    'recap.bodyMapStats.iso': '{{s}} s gainage / holds',
    'recap.bodyMapStats.minutes': '{{m}} min (endurance + holds)',
    'recap.legendHeading': 'Légende & détails',
    'recap.legendPlaceholder':
      'Les couleurs par muscle, le score d’équilibre et les suggestions apparaîtront ici une fois le moteur d’agrégation branché.',
    'recap.period.today': "Aujourd'hui",
    'recap.period.7d': '7 jours',
    'recap.period.30d': '30 jours',
    'recap.period.3m': '3 mois',
    'recap.period.6m': '6 mois',
    'recap.period.1y': '1 an',
    'recap.period.2y': '2 ans',
    'recap.period.all': 'Toujours',
    'recap.periodNote': 'Période : {{label}}',
    'recap.bodyHint':
      'Glisser pour orienter · molette ou pincer pour zoomer · rotation automatique',
    'recap.legendIntro':
      'Échelle indicative : charge affichée = musculation (reps pondérées, decay) + part cardio (voir encadré du haut). Même échelle que les barres « par zone » ci-dessous.',
    'recap.legend.level.rest': 'Gris clair — repos / aucune sollicitation',
    'recap.legend.level.veryLow': 'Bleu froid — très faible stimulation',
    'recap.legend.level.undertrained': 'Bleu — sous-entraînement',
    'recap.legend.level.light': 'Vert clair — activation légère',
    'recap.legend.level.optimal': 'Vert — stimulation optimale',
    'recap.legend.level.moderateHigh': 'Jaune — volume modéré élevé',
    'recap.legend.level.high': 'Orange clair — forte sollicitation',
    'recap.legend.level.nearOverload': 'Orange — proche surcharge',
    'recap.legend.level.overload': 'Rouge clair — surcharge',
    'recap.legend.level.severe': 'Rouge — très forte surcharge',
    'recap.legend.level.overtraining': 'Violet — surentraînement probable',
    'recap.legend.level.critical': 'Rouge très sombre — zone critique (prudence)',
    'recap.legendRecoveryTitle': 'Récupération (par zone)',
    'recap.legendRecovery.ready': 'Prêt à solliciter',
    'recap.legendRecovery.inProgress': 'En récupération',
    'recap.legendRecovery.fatigued': 'Fatigue élevée — éviter volume intense',
    'recap.loadSummary':
      'Charge affichée = musculation (pondérée, decay {{lambda}}/j) + {{cardioPct}} % du cardio plafonné par zone.',
    'recap.dominant': 'Zone la plus travaillée en volume (reps cochées / parts) : {{label}}',
    'recap.muscleGroup.chest': 'Pectoraux',
    'recap.muscleGroup.back': 'Dos',
    'recap.muscleGroup.shoulders': 'Épaules',
    'recap.muscleGroup.biceps': 'Biceps',
    'recap.muscleGroup.triceps': 'Triceps',
    'recap.muscleGroup.legs': 'Jambes',
    'recap.muscleGroup.quads': 'Quadriceps',
    'recap.muscleGroup.hamstrings': 'Ischio-jambiers',
    'recap.muscleGroup.calves': 'Mollets',
    'recap.muscleGroup.core': 'Gainage / tronc',
    'recap.muscleGroup.full_body': 'Corps entier',

    'recap.zones.title': 'Détail par zone musculaire',
    'recap.zones.intro':
      'Scores du moteur Récap + reps cochées (même source que le calendrier / saisie). Jambes découpées en quadriceps / ischio / mollets ; course et corde répartissent la charge cardio selon le type de séance. Teintes des cartes = volume relatif + charge relative (cohérent avec les couleurs par zone du modèle 3D lorsque le maillage est mappé).',
    'recap.zones.section.upper': 'Haut du corps & tronc',
    'recap.zones.section.arms': 'Bras',
    'recap.zones.section.legs': 'Jambes',
    'recap.zones.section.poly': 'Global / polyarticulaire',
    'recap.zones.detail.chest': 'Pectoraux (global) — pecs serré / incliné / écartés dans ce même score.',
    'recap.zones.detail.back':
      'Dos : trapèzes, dorsaux, rhomboïdes, érecteurs (une charge agrégée « dos » + tirages / rowing).',
    'recap.zones.detail.shoulders':
      'Épaules / deltoïdes (antérieur, latéral, postérieur) ; avant-bras sollicités surtout avec tirages et curls.',
    'recap.zones.detail.core': 'Gainage, abdos, obliques — tout ce qui est mappé « tronc / core » dans le programme.',
    'recap.zones.detail.biceps': 'Biceps et brachial antérieur (même groupe de charge).',
    'recap.zones.detail.triceps': 'Triceps (long, latéral, médial) regroupés.',
    'recap.zones.detail.quads':
      'Quadriceps (vaste interne / externe / droit) — course, squats, sauts ; répartition cardio selon type de séance (ex. fractionné > fondamental).',
    'recap.zones.detail.hamstrings':
      'Ischio-jambiers — chaîne postérieure ; plus sollicités sur les sorties longues et le rythme modéré que sur sprints très courts.',
    'recap.zones.detail.calves':
      'Mollets (jumeaux / soléaire) — impulsions, corde à sauter, stabilisation en course.',
    'recap.zones.detail.fullBody':
      'Burpees, circuits, mouvements multi-articulaires — charge « poly » ; le chiffre ci-dessous est le total de toutes les reps muscu cochées (sans double compte).',
    'recap.zones.loadDisplay': 'Charge affichée',
    'recap.zones.strength': 'Muscu (decay)',
    'recap.zones.cardioRaw': 'Cardio brut',
    'recap.zones.recoveryLabel': 'Lecture récup',
    'recap.zones.recovery.ready': 'Prêt à solliciter',
    'recap.zones.recovery.inProgress': 'En récupération',
    'recap.zones.recovery.fatigued': 'Fatigue élevée',
    'recap.zones.volumeCheckedTitle': 'Volume coché',
    'recap.zones.repsChecked': 'Volume coché (arrondi)',
    'recap.zones.repsPartsHint':
      'Somme des reps (ou secondes de gainage) des exos cochés sur la période, répartie entre les groupes du référentiel Exercices (parts si plusieurs muscles).',
    'recap.zones.topFromProgram': 'Exercices (réf. onglet Exercices)',
    'recap.zones.exerciseLine': '{{name}} · {{n}} {{unit}}',
    'recap.zones.unitReps': 'reps (parts)',
    'recap.zones.unitSeconds': 's gainage (parts)',
    'recap.zones.fullBodyVolumeTitle':
      'Total reps muscu cochées sur la période (une fois par série, toutes zones confondues).',
    'recap.zones.fullBodyVolumeFoot':
      'Les autres cartes affichent des parts réparties selon les muscles de l’onglet Exercices ; ici = somme brute des reps (hors gainage secondes).',
    'recap.zones.endurancePushupsExercise': 'Pompes (saisie Endurance)',
    'recap.zones.endurancePushupsSplitLine':
      '{{total}} pompes · {{parts}} sur cette zone ({{pct}} % du volume pompes Endurance)',
    'recap.zones.endurancePushupsSplitTitle':
      'Toutes les pompes saisies en Endurance sont comptées : le Récap répartit chaque pompe entre pecs, triceps, épaules et tronc (comme pour la charge cardio). Le détail à droite = part de ce total pour cette carte.',
    'recap.zones.unmappedExerciseName':
      'Exercice (hors programme actuel) — voir calendrier ou onglet Exercices',

    'recap.endurance.title': 'Endurance & cardio saisis',
    'recap.endurance.intro':
      'Résumé des séances enregistrées dans l’onglet Endurance (filtré sur la même période que le Récap).',
    'recap.endurance.empty': 'Aucune séance d’endurance sur cette période.',
    'recap.endurance.activity.running': 'Course',
    'recap.endurance.activity.jumprope': 'Corde à sauter',
    'recap.endurance.activity.pushups': 'Pompes (sessions)',
    'recap.endurance.activity.swimming': 'Natation',
    'recap.endurance.activity.boxing': 'Boxe / sac',
    'recap.endurance.sumMinutes': '{{m}} min cumulées',
    'recap.endurance.sumKm': '{{km}} km cumulés',
    'recap.endurance.sumPushups': '{{n}} pompes cumulées',
    'recap.endurance.sumJumps': '{{n}} sauts cumulés',
    'recap.endurance.sumLoad': 'charge cal. ~{{n}}',
    'recap.endurance.row.km': '{{km}} km',
    'recap.endurance.row.min': '{{m}} min',
    'recap.endurance.row.runType': '· profil {{type}}',
    'recap.endurance.row.jumps': '{{n}} sauts',
    'recap.endurance.row.ropeType': '· mode {{type}}',
    'recap.endurance.row.pushups': '{{n}} pompes',

    'recap.challenges.title': 'Défis endurance',
    'recap.challenges.empty': 'Aucun défi pertinent sur cette période (ou pas encore créé).',
    'recap.challenge.unnamed': 'Défi sans nom',
    'recap.challenge.activity': 'Activité : {{type}}',
    'recap.challenge.status': 'statut {{s}}',
    'recap.challenge.goalPushups': '≥ {{n}} pompes',
    'recap.challenge.goalDuration': '≤ {{min}} min',
    'recap.challenge.goalDistance': '≥ {{km}} km',
    'recap.challenge.goalJumps': '≥ {{n}} sauts',
    'recap.challenge.noNumericGoal': 'Objectif libre (voir notes du défi)',
    'recap.challenge.lastDone': 'Dernière validation : {{date}}',
    
    // Finance
    'finance.title': 'Finance',
    'finance.subtitle': 'Gestion complète de vos finances personnelles',
    'finance.inDevelopment': 'En cours de développement',
    'finance.underDevelopment': 'En cours de développement',
    'finance.comingSoon': 'Bientôt disponible',
    'finance.subTabs.dashboard': 'Dashboard',
    'finance.subTabs.bourse': 'Bourse',
    'finance.subTabs.budget': 'Budget Personnel',
    'finance.subTabs.investissements': 'Investissements Divers',
    'finance.subTabs.smartShopping': 'Smart Shopping',
    'finance.subTabs.planificateur': 'Planificateur',
    'finance.subTabs.synthese': 'Synthèse',
    'finance.subTabs.theorieRealite': 'Théorie vs Réalité',
    
    // Investissements Divers
    'finance.investissements.subTabs.dashboard': 'Dashboard Unifié',
    'finance.investissements.subTabs.or': 'Or Physique',
    'finance.investissements.subTabs.liquidites': 'Liquidités',
    'finance.investissements.subTabs.bourseCrypto': 'Bourse & Crypto',
    
    // Planificateur Financier
    'finance.planificateur.sections.repartition': 'Répartition Salaire',
    'finance.planificateur.sections.loisirs': 'Planification Loisirs',
    'finance.planificateur.sections.3ans': 'Planification 3 Ans',
    'finance.planificateur.sections.sync': 'Synchronisation',
    'finance.planificateur.repartition.title': 'Répartition Salaire',
    'finance.planificateur.repartition.loyer': 'Loyer',
    'finance.planificateur.repartition.or': 'Investissement Or',
    'finance.planificateur.repartition.bourse': 'Investissement Bourse',
    'finance.planificateur.repartition.cash': 'Cash Accumulation',
    'finance.planificateur.loisirs.title': 'Planification Loisirs',
    'finance.planificateur.3ans.title': 'Planification 3 Ans',
    'finance.planificateur.3ans.timeline': 'Timeline Interactive',
    'finance.planificateur.3ans.chargesFixes': 'Charges Fixes Mensuelles',
    'finance.planificateur.3ans.epargne': 'Épargne Loisirs Intelligente',
    'finance.planificateur.sync.title': 'Synchronisation Cross-Modules',
    
    // Budget Personnel
    'finance.budget.subTabs.dashboard': 'Dashboard',
    'finance.budget.subTabs.categories': 'Catégories',
    'finance.budget.subTabs.calendar': 'Calendrier',
    'finance.budget.revenus': 'Revenus',
    'finance.budget.depenses': 'Dépenses',
    'finance.budget.epargne': 'Épargne',
    'finance.budget.restant': 'Restant',
    'finance.budget.statut.maitrise': 'Maîtrisé',
    'finance.budget.statut.attention': 'Attention',
    'finance.budget.statut.depassement': 'Dépassement',
    'finance.budget.statut.critique': 'Critique',
    
    // HomePage
    'home.title.line1': 'N\'attends rien,',
    'home.title.line2': 'apprécie',
    'home.title.line3': 'tout.',
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
    
    // Calendar (vue calendrier & heatmap)
    'calendar.stats.reps_endurance': 'reps + endurance',
    'calendar.stats.total_time': 'temps total',
    'calendar.sessions': 'séances',
    // Libellés spécifiques au CalendarHeatmap
    'calendar.heatmap.viewModes.month': 'Mois',
    'calendar.heatmap.viewModes.year': 'Année',
    'calendar.heatmap.viewModes.streaks': 'Streaks',
    'calendar.heatmap.intensity': 'Intensité',
    'calendar.heatmap.showStats': 'Afficher les stats',
    'calendar.heatmap.hideStats': 'Masquer les stats',
    'calendar.heatmap.streaksAnalysis': 'Analyse des Streaks',
    'calendar.heatmap.monthlyJustifications': 'Justifications du mois :',
    'calendar.heatmap.yearSummary': 'Résumé {{year}}',
    'calendar.heatmap.bestMonth': 'Meilleur mois',
    'calendar.heatmap.bestDay': 'Meilleur jour',
    'calendar.heatmap.avgPerSession': 'Moyenne/séance',
    'calendar.heatmap.repsPerSession': 'reps par séance',
    'calendar.heatmap.intensityLabels.extreme': 'Extrême',
    'calendar.heatmap.intensityLabels.intense': 'Intense',
    'calendar.heatmap.intensityLabels.moderate': 'Modéré',
    'calendar.heatmap.intensityLabels.light': 'Léger',
    'calendar.heatmap.intensityLabels.rest': 'Repos',
    'calendar.heatmap.monthNames.january': 'Janvier',
    'calendar.heatmap.monthNames.february': 'Février',
    'calendar.heatmap.monthNames.march': 'Mars',
    'calendar.heatmap.monthNames.april': 'Avril',
    'calendar.heatmap.monthNames.may': 'Mai',
    'calendar.heatmap.monthNames.june': 'Juin',
    'calendar.heatmap.monthNames.july': 'Juillet',
    'calendar.heatmap.monthNames.august': 'Août',
    'calendar.heatmap.monthNames.september': 'Septembre',
    'calendar.heatmap.monthNames.october': 'Octobre',
    'calendar.heatmap.monthNames.november': 'Novembre',
    'calendar.heatmap.monthNames.december': 'Décembre',
    'calendar.heatmap.streaks.currentStreak': 'Streak actuel',
    'calendar.heatmap.streaks.longestStreak': 'Record personnel',
    'calendar.heatmap.streaks.longestStreakDesc': 'Plus long streak',
    'calendar.heatmap.streaks.consecutiveDays': 'Jours consécutifs',
    'calendar.heatmap.streaks.noStreak': 'Aucun streak en cours',
    
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
    
    // Books - Sub-tabs
    'books.subtabs.library': 'Bibliothèque',
    'books.subtabs.statistics': 'Statistiques',
    
    // Books - Statistics
    'books.statistics.title': 'Statistiques de Lecture',
    'books.statistics.subtitle': 'Analyse de tes habitudes et progression de lecture',
    'books.statistics.comparison': 'Comparaison',
    'books.statistics.filters': 'Filtres',
    'books.statistics.period': 'Période',
    'books.statistics.allGenres': 'Tous les genres',
    'books.statistics.allStatuses': 'Tous les statuts',
    'books.statistics.allAuthors': 'Tous les auteurs',
    'books.statistics.noData.title': 'Aucune donnée de lecture',
    'books.statistics.noData.description': 'Commence à enregistrer des sessions de lecture pour voir tes statistiques apparaître ici.',
    'books.statistics.noData.suggestions.title': 'Pour commencer:',
    'books.statistics.noData.suggestions.addBook': 'Ajoute un livre à ta bibliothèque',
    'books.statistics.noData.suggestions.addSession': 'Enregistre une session de lecture',
    'books.statistics.noData.suggestions.viewStats': 'Reviens ici pour voir tes statistiques',
    
    // Books - Status translations
    'books.status.in-progress': 'En cours',
    'books.status.completed': 'Terminé',
    'books.status.to-read': 'À lire',
    'books.status.paused': 'En pause',
    'books.status.abandoned': 'Abandonné',
    
    // Charts
    'charts.empty.title': 'Aucune donnée disponible',
    'charts.empty.message': 'Commencez à enregistrer vos entraînements pour voir vos graphiques ici.'
  },
  
  [LANGUAGES.EN]: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.today': 'Today',
    'nav.sport': 'Sport',
    'nav.quests': 'Quests',
    'nav.apprentissage': 'Learning',
    'nav.books': 'Books',
    'nav.calendar': 'Calendar',
    'nav.stats': 'Statistics',
    'nav.program': 'Program',
    'nav.exercises': 'Exercises',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'nav.finance': 'Finance',
    'nav.mainTabs': 'Main tabs',
    'nav.sportTabs': 'Sport tabs',
    'nav.dataEntry': 'Data entry',
    'nav.nutrition': 'Nutrition',
    'nav.progress': 'Progress',
    'nav.endurance': 'Endurance',
    'nav.charts': 'Charts',
    'nav.predictions': 'Predictions',
    'nav.smartBalancing': 'Smart Balancing',
    'nav.garmin': 'Garmin',
    'nav.recap': 'Recap',

    // Sport — muscle recap tab
    'recap.title': 'Muscle recap',
    'recap.subtitle':
      '3D map, per-zone scores (same engine as colors), endurance and challenges for the selected period.',
    'recap.bodyMapHeading': 'Body map',
    'recap.bodyMapStats.reps': '{{n}} strength reps (checked)',
    'recap.bodyMapStats.iso': '{{s}} s planks / holds',
    'recap.bodyMapStats.minutes': '{{m}} min (endurance + holds)',
    'recap.legendHeading': 'Legend & details',
    'recap.legendPlaceholder':
      'Per-muscle colors, balance score and suggestions will show here once the aggregation engine is wired.',
    'recap.period.today': 'Today',
    'recap.period.7d': '7 days',
    'recap.period.30d': '30 days',
    'recap.period.3m': '3 months',
    'recap.period.6m': '6 months',
    'recap.period.1y': '1 year',
    'recap.period.2y': '2 years',
    'recap.period.all': 'All time',
    'recap.periodNote': 'Period: {{label}}',
    'recap.bodyHint':
      'Drag to rotate · scroll or pinch to zoom · auto rotation',
    'recap.legendIntro':
      'Indicative scale: displayed load = strength (weighted reps, decay) + blended cardio (see summary above). Same scale as the per-zone bars below.',
    'recap.legend.level.rest': 'Light grey — rest / no stimulus',
    'recap.legend.level.veryLow': 'Cold blue — very low stimulus',
    'recap.legend.level.undertrained': 'Blue — undertrained',
    'recap.legend.level.light': 'Light green — light activation',
    'recap.legend.level.optimal': 'Green — optimal stimulus',
    'recap.legend.level.moderateHigh': 'Yellow — elevated moderate volume',
    'recap.legend.level.high': 'Light orange — high demand',
    'recap.legend.level.nearOverload': 'Orange — near overload',
    'recap.legend.level.overload': 'Light red — overload',
    'recap.legend.level.severe': 'Red — very high overload',
    'recap.legend.level.overtraining': 'Violet — likely overtraining',
    'recap.legend.level.critical': 'Very dark red — critical zone (caution)',
    'recap.legendRecoveryTitle': 'Recovery (per zone)',
    'recap.legendRecovery.ready': 'Ready to train',
    'recap.legendRecovery.inProgress': 'Recovering',
    'recap.legendRecovery.fatigued': 'High fatigue — avoid intense volume',
    'recap.loadSummary':
      'Displayed load = strength (weighted, decay {{lambda}}/day) + {{cardioPct}}% capped cardio per zone.',
    'recap.dominant': 'Top zone by checked training volume (rep shares): {{label}}',
    'recap.muscleGroup.chest': 'Chest',
    'recap.muscleGroup.back': 'Back',
    'recap.muscleGroup.shoulders': 'Shoulders',
    'recap.muscleGroup.biceps': 'Biceps',
    'recap.muscleGroup.triceps': 'Triceps',
    'recap.muscleGroup.legs': 'Legs',
    'recap.muscleGroup.quads': 'Quadriceps',
    'recap.muscleGroup.hamstrings': 'Hamstrings',
    'recap.muscleGroup.calves': 'Calves',
    'recap.muscleGroup.core': 'Core',
    'recap.muscleGroup.full_body': 'Full body',

    'recap.zones.title': 'Per muscle zone',
    'recap.zones.intro':
      'Recap scores + checked reps (same source as calendar / data entry). Legs split into quads / hamstrings / calves; running and jump rope spread cardio load by session type. Card colors blend relative volume + relative load (aligned with per-zone 3D colors when meshes are mapped).',
    'recap.zones.section.upper': 'Upper body & trunk',
    'recap.zones.section.arms': 'Arms',
    'recap.zones.section.legs': 'Legs',
    'recap.zones.section.poly': 'Full-body / compound',
    'recap.zones.detail.chest': 'Chest (global) — flyes / incline / close-grip share this score.',
    'recap.zones.detail.back':
      'Back: traps, lats, rhomboids, erectors (one aggregated “back” load + pulls / rows).',
    'recap.zones.detail.shoulders':
      'Shoulders / delts (ant., lat., post.); forearms mainly through pulls and curls.',
    'recap.zones.detail.core': 'Planks, abs, obliques — anything mapped as “core” in the program.',
    'recap.zones.detail.biceps': 'Biceps + brachialis (single load bucket).',
    'recap.zones.detail.triceps': 'Triceps heads grouped together.',
    'recap.zones.detail.quads':
      'Quadriceps — running, squats, jumps; cardio split varies by session type (e.g. intervals vs easy).',
    'recap.zones.detail.hamstrings':
      'Hamstrings — posterior chain; relatively more on long runs and steady rhythm.',
    'recap.zones.detail.calves':
      'Calves — push-off, jump rope, running stability.',
    'recap.zones.detail.fullBody':
      'Burpees, circuits, multi-joint moves — poly bucket load; the big number is total checked strength reps (no double-count).',
    'recap.zones.loadDisplay': 'Displayed load',
    'recap.zones.strength': 'Strength (decay)',
    'recap.zones.cardioRaw': 'Raw cardio',
    'recap.zones.recoveryLabel': 'Recovery read',
    'recap.zones.recovery.ready': 'Ready to train',
    'recap.zones.recovery.inProgress': 'Recovering',
    'recap.zones.recovery.fatigued': 'High fatigue',
    'recap.zones.volumeCheckedTitle': 'Checked volume',
    'recap.zones.repsChecked': 'Checked volume (rounded)',
    'recap.zones.repsPartsHint':
      'Sum of reps (or plank seconds) from checked sets in the window, split using the Exercises database muscle groups (shared parts when multiple muscles).',
    'recap.zones.topFromProgram': 'Exercises (Exercises tab reference)',
    'recap.zones.exerciseLine': '{{name}} · {{n}} {{unit}}',
    'recap.zones.unitReps': 'reps (share)',
    'recap.zones.unitSeconds': 's plank (share)',
    'recap.zones.fullBodyVolumeTitle':
      'Total checked strength reps in the window (once per set, all muscle zones combined).',
    'recap.zones.fullBodyVolumeFoot':
      'Other cards show shares split from the Exercises muscle map; here = raw rep sum (excludes hold seconds).',
    'recap.zones.endurancePushupsExercise': 'Push-ups (Endurance tab)',
    'recap.zones.endurancePushupsSplitLine':
      '{{total}} push-ups · {{parts}} to this zone ({{pct}}% of Endurance push-up volume)',
    'recap.zones.endurancePushupsSplitTitle':
      'All Endurance push-ups are counted; the recap splits each rep across chest, triceps, shoulders, and core (same model as cardio load). The right-hand detail is this card’s share of that total.',
    'recap.zones.unmappedExerciseName':
      'Exercise (not in current program) — check calendar or Exercises tab',

    'recap.endurance.title': 'Logged endurance & cardio',
    'recap.endurance.intro':
      'Sessions saved in the Endurance tab, filtered to the same period as this recap.',
    'recap.endurance.empty': 'No endurance sessions in this period.',
    'recap.endurance.activity.running': 'Running',
    'recap.endurance.activity.jumprope': 'Jump rope',
    'recap.endurance.activity.pushups': 'Push-ups (sessions)',
    'recap.endurance.activity.swimming': 'Swimming',
    'recap.endurance.activity.boxing': 'Boxing / bag',
    'recap.endurance.sumMinutes': '{{m}} min total',
    'recap.endurance.sumKm': '{{km}} km total',
    'recap.endurance.sumPushups': '{{n}} push-ups total',
    'recap.endurance.sumJumps': '{{n}} jumps total',
    'recap.endurance.sumLoad': 'cal. load ~{{n}}',
    'recap.endurance.row.km': '{{km}} km',
    'recap.endurance.row.min': '{{m}} min',
    'recap.endurance.row.runType': '· profile {{type}}',
    'recap.endurance.row.jumps': '{{n}} jumps',
    'recap.endurance.row.ropeType': '· mode {{type}}',
    'recap.endurance.row.pushups': '{{n}} push-ups',

    'recap.challenges.title': 'Endurance challenges',
    'recap.challenges.empty': 'No relevant challenge in this period (or none created yet).',
    'recap.challenge.unnamed': 'Unnamed challenge',
    'recap.challenge.activity': 'Activity: {{type}}',
    'recap.challenge.status': 'status {{s}}',
    'recap.challenge.goalPushups': '≥ {{n}} push-ups',
    'recap.challenge.goalDuration': '≤ {{min}} min',
    'recap.challenge.goalDistance': '≥ {{km}} km',
    'recap.challenge.goalJumps': '≥ {{n}} jumps',
    'recap.challenge.noNumericGoal': 'Open goal (see challenge notes)',
    'recap.challenge.lastDone': 'Last completion: {{date}}',
    
    // Finance
    'finance.title': 'Finance',
    'finance.subtitle': 'Complete personal finance management',
    'finance.inDevelopment': 'Under development',
    'finance.underDevelopment': 'Under development',
    'finance.comingSoon': 'Coming soon',
    'finance.subTabs.dashboard': 'Dashboard',
    'finance.subTabs.bourse': 'Stock Market',
    'finance.subTabs.budget': 'Personal Budget',
    'finance.subTabs.investissements': 'Diversified Investments',
    'finance.subTabs.smartShopping': 'Smart Shopping',
    'finance.subTabs.planificateur': 'Planner',
    
    // Planificateur Financier
    'finance.planificateur.sections.repartition': 'Salary Distribution',
    'finance.planificateur.sections.loisirs': 'Leisure Planning',
    'finance.planificateur.sections.3ans': '3-Year Planning',
    'finance.planificateur.sections.sync': 'Synchronization',
    'finance.planificateur.repartition.title': 'Salary Distribution',
    'finance.planificateur.repartition.loyer': 'Rent',
    'finance.planificateur.repartition.or': 'Gold Investment',
    'finance.planificateur.repartition.bourse': 'Stock Investment',
    'finance.planificateur.repartition.cash': 'Cash Accumulation',
    'finance.planificateur.loisirs.title': 'Leisure Planning',
    'finance.planificateur.3ans.title': '3-Year Planning',
    'finance.planificateur.3ans.timeline': 'Interactive Timeline',
    'finance.planificateur.3ans.chargesFixes': 'Monthly Fixed Charges',
    'finance.planificateur.3ans.epargne': 'Smart Leisure Savings',
    'finance.planificateur.sync.title': 'Cross-Module Synchronization',
    'finance.subTabs.synthese': 'Summary',
    'finance.subTabs.theorieRealite': 'Theory vs Reality',
    
    // Diversified Investments
    'finance.investissements.subTabs.dashboard': 'Unified Dashboard',
    'finance.investissements.subTabs.or': 'Physical Gold',
    'finance.investissements.subTabs.liquidites': 'Liquidity',
    'finance.investissements.subTabs.bourseCrypto': 'Stock & Crypto',
    
    // Budget Personnel
    'finance.budget.subTabs.dashboard': 'Dashboard',
    'finance.budget.subTabs.categories': 'Categories',
    'finance.budget.subTabs.calendar': 'Calendar',
    'finance.budget.revenus': 'Income',
    'finance.budget.depenses': 'Expenses',
    'finance.budget.epargne': 'Savings',
    'finance.budget.restant': 'Remaining',
    'finance.budget.statut.maitrise': 'Under Control',
    'finance.budget.statut.attention': 'Attention',
    'finance.budget.statut.depassement': 'Over Budget',
    'finance.budget.statut.critique': 'Critical',
    
    // HomePage
    'home.title.line1': 'Expect nothing,',
    'home.title.line2': 'appreciate',
    'home.title.line3': 'everything.',
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
    'calendar.heatmap.viewModes.month': 'Month',
    'calendar.heatmap.viewModes.year': 'Year',
    'calendar.heatmap.viewModes.streaks': 'Streaks',
    'calendar.heatmap.intensity': 'Intensity',
    'calendar.heatmap.showStats': 'Show stats',
    'calendar.heatmap.hideStats': 'Hide stats',
    'calendar.heatmap.streaksAnalysis': 'Streaks analysis',
    'calendar.heatmap.monthlyJustifications': 'Monthly justifications:',
    'calendar.heatmap.yearSummary': '{{year}} Summary',
    'calendar.heatmap.bestMonth': 'Best month',
    'calendar.heatmap.bestDay': 'Best day',
    'calendar.heatmap.avgPerSession': 'Average/session',
    'calendar.heatmap.repsPerSession': 'reps per session',
    'calendar.heatmap.intensityLabels.extreme': 'Extreme',
    'calendar.heatmap.intensityLabels.intense': 'Intense',
    'calendar.heatmap.intensityLabels.moderate': 'Moderate',
    'calendar.heatmap.intensityLabels.light': 'Light',
    'calendar.heatmap.intensityLabels.rest': 'Rest',
    'calendar.heatmap.monthNames.january': 'January',
    'calendar.heatmap.monthNames.february': 'February',
    'calendar.heatmap.monthNames.march': 'March',
    'calendar.heatmap.monthNames.april': 'April',
    'calendar.heatmap.monthNames.may': 'May',
    'calendar.heatmap.monthNames.june': 'June',
    'calendar.heatmap.monthNames.july': 'July',
    'calendar.heatmap.monthNames.august': 'August',
    'calendar.heatmap.monthNames.september': 'September',
    'calendar.heatmap.monthNames.october': 'October',
    'calendar.heatmap.monthNames.november': 'November',
    'calendar.heatmap.monthNames.december': 'December',
    'calendar.heatmap.streaks.currentStreak': 'Current streak',
    'calendar.heatmap.streaks.longestStreak': 'Personal record',
    'calendar.heatmap.streaks.longestStreakDesc': 'Longest streak',
    'calendar.heatmap.streaks.consecutiveDays': 'Consecutive days',
    'calendar.heatmap.streaks.noStreak': 'No streak in progress',
    
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
    
    // Books - Sub-tabs
    'books.subtabs.library': 'Library',
    'books.subtabs.statistics': 'Statistics',
    
    // Books - Statistics
    'books.statistics.title': 'Reading Statistics',
    'books.statistics.subtitle': 'Analysis of your reading habits and progress',
    'books.statistics.comparison': 'Comparison',
    'books.statistics.filters': 'Filters',
    'books.statistics.period': 'Period',
    'books.statistics.allGenres': 'All genres',
    'books.statistics.allStatuses': 'All statuses',
    'books.statistics.allAuthors': 'All authors',
    'books.statistics.noData.title': 'No reading data',
    'books.statistics.noData.description': 'Start recording reading sessions to see your statistics appear here.',
    'books.statistics.noData.suggestions.title': 'To get started:',
    'books.statistics.noData.suggestions.addBook': 'Add a book to your library',
    'books.statistics.noData.suggestions.addSession': 'Record a reading session',
    'books.statistics.noData.suggestions.viewStats': 'Come back here to see your statistics',
    
    // Books - Status translations
    'books.status.in-progress': 'In progress',
    'books.status.completed': 'Completed',
    'books.status.to-read': 'To read',
    'books.status.paused': 'Paused',
    'books.status.abandoned': 'Abandoned',
    
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
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

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

      // Fallback robuste: si la locale est complète (ex: fr-FR), essayer la langue de base (fr)
      const baseLang = getBaseLanguage(lang);
      if (baseLang && baseLang !== lang) {
        const baseNamespaceData = getCachedNamespace(baseLang, namespace);
        if (baseNamespaceData && namespaceKey) {
          const baseTranslation = getNestedValue(baseNamespaceData, namespaceKey);
          if (baseTranslation) {
            return baseTranslation;
          }
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
    const resolvedFromSource = !!translation;

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
          if (!isMountedRef.current) return;
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

    // Ne pas figer en cache une clé brute tant que le namespace n'a pas répondu :
    // sinon le premier rendu enregistre la clé comme « traduction » et elle reste affichée à vie.
    const shouldCache = resolvedFromSource || !namespace;
    if (shouldCache) {
      translationCache.set(cacheKey, result);
    }

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

