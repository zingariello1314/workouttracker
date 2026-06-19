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
    'nav.code': 'Code',
    'nav.codeCalendar': 'Calendrier',
    'nav.codeJournal': 'Journal & directives',
    'nav.codeStats': 'Statistiques',
    'nav.codeTabs': 'Onglets Code',
    'nav.calendar': 'Calendrier',
    'nav.stats': 'Statistiques',
    'nav.sportAnalytics': 'Analyses & prévisions',
    'nav.program': 'Programme',
    'nav.addictionQuit': 'Arrêt addiction',
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
    'sportAnalyticsHub.title': 'Analyses & prévisions',
    'sportAnalyticsHub.subtitle':
      'Statistiques, prédictions, équilibre intelligent et historique des séances au même endroit.',
    'sportAnalyticsHub.historyHint': 'Historique complet des données enregistrées.',
    'sportAnalyticsHub.loading': 'Chargement…',

    // Arrêt addiction (Sport)
    'addictionQuit.title': 'Arrêt addiction',
    'addictionQuit.subtitle':
      'Deux compteurs (tabac & THC), jalons sur 20 ans, journal des envies — données sur ton appareil.',
    'addictionQuit.sub.timers': 'Compteurs & bénéfices',
    'addictionQuit.sub.cravings': 'Journal des envies',
    'addictionQuit.benefits20y': 'Bénéfices sur 20 ans',
    'addictionQuit.gaugePct': 'Jauge : {{pct}} % du parcours',
    'addictionQuit.nextMilestone': 'Prochain palier : {{label}} — {{when}}',
    'addictionQuit.allMilestonesDone': 'Tous les jalons affichés sont atteints sur cette frise.',
    'addictionQuit.progressAria': 'Parcours sur 20 ans : {{pct}} pour cent complété.',
    'addictionQuit.progressAriaTobacco': 'Parcours tabac sans fumer sur 20 ans : {{pct}} pour cent complété.',
    'addictionQuit.progressAriaThc': 'Parcours sans cannabis sur 20 ans : {{pct}} pour cent complété.',
    'addictionQuit.gaugeValueText': '{{pct}} % du parcours sur 20 ans.{{nextPart}}',
    'addictionQuit.gaugeNextPart': ' Prochain jalon : {{label}}.',
    'addictionQuit.estimateTitle': 'Estimation (optionnel)',
    'addictionQuit.packsPerDay': 'Paquets / jour (avant arrêt)',
    'addictionQuit.packPrice': 'Prix du paquet (€)',
    'addictionQuit.jointsPerWeek': 'Joints / semaine (avant arrêt)',
    'addictionQuit.estimateDisclaimer':
      'Estimation indicative, pas une mesure médicale. Variations selon les habitudes réelles.',
    'addictionQuit.packsAvoided': '~{{n}} paquets non fumés',
    'addictionQuit.jointsAvoided': '~{{n}} joints non consommés',
    'addictionQuit.moneySaved': '~{{n}} € économisés (tabac)',
    'addictionQuit.defineQuit': 'Définis la date et l’heure exactes d’arrêt ci-dessus pour lancer le compteur.',
    'addictionQuit.clearQuit': 'Effacer',
    'addictionQuit.clearQuitConfirm': 'Effacer la date d’arrêt pour ce suivi ?',
    'addictionQuit.years': 'Ans',
    'addictionQuit.days': 'Jours',
    'addictionQuit.hours': 'Heures',
    'addictionQuit.minutes': 'Minutes',
    'addictionQuit.seconds': 'Secondes',
    'addictionQuit.trackNameAria': 'Nom du suivi',
    'addictionQuit.recordCraving': 'Enregistrer une vague d’envie',
    'addictionQuit.recordHelp':
      'Données sauvegardées localement. Le tableau s’élargit si un jour dépasse le nombre de cases des autres.',
    'addictionQuit.addCraving': 'Ajouter l’envie',
    'addictionQuit.quickAdd': '+ Envie maintenant',
    'addictionQuit.historyByDay': 'Historique par jour',
    'addictionQuit.cravingsOnDay': '{{n}} envie(s)',
    'addictionQuit.dayNoCravings': 'Aucune envie enregistrée ce jour.',
    'addictionQuit.slotsSummary': '{{slots}} case(s) par jour · {{total}} envie(s) au total',
    'addictionQuit.filterAll': 'Tous',
    'addictionQuit.filterCig': 'Tabac',
    'addictionQuit.filterThc': 'THC',
    'addictionQuit.summaryTitle': 'Synthèse',
    'addictionQuit.avg7': 'Intensité moy. (7 j) : {{v}}',
    'addictionQuit.avg30': 'Intensité moy. (30 j) : {{v}}',
    'addictionQuit.weekCount': 'Envies (7 derniers j) : {{n}}',
    'addictionQuit.trend': 'Tendance vs semaine précédente : {{t}}',
    'addictionQuit.trendUp': 'hausse',
    'addictionQuit.trendDown': 'baisse',
    'addictionQuit.trendFlat': 'stable',
    'addictionQuit.chartTitle': 'Envies par jour (30 derniers jours)',
    'addictionQuit.exportCsv': 'Exporter CSV',
    'addictionQuit.copySummary': 'Copier le résumé',
    'addictionQuit.copied': 'Copié dans le presse-papiers',
    'addictionQuit.editTitle': 'Modifier l’envie',
    'addictionQuit.save': 'Enregistrer',
    'addictionQuit.cancel': 'Annuler',
    'addictionQuit.day': 'Jour',
    'addictionQuit.quitDateTime': 'Date et heure d’arrêt',
    'addictionQuit.timeOptional': 'Heure (optionnel)',
    'addictionQuit.track': 'Suivi',
    'addictionQuit.intensity': 'Puissance (1–10)',
    'addictionQuit.durationMin': 'Durée (minutes, optionnel)',
    'addictionQuit.notes': 'Notes',
    'addictionQuit.trigger': 'Déclencheur',
    'addictionQuit.outcome': 'Résultat',
    'addictionQuit.place': 'Lieu (optionnel)',
    'addictionQuit.mobileCards': 'Vue mobile',
    'addictionQuit.deleteConfirm': 'Supprimer cette entrée ?',
    'addictionQuit.trigger.none': '—',
    'addictionQuit.trigger.stress': 'Stress',
    'addictionQuit.trigger.boredom': 'Ennui',
    'addictionQuit.trigger.alcohol': 'Alcool',
    'addictionQuit.trigger.social': 'Contexte social',
    'addictionQuit.trigger.sleep': 'Sommeil',
    'addictionQuit.trigger.afterMeal': 'Après repas',
    'addictionQuit.trigger.work': 'Travail',
    'addictionQuit.trigger.other': 'Autre',
    'addictionQuit.outcome.none': '—',
    'addictionQuit.outcome.held': 'Tenu',
    'addictionQuit.outcome.slipped': 'Craquage',
    'addictionQuit.milestoneCurrent': 'Atteint dans cette période',
    'addictionQuit.milestonePastSession':
      'Déjà atteint durant une session commencée le {{date}}',
    'addictionQuit.xpModuleTitle': 'XP arrêt addiction',
    'addictionQuit.xpModuleHint':
      'XP comptée dans la barre globale : jalons, jours d’abstinence, et petit bonus pour actes réflexis (phrase du jour, revue hebdo, qualité des notes d’envie).',
    'addictionQuit.relapseTitle': 'Craquage',
    'addictionQuit.relapseHelp':
      'Enregistre un craquage : le compteur repart à zéro, la session est archivée, les jalons déjà atteints restent visibles avec la date de session.',
    'addictionQuit.relapseButton': 'Déclarer un craquage',
    'addictionQuit.relapseHistory': 'Historique des craquages',
    'addictionQuit.relapseModalTitle': 'Déclarer un craquage',
    'addictionQuit.relapseModalBody':
      'Choisis le suivi concerné, la date et l’heure du craquage. Tu peux relancer un nouvel arrêt juste après.',
    'addictionQuit.relapseBoth': 'Tabac + THC',
    'addictionQuit.relapseAt': 'Date et heure du craquage',
    'addictionQuit.relapseNote': 'Note (optionnel)',
    'addictionQuit.relapseConfirm': 'Enregistrer le craquage',
    'addictionQuit.subTabJournal': 'Journal',
    'addictionQuit.subTabRecap': 'Récapitulatif',
    'addictionQuit.scopeLabel': 'Période du résumé',
    'addictionQuit.scopeCurrent': 'Période en cours',
    'addictionQuit.scopeMonth': 'Mois en cours',
    'addictionQuit.scopeYear': 'Année en cours',
    'addictionQuit.scopeAll': 'Tout',
    'addictionQuit.abstinenceChartTitle': 'Progression « 20 ans » (tabac, THC, combiné)',
    'addictionQuit.abstinenceChartDesc':
      'Courbe = part du palier « 20 ans » atteinte en fin de journée pour la session active. Les jours avec une envie notée tombent à 0 % (valeur réelle entre parenthèses au survol).',
    'addictionQuit.abstinenceChartLegendDots':
      'Rond = nouveau jalon « santé » ce jour-là ; losange ambre = repère temps (1er jour, 7 j, 20 j, chaque mois jusqu’à 20 ans).',
    'addictionQuit.abstinenceTooltipPeriodMilestones': 'Repères temps franchis ce jour',
    'addictionQuit.abstinenceDotHealth': 'Jalon santé (ce jour)',
    'addictionQuit.abstinenceDotPeriod': 'Repère temps (ce jour)',
    'addictionQuit.period.day1': '1er jour',
    'addictionQuit.period.day7': '7 premiers jours',
    'addictionQuit.period.day20': '20 premiers jours',
    'addictionQuit.period.month1': '1er mois',
    'addictionQuit.period.monthN': 'Mois {{n}}',
    'addictionQuit.period.twentyYears': '20 ans — horizon complet de la jauge',
    'addictionQuit.periodMilestonesTitle': 'Repères calendaires (jour / mois)',
    'addictionQuit.periodMilestonesHint': 'déplier',
    'addictionQuit.nextPeriodMilestone': 'Prochain repère temps : {{label}} — {{when}}',
    'addictionQuit.abstinenceLegendCig': 'Tabac',
    'addictionQuit.abstinenceLegendThc': 'THC',
    'addictionQuit.abstinenceLegendMix': 'Combiné (moyenne)',
    'addictionQuit.abstinenceTooltipMilestones': 'Jalons franchis ce jour',
    'addictionQuit.abstinenceTooltipNotes': 'Notes des envies',
    'addictionQuit.abstinenceEmpty': 'Aucune session d’arrêt sur la période : le graphique s’affichera après un début de suivi.',
    'addictionQuit.avgScope': 'Intensité moy. (période) : {{v}}',
    'addictionQuit.countScope': 'Envies (période) : {{n}}',
    'addictionQuit.heldScope': 'Tenus (période) : {{n}}',
    'addictionQuit.slippedScope': 'Craquages notés (période) : {{n}}',
    'addictionQuit.recapXp': 'XP cumulée (module)',
    'addictionQuit.recapXpDetail': 'Jalons : {{m}} XP · Jours : {{d}} XP · Réflexion : {{r}} XP',
    'addictionQuit.recapPrint': 'Imprimer / PDF',
    'addictionQuit.recapPrintHint':
      'Dans la boîte d’impression du navigateur, choisis « Enregistrer au format PDF » pour une page à partager avec un soignant.',
    'addictionQuit.recapNarrativeTitle': 'Lecture orientée action (30 j vs 30 j précédents)',
    'addictionQuit.recapNarrativeFoot':
      'Comparaison à toi-même sur tes saisies ; ce n’est ni une norme ni un diagnostic.',
    'addictionQuit.recapNarrativeNeedData':
      'Encore peu d’entrées comparables : continue à noter résultat et contexte pour des phrases plus utiles.',
    'addictionQuit.recapNarrativeMoreHeld':
      'Sur les 30 derniers jours, tu notes plus souvent « tenu » qu’avant quand tu indiques un résultat.',
    'addictionQuit.recapNarrativeLessHeld':
      'Sur les 30 derniers jours, la part de « tenus » est un peu plus basse que sur le mois précédent — sans jugement, utile pour ajuster.',
    'addictionQuit.recapNarrativeMoreWeekend':
      'Les envies notées tombent un peu plus souvent le week-end qu’avant (toujours dans tes données).',
    'addictionQuit.recapNarrativeLessWeekend':
      'La part week-end des envies notées a un peu baissé par rapport au mois précédent.',
    'addictionQuit.recapNarrativeStable':
      'Les tendances récentes sont proches du mois précédent — garde le cap avec ce qui t’aide déjà.',
    'addictionQuit.recapGapTitle': 'Distance entre craquages enregistrés',
    'addictionQuit.recapGapAvg': 'Écart moyen entre deux craquages : {{n}} jours (indicateur de rythme, pas de « perfection »).',
    'addictionQuit.recapGapEmpty': 'Pas assez de craquages enregistrés pour estimer un écart moyen.',
    'addictionQuit.recapThcCorrelation':
      'Dans tes données, les jours avec plusieurs envies THC coïncident souvent avec le déclencheur « {{trigger}} » — corrélation seulement.',
    'addictionQuit.recapCorrelationDisclaimer':
      'Association observée dans ton journal, pas une règle générale ni un conseil médical.',
    'addictionQuit.recapPrivacyWeekend':
      'Afficher l’indice week-end (opt-in) : part des envies notées un samedi ou dimanche (42 derniers jours).',
    'addictionQuit.recapWeekendShare': 'Part week-end des envies notées : {{pct}} %.',
    'addictionQuit.copilotTodayTitle': 'Aujourd’hui — copilote',
    'addictionQuit.copilotDisclaimer':
      'Motifs dérivés de ton historique, présentés comme hypothèses — jamais comme diagnostic ou vérité médicale.',
    'addictionQuit.copilotRiskTitle': 'Ce qui pourrait peser en ce moment',
    'addictionQuit.copilotRiskEmpty': 'Pas encore assez de motifs répétés pour une hypothèse.',
    'addictionQuit.copilotHypothesis': 'Souvent :',
    'addictionQuit.copilotWithPlace': 'lieu noté',
    'addictionQuit.copilotSeenTimes': 'vu {{n}} fois',
    'addictionQuit.copilotHeldTitle': 'Quand tu tiens, ça ressemble à quoi ?',
    'addictionQuit.copilotHeldEmpty': 'Note quelques « tenus » avec déclencheur et heure pour faire apparaître des leviers.',
    'addictionQuit.copilotHeldCount': '{{n}} tenus',
    'addictionQuit.copilotCalmTitle': 'Si tu sens que ça monte',
    'addictionQuit.copilotAct.water': 'Verre d’eau, hydratation',
    'addictionQuit.copilotAct.air': 'Air frais, fenêtre ou dehors 2 minutes',
    'addictionQuit.copilotAct.message': 'Message court à quelqu’un de confiance',
    'addictionQuit.copilotAct.room': 'Changer de pièce ou de posture',
    'addictionQuit.copilotAct.walk': 'Quelques pas ou étirements discrets',
    'addictionQuit.copilotCustomPlaceholder': 'Une micro-action par ligne (texte libre)',
    'addictionQuit.copilotEditActions': 'Personnaliser la liste',
    'addictionQuit.copilotTriggerUnknown': 'Déclencheur non précisé',
    'addictionQuit.bucket.morning': 'matin',
    'addictionQuit.bucket.midday': 'midi',
    'addictionQuit.bucket.afternoon': 'après-midi',
    'addictionQuit.bucket.evening': 'soir',
    'addictionQuit.bucket.night': 'nuit',
    'addictionQuit.bucket.unknown': 'heure non saisie',
    'addictionQuit.reflectionDayTitle': 'Phrase de fin de journée (1–2 lignes)',
    'addictionQuit.reflectionDayPlaceholder': 'Ex. : journée chargée mais j’ai tenu le soir.',
    'addictionQuit.reflectionDayXpHint': 'Noter une phrase compte pour un peu d’XP « réflexif » (avec le reste du module).',
    'addictionQuit.weeklyReviewTitle': 'Revue hebdo (2 minutes)',
    'addictionQuit.weeklyReviewHint': 'Coche quand tu as fait le point sur la semaine — petit bonus XP.',
    'addictionQuit.weeklyReviewDone': 'Semaine cochée',
    'addictionQuit.weeklyReviewButton': 'J’ai fait ma mini-revue',
    'addictionQuit.trackFocusTitle': 'Objectifs / rappels optionnels pour ce suivi',
    'addictionQuit.focusRoutine': 'Routine & stimuli (tabac)',
    'addictionQuit.focusSleep': 'Sommeil (THC)',
    'addictionQuit.focusMood': 'Humeur lendemain (THC)',
    'addictionQuit.trackFocusHelp':
      'Cases indicatives seulement : tu coches ce qui compte pour toi, sans imposer de champs au journal.',
    'addictionQuit.sessionTitleLabel': 'Titre de la session en cours (optionnel)',
    'addictionQuit.sessionTitlePlaceholder': 'Ex. : 2e tentative après le stress du boulot',
    'addictionQuit.relapseSessionTitle': 'Titre de cette session (optionnel)',
    'addictionQuit.relapseSessionTitlePlaceholder': 'Donne un nom au récit de cette période',
    'addictionQuit.relapseReflection': 'Ce que j’en retiens (1 phrase)',
    'addictionQuit.relapseReflectionPlaceholder': 'Une phrase pour la prochaine fois ou un pro',
    'addictionQuit.relapseSessionLine': 'Session : « {{title}} »',
    'addictionQuit.relapseReflectionLine': 'Retenu : {{text}}',
    'addictionQuit.recapRelapses': 'Craquages enregistrés',
    'addictionQuit.recapRelapsesBy': 'Tabac : {{c}} · THC : {{th}}',
    'addictionQuit.recapLongestCig': 'Plus long arrêt tabac',
    'addictionQuit.recapLongestThc': 'Plus long arrêt THC',
    'addictionQuit.recapAbstinentDaysCig': 'Jours calendaires avec suivi tabac (sessions)',
    'addictionQuit.recapAbstinentDaysThc': 'Jours calendaires avec suivi THC (sessions)',
    'addictionQuit.recapCravingsTotal': 'Envies enregistrées (total)',
    'addictionQuit.recapHeldSlipped': 'Tenus / craquages (résultat)',
    'addictionQuit.recapSessions': 'Sessions d’arrêt',
    'addictionQuit.recapSessionsBy': 'Tabac : {{c}} · THC : {{th}}',
    'addictionQuit.sessionTimelineTitle': 'Vue chronologique par session',
    'addictionQuit.sessionTimelineHelp':
      'Les séparateurs regroupent les envies avant / après un craquage (du plus récent au plus ancien).',
    'addictionQuit.sessionDivider': 'Session du {{start}} → {{end}}',
    'addictionQuit.sessionOngoing': 'en cours',

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
    'recap.enrichment.completionGlobal': 'Programme (moy/jour)',
    'recap.enrichment.completionExos': 'Exos (moy/jour)',
    'recap.enrichment.completionStretch': 'Étirements (moy/jour)',
    'recap.enrichment.items': 'sur jours entraînés',
    'recap.enrichment.streak': 'Série actuelle',
    'recap.enrichment.streakBest': 'Record : {{n}} j',
    'recap.enrichment.feedbacks': 'Feedbacks séance',
    'recap.enrichment.feedbackRessenti': 'Ressenti moy. {{v}}/10',
    'recap.enrichment.steps': 'Pas moy. (Garmin)',
    'recap.enrichment.sleepAvg': 'Sommeil {{h}} h',
    'recap.enrichment.garminPartial': 'Signal Garmin partiel',
    'recap.enrichment.completionDaysLine':
      '{{full}} j. à 100 % · {{active}} j. entraînés / {{planned}} j. planifiés · adhérence jours {{legacy}} %',
    'recap.enrichment.seriesOverride': '{{n}} jour(s) avec séries ajustées manuellement',
    'recap.enrichment.circuits': 'Circuits : {{rounds}} tours sur {{days}} jours',
    'recap.enrichment.challengesTitle': 'Défis endurance actifs',
    'recap.enrichment.justifications': 'Justifications (période)',
    'recap.enrichment.leastChecked': 'Exercices les moins cochés',
    'recap.enrichment.leastCheckedHint': 'Taux de coche lors de vos séances effectuées (min. 2 séances). Circuits regroupés ; exos récents comptés depuis leur ajout au programme.',
    'recap.enrichment.leastCheckedRow': '{{checked}}/{{planned}} · {{pct}} %',
    'recap.snapshot.repsPeriod': 'Reps (période)',
    'recap.breadcrumbSport': 'Sport',
    'recap.nav.snapshot': 'Snapshot',
    'recap.nav.analyse': 'Analyse',
    'recap.nav.corps': 'Corps',
    'recap.nav.tendances': 'Tendances',
    'recap.nav.sessions': 'Séances',
    'recap.nav.mobile': 'Navigation Récap',
    'recap.tendances.records': 'Records course',
    'recap.tendances.noRecords': 'Aucun record course enregistré.',
    'recap.snapshot.regularity': 'Régularité',
    'recap.snapshot.running': 'Course',
    'recap.snapshot.volume': 'Volume kg×reps',
    'recap.snapshot.status': 'Statut',
    'recap.snapshot.editQuiz': 'Mettre à jour',
    'recap.snapshot.topZones': 'Zones les plus sollicitées',
    'recap.snapshot.quizIncompleteHint':
      'Complète le questionnaire pour affiner programmes et conseils.',
    'recap.sessions.journalTitle': 'Journal des séances',
    'recap.sessions.journalSubtitle': 'Historique chronologique — muscu, endurance et circuits sur la période.',
    'recap.sessions.type.running': 'Course',
    'recap.sessions.type.swimming': 'Natation',
    'recap.sessions.type.boxing': 'Boxe',
    'recap.sessions.type.jumprope': 'Corde',
    'recap.sessions.type.pushups': 'Pompes',
    'recap.sessions.type.gainage': 'Gainage',
    'recap.sessions.type.strength': 'Muscu',
    'recap.sessions.type.circuit': 'Circuit',
    'recap.sessions.filterAll': 'Tout',
    'recap.sessions.emptyPeriod': 'Aucune séance enregistrée sur cette période.',
    'recap.sessions.loadMore': 'Afficher plus',
    'recap.bodyView.frontLow': 'Face ¾ · contre-plongée (buste)',
    'recap.bodyView.front': 'Face',
    'recap.bodyView.frontHighWide': 'Face · reculée',
    'recap.bodyView.frontWideHang': 'Face · ligne tendue',
    'recap.bodyView.backLower': 'Dos · mollets/arrière cuisse',
    'recap.bodyView.side': 'Profil',
    'recap.bodyView.top': 'Dessus',
    'recap.bodyView.back': 'Dos',
    'recap.bodyHint':
      'Vue : boutons ci-dessus · glisser pour orienter · molette ou pincer pour zoomer · rotation automatique',
    'recap.legendIntro':
      'Échelle relative à la période sélectionnée : les couleurs sont réparties selon tes écarts réels (et non des seuils figés). Charge affichée = musculation (reps pondérées, decay) + part cardio.',
    'recap.legendSpectrumTitle': 'Continuum de charge (nuances)',
    'recap.legendSpectrumCaption':
      'Le dégradé correspond à la même logique que le corps 3D : beaucoup de teintes intermédiaires, donc deux zones à scores proches ne se confondent pas.',
    'recap.legendSpectrumEnds': 'Gauche : faible — droite : forte (toujours relatif à ta période). Au-delà : surcharge relative (violet / sombre).',
    'recap.legendSpectrumAria': 'Dégradé de la charge musculaire relative sur la période',
    'recap.legend.level.midTransition': '↔ Nuance entre deux paliers voisins',
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
    'recap.assessment.title': 'Synthèse profil, niveau & habitudes',
    'recap.assessment.subtitle':
      'Un seul regard : entraînement, corps, nutrition (si saisie) et score indicatif ; courbes sur 84 j. Les remarques sont des pistes à partir de tes données — pas un avis médical.',
    'recap.assessment.badge': 'Profil',
    'recap.assessment.maturity': 'Historique riche (~{{pct}} % du plafond “données”)',
    'recap.assessment.userFallback': 'Utilisateur',
    'recap.assessment.identity': 'Identité',
    'recap.assessment.latestWeight': 'Dernier poids',
    'recap.assessment.bodyFat': 'Graisse corp.',
    'recap.assessment.quizEstimate': 'estim. quiz',
    'recap.assessment.lifetimeReps': 'Reps cumulées (app)',
    'recap.assessment.scoreHint':
      'Composante principale : régularité récente ; rendements décroissants au-delà de gros volumes.',
    'recap.assessment.chartWeight': 'Évolution du poids (impédance / mensurations)',
    'recap.assessment.chartWeightAxis': 'Poids',
    'recap.assessment.chartEmptyWeight':
      'Aucune pesée sur cette période — ajoute une mesure (Suivi corporel).',
    'recap.assessment.chartWeightFoot':
      'Entre deux pesées, la courbe prolonge la dernière valeur connue.',
    'recap.assessment.chartReps': 'Reps musculation par jour',
    'recap.assessment.chartRepsAxis': 'Reps / jour',
    'recap.assessment.chartEmptyReps': 'Pas encore de reps enregistrées.',
    'recap.assessment.chartRepsFoot': 'Total reps cochées (+ pompes endurance) par jour calendaire · {{d}} derniers jours.',
    'recap.assessment.horizonShort': 'Court terme · quelques semaines',
    'recap.assessment.horizonMedium': 'Moyen terme · cycles d’entraînement',
    'recap.assessment.horizonLong': 'Long terme · mois & années',
    'recap.assessment.journey': 'Début du suivi',
    'recap.assessment.tenure': '{{days}} jours depuis la première activité enregistrée (ou date figée).',
    'recap.assessment.window': 'Fenêtre récente',
    'recap.assessment.activeDays':
      '{{n}} jours avec activité · objectif indicatif ~{{exp}} séances (selon quiz & fenêtre récente)',
    'recap.assessment.regularity': 'Régularité vs objectif : {{pct}} %',
    'recap.assessment.program': 'Programme',
    'recap.assessment.sessionAlignTitle': 'Prévu vs réalisé (séances & séries du jour)',
    'recap.assessment.sessionAlignLineAvg':
      'Moyenne prévu / réalisé (charge) : {{score}} % · {{scored}} jour(s) analysé(s) sur {{plan}} où une séance était prévue (séries/reps du jour incluses).',
    'recap.assessment.sessionAlignPartial':
      'Au moins {{plan}} jour(s) avec séance prévue sur la fenêtre : données insuffisantes pour une moyenne fiable (charges / reps).',
    'recap.assessment.sessionOverrides':
      '{{d}} jour(s) avec adaptations séries/reps · {{t}} exercice(s) touché(s).',
    'recap.assessment.sessionOverridesNone': 'Aucune adaptation « séries/reps du jour » sur cette fenêtre.',
    'recap.assessment.loadBlock': 'Charge (kg × reps)',
    'recap.assessment.weightedDays': '{{n}} jours avec au moins une charge saisie',
    'recap.assessment.volumeSum': 'Volume total sur ces jours-là : {{v}} (kg×reps)',
    'recap.assessment.avgVolume': 'Moyenne par jour « avec poids » : {{v}}',
    'recap.assessment.loadOnlyWeightedDays':
      'Les jours sans charge enregistrée sont exclus de ces moyennes de volume.',
    'recap.assessment.repsBlock': 'Reps et complexité',
    'recap.assessment.totalReps': '{{n}} reps (musculation / coché) sur la fenêtre',
    'recap.assessment.avgRepsPerDay': 'Moyenne par jour avec reps : {{n}}',
    'recap.assessment.avgDifficulty': 'Difficulté moyenne (référentiel) : {{d}} / 5',
    'recap.assessment.noDifficulty': 'Peu d’exercices avec difficulté renseignée dans la base.',
    'recap.assessment.quizHeading': 'Quiz profil ({{done}} / {{total}})',
    'recap.assessment.suggestions': 'Suggestions',
    'recap.assessment.predictions': 'Pistes',

    'recap.crossCoach.badge': 'Coach',
    'recap.crossCoach.title': 'Synthèse corps · entraînement · nutrition',
    'recap.crossCoach.subtitle':
      'Vue transversale et messages priorisés à partir de tes saisies locales (pas un avis médical).',
    'recap.crossCoach.loadingChip': 'Nutrition en chargement…',
    'recap.crossCoach.loadingGarminChip': 'Garmin en chargement…',
    'recap.crossCoach.pillar.training': 'Entraînement',
    'recap.crossCoach.pillar.body': 'Corps',
    'recap.crossCoach.pillar.nutrition': 'Nutrition',
    'recap.crossCoach.pillar.trainingLine':
      '{{days}} jours avec activité · {{reps}} reps sur la fenêtre · volume (kg×reps) total : {{vol}}',
    'recap.crossCoach.pillar.distinctExercisesLine':
      'Exercices du programme distincts cochés sur la fenêtre récente : ~{{n}}',
    'recap.crossCoach.pillar.bodyLine.weight': 'Dernière pesée sur la fenêtre : {{w}} kg',
    'recap.crossCoach.pillar.bodyLine.none': 'Pas de pesée récente dans cette fenêtre.',
    'recap.crossCoach.pillar.nutritionLine.loading': 'Chargement du journal nutrition…',
    'recap.crossCoach.pillar.nutritionLine.days': '{{n}} jour(s) avec au moins un repas enregistré sur la fenêtre',
    'recap.crossCoach.pillar.nutritionLine.empty': 'Aucun repas enregistré sur cette fenêtre.',
    'recap.crossCoach.gapsTitle': 'Pour affiner la lecture',
    'recap.crossCoach.gap.quiz': 'Complète le quiz profil pour caler objectifs et régularité.',
    'recap.crossCoach.gap.nutrition_empty': 'Programme nutrition actif mais journal vide sur 28 j.',
    'recap.crossCoach.gap.body_weight': 'Ajoute une pesée (Suivi corporel) pour ancrer la tendance poids.',
    'recap.crossCoach.disclaimer':
      'Tout ceci est calculé localement à partir de tes saisies ; pour un avis nutritionnel ou médical, vois un·e pro.',
    'recap.crossCoach.remarksHeading': 'Remarques',
    'recap.crossCoach.insight.quizIncomplete':
      'Le quiz profil est encore incomplet ({{done}} / {{total}}) : quand tu auras 5 minutes, ça ajuste objectifs et ton des messages.',
    'recap.crossCoach.insight.logMealsWhenProgram':
      'Tu as un programme nutrition : quelques jours de repas notés suffisent pour voir si tu colles à ton plan.',
    'recap.crossCoach.insight.logMealsWhenProgramWithTraining':
      'Tu t’entraînes bien en ce moment mais le journal nutrition est vide : même 2–3 jours de saisie aident à voir si l’énergie suit la charge.',
    'recap.crossCoach.insight.tryMealsForTrainingContext':
      'Sans programme nutrition, tu peux quand même noter des repas de temps en temps : ça donne du contexte à côté de tes séances.',
    'recap.crossCoach.insight.weekMoreActive':
      'Belle semaine : {{current}} jours avec activité, un cran au-dessus de ce que tu faisais en moyenne sur les semaines d’avant (environ {{priorAvg}}).',
    'recap.crossCoach.insight.weekLessActive':
      'Cette semaine est un peu plus calme ({{current}} j. actifs) que ta moyenne récente (≈ {{priorAvg}}) : parfois c’est voulu (récup, emploi du temps) — pas besoin de la dramatiser.',
    'recap.crossCoach.insight.weekLiftVolumeModerate':
      'Volume avec charges un peu plus haut que d’habitude sur les 7 derniers jours : garde un œil sur la fatigue et le sommeil.',
    'recap.crossCoach.insight.weekLiftVolumeStrong':
      'Volume avec charges clairement au-dessus de tes semaines précédentes : si ça s’enchaîne, prévois du facile ou du repos actif.',
    'recap.crossCoach.insight.weekLiftVolumeVeryStrong':
      'Gros pic de volume avec charges vs tes semaines d’avant : priorise récup, hydratation et sommeil plutôt que d’ajouter encore.',
    'recap.crossCoach.insight.repsWeekStrongerVsRecentWeeks':
      'Cette semaine tu enchaînes plus de reps muscu que sur les blocs précédents de la fenêtre : bon signal si le corps suit.',
    'recap.crossCoach.insight.repsWeekQuieterVsRecentWeeks':
      'Moins de reps muscu cette semaine que sur les semaines précédentes de la fenêtre : ça peut être une phase légère ou un créneau manquant — à voir avec ton ressenti.',
    'recap.crossCoach.insight.sportUpNutritionAligned':
      'En parallèle : activité en hausse et apports plutôt proches de tes calories cibles (~{{meanPct}} % en moyenne).',
    'recap.crossCoach.insight.planCheckStreak':
      'Tu coches le plan repas depuis {{days}} jours d’affilée : bon ancrage sur le prévu.',
    'recap.crossCoach.insight.planChecksBuilding':
      '{{leaves}} coches « plan » sur {{days}} jour(s) : ça aide à suivre sans tout saisir au gramme.',
    'recap.crossCoach.insight.regularityLow':
      'Ta régularité est en dessous de l’objectif indicatif du quiz ({{pct}} %) : souvent, deux créneaux fixes par semaine changent tout.',
    'recap.crossCoach.insight.sessionLoadGap':
      'Sur les séances où on peut comparer prévu et réalisé, tu es assez loin du plan (ordre de grandeur {{score}} % en moyenne) : coche charges et reps quand tu peux, ça rend la lecture plus juste.',
    'recap.crossCoach.insight.sessionLoadGood':
      'Bon alignement prévu / réalisé récent (~{{score}} %) : tes séries adaptées reflètent bien ce que tu fais.',
    'recap.crossCoach.insight.weightDown28':
      'Poids en baisse d’environ {{delta}} kg sur les mesures récentes (fenêtre Récap) : croise avec apports et intensité sans tirer des conclusions trop hâtives.',
    'recap.crossCoach.insight.weightUp28':
      'Poids en hausse d’environ {{delta}} kg sur les mesures récentes : normal en masse ; à contextualiser avec ton objectif.',
    'recap.crossCoach.insight.addWeighIn':
      'Pas de pesée sur la fenêtre : un point régulier (ex. une fois/semaine) suffit pour voir une tendance.',
    'recap.crossCoach.insight.firstMealsLogged':
      'Déjà {{days}} jour(s) de repas enregistrés sur 28 j : continue ainsi pour voir stabilité et écarts.',
    'recap.crossCoach.insight.nutritionProgramBuilding':
      'Programme nutrition + journal qui se remplit : tu peux te concentrer sur des ajustements petits mais réguliers.',
    'recap.crossCoach.insight.complianceStrong':
      'Scores de conformité moyens plutôt bons (~{{score}} / 100) sur les jours suivis récemment.',
    'recap.crossCoach.insight.complianceLow':
      'Conformité moyenne plus basse (~{{score}} / 100) sur les jours suivis ; vérifier faim, timings ou objectifs peut aider.',
    'recap.crossCoach.insight.calorieVariance':
      'Écarts caloriques jour à jour parfois marqués : une structure de repas simple réduit les yo-yos sans rigidité excessive.',
    'recap.crossCoach.insight.gtgBeneficialRhythm':
      'Tu pratiques le Grease the Groove ({{days}} j. sur 28, ~{{reps}} reps cumulées) : fréquence nerveuse sans grosse fatigue — un bon complément si tu veux monter en tractions/dips/pompes sans casser la course.',
    'recap.crossCoach.insight.gtgPlanHalfPlus':
      '{{days}} jours où tu as atteint au moins la moitié de ton plan GTG : régularité intelligente, sans obligation de tout cocher chaque fois.',
    'recap.crossCoach.insight.gtgFullDays':
      '{{days}} journées GTG complètes récemment — belle constance. Si ça reste facile plusieurs jours d’affilée, tu peux envisager +1 rep par série.',
    'recap.crossCoach.insight.gtgLightTouch':
      'Quelques touches GTG cette période ({{days}} j.) : c’est déjà utile, et ce n’est pas obligatoire tous les jours — l’idée est la qualité du geste, pas le volume.',
    'recap.crossCoach.insight.gtgRecoveryFriendly':
      'GTG actif cette semaine en parallèle d’une bonne activité cardio : les mini-séries légères encaissent bien si tu ne pousses pas à l’échec.',
    'recap.crossCoach.insight.gtgOptionalExplore':
      'Le Grease the Groove (Défis) peut aider tractions/dips/pompes avec très peu de fatigue — option intéressante si tu veux tester, sans pression.',
    'recap.crossCoach.insight.gtgAdjustVolume':
      'Tu coches parfois le GTG mais rarement la moitié du plan : peut-être trop de créneaux ou d’exercices — vise 4–6 mini-séries faciles plutôt que tout attraper d’un coup.',
    'recap.crossCoach.insight.trainingProgramAnchored':
      'Bonne trajectoire vs ton planning (~{{pct}} % des jours de séance touchés récemment).',
    'recap.crossCoach.insight.keepLogging':
      'Continue d’alimenter le journal (sport ou repas ou poids) : plus les données sont complètes, plus les synthèses deviennent pertinentes.',
    'recap.crossCoach.insight.startAnyPillar':
      'Ajoute une activité ou une pesée ou un repas : dès qu’une colonne avance, le Récap peut te parler avec plus de précision.',

    'recap.crossCoach.insight.firstNutritionJournalDay':
      'Premier jour de repas enregistré avec ton programme nutrition : bravo, une courte série suffit déjà pour voir une tendance.',
    'recap.crossCoach.insight.weekStepsUpModerate':
      'Selon Garmin, tu marches un peu plus qu’en moyenne sur tes semaines précédentes : ça complète bien l’entraînement « salle ».',
    'recap.crossCoach.insight.weekStepsUpStrong':
      'Grosse semaine côté pas Garmin par rapport à ton habitude : utile si tu vises l’activité globale ; pense à la récup si tu cumules avec la muscu.',
    'recap.crossCoach.insight.weekFewerSteps':
      'Un peu moins de pas que d’habitude selon Garmin — souvent lié au rythme de travail, à la météo ou à une semaine plus « canapé » ; ce n’est pas une note.',
    'recap.crossCoach.insight.stepsAndTrainingUp':
      'En parallèle : pas Garmin en hausse et plus de jours actifs dans Momentum ces derniers jours — mouvements complémentaires, pas forcément la même cause.',
    'recap.crossCoach.insight.garminStressSleepLoad':
      'Sur des jours échantillonnés Garmin : stress moyen ~{{stress}} et sommeil ~{{sleep}} h — utile comme « charge globale », à croiser avec ressenti (indicatif).',
    'recap.crossCoach.insight.seriesOverridesMany':
      '{{days}} jour(s) avec adaptations « séries/reps » sur la fenêtre · {{touches}} ligne(s) d’exo touchées : ton prévu reflète bien tes marges.',
    'recap.crossCoach.insight.distinctExercisesRich':
      '~{{n}} mouvements du programme touchés récemment : variété raisonnable si ta récupération suit.',
    'recap.crossCoach.insight.weightTrendMatchesLeanGoal':
      'Ton objectif « sec / tonique » va dans le sens d’une baisse de poids mesurée (~{{delta}} kg sur la fenêtre) — contextualise fatigue et apports avant de changer quoi que ce soit.',
    'recap.crossCoach.insight.weightTrendMassGoal':
      'Ton objectif « musclé / défini » cadre mieux avec une légère hausse (~{{delta}} kg) si entraînement et apports suivent tes repères.',
    'recap.crossCoach.insight.quizCardioPriority':
      'Ton quiz indique un focus cardio : même deux créneaux courts réguliers améliorent la condition sans grignoter sur la récup muscu.',
    'recap.crossCoach.insight.quizUpperLowerFocus':
      'Priorité haut ou bas du corps notée au quiz : alterner blocs ciblés et journées complètes aide souvent à progresser sans surcharge.',
    'recap.crossCoach.insight.weightDown7':
      '~{{delta}} kg sur les 7 derniers j selon tes pesées : signal court à confirmer sur 2–3 semaines avant d’interpéter trop vite.',
    'recap.crossCoach.insight.weightUp7':
      '~{{delta}} kg sur les 7 derniers j : utile comme photo instantanée ; garde au moins un point hebdo régulier pour la tendance.',
    'recap.crossCoach.insight.quietSportRecentDays':
      'Dernière séance suivie il y a ~{{days}} jours alors que tu as déjà une historique dans l’app : un léger créneau planifié suffit pour relancer.',

    'recap.muscleGroup.chest': 'Pectoraux',
    'recap.muscleGroup.back': 'Dos',
    'recap.muscleGroup.shoulders': 'Épaules',
    'recap.muscleGroup.biceps': 'Biceps',
    'recap.muscleGroup.triceps': 'Triceps',
    'recap.muscleGroup.legs': 'Jambes',
    'recap.muscleGroup.quads': 'Quadriceps',
    'recap.muscleGroup.hamstrings': 'Ischio-jambiers',
    'recap.muscleGroup.calves': 'Mollets',
    'recap.muscleGroup.tibialis_anterior': 'Tibial antérieur',
    'recap.muscleGroup.core': 'Gainage / tronc',
    'recap.muscleGroup.full_body': 'Corps entier',

    'anatomy.bank.sectionTitle': 'Vue anatomique',
    'anatomy.bank.noMappedMuscles':
      'Aucune zone du modèle 3D ne correspond aux libellés de cette fiche. Tu peux affiner les noms dans la base ou le mapping fine → groupe.',
    'anatomy.bank.viewHintExercise':
      'Rouge : zones principales · orange : secondaires. La vue par défaut suit le dos / la face selon les muscles listés.',
    'anatomy.bank.viewHintStretch':
      'Bleu foncé : zones principales · bleu : secondaires. La vue par défaut suit le dos / la face selon les zones listées.',
    'anatomy.bank.fallbackBodyHint':
      'Aucun muscle ne correspond encore au maillage 3D : affichage du corps entier. Tu peux affiner les libellés dans la base.',

    'recap.zones.title': 'Détail par zone musculaire',
    'recap.zones.intro':
      'Scores du moteur Récap + reps cochées (même source que le calendrier / saisie). Jambes découpées en quadriceps / ischio / mollets / tibial antérieur ; course et corde répartissent la charge cardio selon le type de séance, l’allure et la durée. Teintes des cartes = volume relatif + charge relative (cohérent avec les couleurs par zone du modèle 3D lorsque le maillage est mappé).',
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
    'recap.zones.detail.tibialis_anterior':
      'Tibial antérieur — dorsiflexion et contrôle à l’attaque du pied ; davantage sollicité en course rapide/fractionnée selon allure et durée.',
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
    'recap.zones.cardioMinutesTitle': 'Sollicitation cardio',
    'recap.zones.cardioMinutesValue': '{{m}} min ({{pct}}%)',
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
    'finance.subTabs.calendrier': 'Calendrier',
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
    'nav.code': 'Code',
    'nav.codeCalendar': 'Calendar',
    'nav.codeJournal': 'Journal & tasks',
    'nav.codeStats': 'Statistics',
    'nav.codeTabs': 'Code tabs',
    'nav.calendar': 'Calendar',
    'nav.stats': 'Statistics',
    'nav.sportAnalytics': 'Analytics & forecasts',
    'nav.program': 'Program',
    'nav.addictionQuit': 'Quit addictions',
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
    'sportAnalyticsHub.title': 'Analytics & forecasts',
    'sportAnalyticsHub.subtitle':
      'Statistics, predictions, smart balancing, and full session history in one place.',
    'sportAnalyticsHub.historyHint': 'Full history of your recorded data.',
    'sportAnalyticsHub.loading': 'Loading…',

    // Addiction quit (Sport)
    'addictionQuit.title': 'Quit addictions',
    'addictionQuit.subtitle':
      'Two trackers (tobacco & THC), 20-year milestones, craving log — data stays on your device.',
    'addictionQuit.sub.timers': 'Timers & benefits',
    'addictionQuit.sub.cravings': 'Craving journal',
    'addictionQuit.benefits20y': 'Benefits over 20 years',
    'addictionQuit.gaugePct': 'Gauge: {{pct}} % along the journey',
    'addictionQuit.nextMilestone': 'Next milestone: {{label}} — {{when}}',
    'addictionQuit.allMilestonesDone': 'All milestones on this timeline are reached.',
    'addictionQuit.progressAria': '20-year journey: {{pct}} percent complete.',
    'addictionQuit.progressAriaTobacco': 'Tobacco-free journey over 20 years: {{pct}} percent complete.',
    'addictionQuit.progressAriaThc': 'Cannabis-free journey over 20 years: {{pct}} percent complete.',
    'addictionQuit.gaugeValueText': '{{pct}} % along the 20-year journey.{{nextPart}}',
    'addictionQuit.gaugeNextPart': ' Next milestone: {{label}}.',
    'addictionQuit.estimateTitle': 'Estimate (optional)',
    'addictionQuit.packsPerDay': 'Packs per day (before quitting)',
    'addictionQuit.packPrice': 'Pack price (€)',
    'addictionQuit.jointsPerWeek': 'Joints per week (before quitting)',
    'addictionQuit.estimateDisclaimer':
      'Indicative estimate, not a medical measure. Real habits vary.',
    'addictionQuit.packsAvoided': '~{{n}} packs not smoked',
    'addictionQuit.jointsAvoided': '~{{n}} joints not consumed',
    'addictionQuit.moneySaved': '~{{n}} € saved (tobacco)',
    'addictionQuit.defineQuit': 'Set your exact quit date and time above to start the live counter.',
    'addictionQuit.clearQuit': 'Clear',
    'addictionQuit.clearQuitConfirm': 'Clear the quit date for this tracker?',
    'addictionQuit.years': 'Years',
    'addictionQuit.days': 'Days',
    'addictionQuit.hours': 'Hours',
    'addictionQuit.minutes': 'Minutes',
    'addictionQuit.seconds': 'Seconds',
    'addictionQuit.trackNameAria': 'Tracker name',
    'addictionQuit.recordCraving': 'Log a craving wave',
    'addictionQuit.recordHelp':
      'Data saved locally. The table widens if one day has more entries than others.',
    'addictionQuit.addCraving': 'Add craving',
    'addictionQuit.quickAdd': '+ Craving now',
    'addictionQuit.historyByDay': 'History by day',
    'addictionQuit.cravingsOnDay': '{{n}} craving(s)',
    'addictionQuit.dayNoCravings': 'No cravings logged this day.',
    'addictionQuit.slotsSummary': '{{slots}} slot(s) per day · {{total}} craving(s) total',
    'addictionQuit.filterAll': 'All',
    'addictionQuit.filterCig': 'Tobacco',
    'addictionQuit.filterThc': 'THC',
    'addictionQuit.summaryTitle': 'Summary',
    'addictionQuit.avg7': 'Avg. intensity (7d): {{v}}',
    'addictionQuit.avg30': 'Avg. intensity (30d): {{v}}',
    'addictionQuit.weekCount': 'Cravings (last 7d): {{n}}',
    'addictionQuit.trend': 'Trend vs previous week: {{t}}',
    'addictionQuit.trendUp': 'up',
    'addictionQuit.trendDown': 'down',
    'addictionQuit.trendFlat': 'flat',
    'addictionQuit.chartTitle': 'Cravings per day (last 30 days)',
    'addictionQuit.exportCsv': 'Export CSV',
    'addictionQuit.copySummary': 'Copy summary',
    'addictionQuit.copied': 'Copied to clipboard',
    'addictionQuit.editTitle': 'Edit craving',
    'addictionQuit.save': 'Save',
    'addictionQuit.cancel': 'Cancel',
    'addictionQuit.day': 'Day',
    'addictionQuit.quitDateTime': 'Quit date and time',
    'addictionQuit.timeOptional': 'Time (optional)',
    'addictionQuit.track': 'Tracker',
    'addictionQuit.intensity': 'Strength (1–10)',
    'addictionQuit.durationMin': 'Duration (minutes, optional)',
    'addictionQuit.notes': 'Notes',
    'addictionQuit.trigger': 'Trigger',
    'addictionQuit.outcome': 'Outcome',
    'addictionQuit.place': 'Place (optional)',
    'addictionQuit.mobileCards': 'Mobile view',
    'addictionQuit.deleteConfirm': 'Delete this entry?',
    'addictionQuit.trigger.none': '—',
    'addictionQuit.trigger.stress': 'Stress',
    'addictionQuit.trigger.boredom': 'Boredom',
    'addictionQuit.trigger.alcohol': 'Alcohol',
    'addictionQuit.trigger.social': 'Social setting',
    'addictionQuit.trigger.sleep': 'Sleep',
    'addictionQuit.trigger.afterMeal': 'After meal',
    'addictionQuit.trigger.work': 'Work',
    'addictionQuit.trigger.other': 'Other',
    'addictionQuit.outcome.none': '—',
    'addictionQuit.outcome.held': 'Held',
    'addictionQuit.outcome.slipped': 'Slipped',
    'addictionQuit.milestoneCurrent': 'Reached this streak',
    'addictionQuit.milestonePastSession': 'Already reached in a session started on {{date}}',
    'addictionQuit.xpModuleTitle': 'Quit-addictions XP',
    'addictionQuit.xpModuleHint':
      'XP counts toward the dashboard total: milestones, abstinent days, and a small bonus for reflective acts (day line, weekly review, craving note quality).',
    'addictionQuit.relapseTitle': 'Relapse',
    'addictionQuit.relapseHelp':
      'Log a relapse: the timer resets, the streak is archived; milestones already hit stay visible with the session start date.',
    'addictionQuit.relapseButton': 'Log a relapse',
    'addictionQuit.relapseHistory': 'Relapse history',
    'addictionQuit.relapseModalTitle': 'Log a relapse',
    'addictionQuit.relapseModalBody':
      'Pick the tracker, date and time. You can set a new quit right after.',
    'addictionQuit.relapseBoth': 'Tobacco + THC',
    'addictionQuit.relapseAt': 'Relapse date & time',
    'addictionQuit.relapseNote': 'Note (optional)',
    'addictionQuit.relapseConfirm': 'Save relapse',
    'addictionQuit.subTabJournal': 'Journal',
    'addictionQuit.subTabRecap': 'Overview',
    'addictionQuit.scopeLabel': 'Summary period',
    'addictionQuit.scopeCurrent': 'Current streak',
    'addictionQuit.scopeMonth': 'This month',
    'addictionQuit.scopeYear': 'This year',
    'addictionQuit.scopeAll': 'All time',
    'addictionQuit.abstinenceChartTitle': '“20-year” progress (tobacco, THC, combined)',
    'addictionQuit.abstinenceChartDesc':
      'Curve = share of the “20-year” milestone reached at end of day for the active session. Days with a logged craving drop to 0% (true value in parentheses on hover).',
    'addictionQuit.abstinenceChartLegendDots':
      'Circle = new health milestone that day; amber diamond = time checkpoint (1st day, 7d, 20d, each month up to 20 years).',
    'addictionQuit.abstinenceTooltipPeriodMilestones': 'Time checkpoints crossed that day',
    'addictionQuit.abstinenceDotHealth': 'Health milestone (that day)',
    'addictionQuit.abstinenceDotPeriod': 'Time checkpoint (that day)',
    'addictionQuit.period.day1': '1st day',
    'addictionQuit.period.day7': 'First 7 days',
    'addictionQuit.period.day20': 'First 20 days',
    'addictionQuit.period.month1': '1st month',
    'addictionQuit.period.monthN': 'Month {{n}}',
    'addictionQuit.period.twentyYears': '20 years — full gauge horizon',
    'addictionQuit.periodMilestonesTitle': 'Calendar checkpoints (day / month)',
    'addictionQuit.periodMilestonesHint': 'expand',
    'addictionQuit.nextPeriodMilestone': 'Next time checkpoint: {{label}} — {{when}}',
    'addictionQuit.abstinenceLegendCig': 'Tobacco',
    'addictionQuit.abstinenceLegendThc': 'THC',
    'addictionQuit.abstinenceLegendMix': 'Combined (average)',
    'addictionQuit.abstinenceTooltipMilestones': 'Milestones crossed that day',
    'addictionQuit.abstinenceTooltipNotes': 'Craving notes',
    'addictionQuit.abstinenceEmpty': 'No quit session in this range yet; the chart appears once tracking starts.',
    'addictionQuit.avgScope': 'Avg. intensity (period): {{v}}',
    'addictionQuit.countScope': 'Cravings (period): {{n}}',
    'addictionQuit.heldScope': 'Held (period): {{n}}',
    'addictionQuit.slippedScope': 'Slipped logged (period): {{n}}',
    'addictionQuit.recapXp': 'XP (this module)',
    'addictionQuit.recapXpDetail': 'Milestones: {{m}} XP · Days: {{d}} XP · Reflective: {{r}} XP',
    'addictionQuit.recapPrint': 'Print / PDF',
    'addictionQuit.recapPrintHint':
      'In the browser print dialog, choose “Save as PDF” for a one-page handout for a clinician.',
    'addictionQuit.recapNarrativeTitle': 'Action-oriented read (last 30 days vs previous 30)',
    'addictionQuit.recapNarrativeFoot':
      'Compared to your own logs only — not a norm or a medical diagnosis.',
    'addictionQuit.recapNarrativeNeedData':
      'Not enough comparable entries yet: keep logging outcome and context for richer sentences.',
    'addictionQuit.recapNarrativeMoreHeld':
      'In the last 30 days you logged “held” more often than before, when you record an outcome.',
    'addictionQuit.recapNarrativeLessHeld':
      'The share of “held” outcomes is a bit lower than the previous month — data only, no blame.',
    'addictionQuit.recapNarrativeMoreWeekend':
      'Logged cravings fall slightly more often on weekends than the month before (still just your data).',
    'addictionQuit.recapNarrativeLessWeekend':
      'The weekend share of logged cravings dropped a bit versus the previous month.',
    'addictionQuit.recapNarrativeStable':
      'Recent trends are close to the previous month — keep leaning on what already helps.',
    'addictionQuit.recapGapTitle': 'Gaps between logged relapses',
    'addictionQuit.recapGapAvg': 'Average days between two relapses: {{n}} (pace signal, not “perfection”).',
    'addictionQuit.recapGapEmpty': 'Not enough logged relapses to estimate an average gap.',
    'addictionQuit.recapThcCorrelation':
      'In your data, days with several THC cravings often line up with trigger “{{trigger}}” — correlation only.',
    'addictionQuit.recapCorrelationDisclaimer':
      'Pattern in your journal, not a universal rule or medical advice.',
    'addictionQuit.recapPrivacyWeekend':
      'Show weekend hint (opt-in): share of cravings logged on Sat/Sun (last 42 days).',
    'addictionQuit.recapWeekendShare': 'Weekend share of logged cravings: {{pct}}%.',
    'addictionQuit.copilotTodayTitle': 'Today — copilot',
    'addictionQuit.copilotDisclaimer':
      'Patterns from your history as hypotheses — never a diagnosis or medical truth.',
    'addictionQuit.copilotRiskTitle': 'What might weigh on you lately',
    'addictionQuit.copilotRiskEmpty': 'Not enough repeated patterns for a hypothesis yet.',
    'addictionQuit.copilotHypothesis': 'Often:',
    'addictionQuit.copilotWithPlace': 'place noted',
    'addictionQuit.copilotSeenTimes': 'seen {{n}} times',
    'addictionQuit.copilotHeldTitle': 'When you hold, what does it look like?',
    'addictionQuit.copilotHeldEmpty': 'Log a few “held” entries with trigger and time to surface levers.',
    'addictionQuit.copilotHeldCount': '{{n}} held',
    'addictionQuit.copilotCalmTitle': 'If you feel it building',
    'addictionQuit.copilotAct.water': 'Glass of water',
    'addictionQuit.copilotAct.air': 'Fresh air — window or outside for 2 minutes',
    'addictionQuit.copilotAct.message': 'Short message to someone you trust',
    'addictionQuit.copilotAct.room': 'Change room or posture',
    'addictionQuit.copilotAct.walk': 'A few steps or discreet stretches',
    'addictionQuit.copilotCustomPlaceholder': 'One micro-action per line (free text)',
    'addictionQuit.copilotEditActions': 'Customize the list',
    'addictionQuit.copilotTriggerUnknown': 'Trigger not specified',
    'addictionQuit.bucket.morning': 'morning',
    'addictionQuit.bucket.midday': 'midday',
    'addictionQuit.bucket.afternoon': 'afternoon',
    'addictionQuit.bucket.evening': 'evening',
    'addictionQuit.bucket.night': 'night',
    'addictionQuit.bucket.unknown': 'time not set',
    'addictionQuit.reflectionDayTitle': 'End-of-day line (1–2 lines)',
    'addictionQuit.reflectionDayPlaceholder': 'e.g. Rough day but I held in the evening.',
    'addictionQuit.reflectionDayXpHint': 'A short line counts toward a little “reflective” XP (with the rest of the module).',
    'addictionQuit.weeklyReviewTitle': 'Weekly check-in (~2 min)',
    'addictionQuit.weeklyReviewHint': 'Check when you’ve reviewed the week — small XP bump.',
    'addictionQuit.weeklyReviewDone': 'Week marked',
    'addictionQuit.weeklyReviewButton': 'I did my mini review',
    'addictionQuit.trackFocusTitle': 'Optional focus for this tracker',
    'addictionQuit.focusRoutine': 'Routine & cues (tobacco)',
    'addictionQuit.focusSleep': 'Sleep (THC)',
    'addictionQuit.focusMood': 'Next-day mood (THC)',
    'addictionQuit.trackFocusHelp':
      'Indicative checkboxes only: tick what matters to you without extra required fields in the journal.',
    'addictionQuit.sessionTitleLabel': 'Current session title (optional)',
    'addictionQuit.sessionTitlePlaceholder': 'e.g. Second try after work stress',
    'addictionQuit.relapseSessionTitle': 'Session title (optional)',
    'addictionQuit.relapseSessionTitlePlaceholder': 'Name this chapter of your story',
    'addictionQuit.relapseReflection': 'What I take away (one line)',
    'addictionQuit.relapseReflectionPlaceholder': 'One line for next time or to share with a clinician',
    'addictionQuit.relapseSessionLine': 'Session: “{{title}}”',
    'addictionQuit.relapseReflectionLine': 'Takeaway: {{text}}',
    'addictionQuit.recapRelapses': 'Relapses logged',
    'addictionQuit.recapRelapsesBy': 'Tobacco: {{c}} · THC: {{th}}',
    'addictionQuit.recapLongestCig': 'Longest tobacco quit',
    'addictionQuit.recapLongestThc': 'Longest THC quit',
    'addictionQuit.recapAbstinentDaysCig': 'Calendar days tracked (tobacco sessions)',
    'addictionQuit.recapAbstinentDaysThc': 'Calendar days tracked (THC sessions)',
    'addictionQuit.recapCravingsTotal': 'Cravings logged (all time)',
    'addictionQuit.recapHeldSlipped': 'Held / slipped (outcome)',
    'addictionQuit.recapSessions': 'Quit sessions',
    'addictionQuit.recapSessionsBy': 'Tobacco: {{c}} · THC: {{th}}',
    'addictionQuit.sessionTimelineTitle': 'Timeline by session',
    'addictionQuit.sessionTimelineHelp':
      'Separators group cravings across relapses (newest to oldest).',
    'addictionQuit.sessionDivider': 'Session {{start}} → {{end}}',
    'addictionQuit.sessionOngoing': 'ongoing',

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
    'recap.enrichment.completionGlobal': 'Program (daily avg)',
    'recap.enrichment.completionExos': 'Exercises (daily avg)',
    'recap.enrichment.completionStretch': 'Stretches (daily avg)',
    'recap.enrichment.streakBest': 'Best: {{n}} d',
    'recap.enrichment.sleepAvg': 'Sleep {{h}} h',
    'recap.enrichment.completionDaysLine':
      '{{full}} d at 100% · {{active}} training d / {{planned}} planned · day adherence {{legacy}}%',
    'recap.enrichment.leastChecked': 'Least checked exercises',
    'recap.snapshot.repsPeriod': 'Reps (period)',
    'recap.breadcrumbSport': 'Sport',
    'recap.nav.snapshot': 'Snapshot',
    'recap.nav.analyse': 'Analysis',
    'recap.nav.corps': 'Body',
    'recap.nav.tendances': 'Trends',
    'recap.nav.sessions': 'Sessions',
    'recap.nav.mobile': 'Recap navigation',
    'recap.tendances.records': 'Running records',
    'recap.tendances.noRecords': 'No running records logged.',
    'recap.snapshot.regularity': 'Consistency',
    'recap.snapshot.running': 'Running',
    'recap.snapshot.volume': 'Volume kg×reps',
    'recap.snapshot.status': 'Status',
    'recap.snapshot.editQuiz': 'Update',
    'recap.snapshot.topZones': 'Most stressed areas',
    'recap.snapshot.quizIncompleteHint':
      'Complete the questionnaire to refine programs and advice.',
    'recap.sessions.journalTitle': 'Session journal',
    'recap.sessions.journalSubtitle': 'Chronological history for the selected period.',
    'recap.bodyView.frontLow': 'Front ¾ · low angle (torso)',
    'recap.bodyView.front': 'Front',
    'recap.bodyView.frontHighWide': 'Front · pulled back',
    'recap.bodyView.frontWideHang': 'Front · hollow line',
    'recap.bodyView.backLower': 'Back · calves & hamstrings',
    'recap.bodyView.side': 'Side',
    'recap.bodyView.top': 'Top',
    'recap.bodyView.back': 'Back',
    'recap.bodyHint':
      'View: buttons above · drag to rotate · scroll or pinch to zoom · auto rotation',
    'recap.legendIntro':
      'Period-relative scale: colors are distributed from your real gaps (not fixed thresholds). Displayed load = strength (weighted reps, decay) + blended cardio.',
    'recap.legendSpectrumTitle': 'Load continuum (fine steps)',
    'recap.legendSpectrumCaption':
      'This gradient matches the 3D body: many in-between hues so nearby scores do not look identical.',
    'recap.legendSpectrumEnds': 'Left: low — right: high (always relative to your period). Beyond: relative overload (purple / dark).',
    'recap.legendSpectrumAria': 'Gradient of period-relative muscle load',
    'recap.legend.level.midTransition': '↔ In-between tint vs next tier',
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
    'recap.assessment.title': 'Profile, level & habits',
    'recap.assessment.subtitle':
      'One place for training, body, nutrition (when logged), and your indicative score; charts span 84d. Remarks are heuristic hints from your data — not medical advice.',
    'recap.assessment.badge': 'Profile',
    'recap.assessment.maturity': 'Rich history (~{{pct}}% of data “ceiling”)',
    'recap.assessment.userFallback': 'User',
    'recap.assessment.identity': 'Identity',
    'recap.assessment.latestWeight': 'Latest weight',
    'recap.assessment.bodyFat': 'Body fat',
    'recap.assessment.quizEstimate': 'quiz est.',
    'recap.assessment.lifetimeReps': 'Lifetime reps (app)',
    'recap.assessment.scoreHint':
      'Main driver: recent consistency; diminishing returns after very large cumulative volume.',
    'recap.assessment.chartWeight': 'Weight trend (impedance / measurements)',
    'recap.assessment.chartWeightAxis': 'Weight',
    'recap.assessment.chartEmptyWeight':
      'No weigh-ins in this window — add a measurement (Body tracking).',
    'recap.assessment.chartWeightFoot':
      'Between weigh-ins the line carries the last known value.',
    'recap.assessment.chartReps': 'Strength reps per day',
    'recap.assessment.chartRepsAxis': 'Reps / day',
    'recap.assessment.chartEmptyReps': 'No reps logged yet.',
    'recap.assessment.chartRepsFoot':
      'Checked reps (+ endurance pushups) per calendar day · last {{d}} days.',
    'recap.assessment.horizonShort': 'Short term · weeks',
    'recap.assessment.horizonMedium': 'Medium term · training blocks',
    'recap.assessment.horizonLong': 'Long term · months & years',
    'recap.assessment.journey': 'Tracking start',
    'recap.assessment.tenure': '{{days}} days since first logged activity (or frozen start date).',
    'recap.assessment.window': 'Recent window',
    'recap.assessment.activeDays':
      '{{n}} active days · indicative target ~{{exp}} sessions (quiz & recent window)',
    'recap.assessment.regularity': 'Consistency vs target: {{pct}}%',
    'recap.assessment.program': 'Program',
    'recap.assessment.sessionAlignTitle': 'Planned vs logged (sessions & today’s sets/reps)',
    'recap.assessment.sessionAlignLineAvg':
      'Avg planned vs completed load: {{score}}% · {{scored}} day(s) scored out of {{plan}} planned session day(s) (today’s sets/reps included).',
    'recap.assessment.sessionAlignPartial':
      'At least {{plan}} planned session day(s) in the window: not enough logged data for a reliable average (weights / reps).',
    'recap.assessment.sessionOverrides': '{{d}} day(s) with set/rep tweaks · {{t}} exercise(s).',
    'recap.assessment.sessionOverridesNone': 'No “today’s sets/reps” tweaks in this window.',
    'recap.assessment.loadBlock': 'Load (kg × reps)',
    'recap.assessment.weightedDays': '{{n}} days with at least one logged weight',
    'recap.assessment.volumeSum': 'Total volume on those days: {{v}} (kg×reps)',
    'recap.assessment.avgVolume': 'Average on “with weight” days: {{v}}',
    'recap.assessment.loadOnlyWeightedDays':
      'Days without logged load are excluded from these volume averages.',
    'recap.assessment.repsBlock': 'Reps & difficulty',
    'recap.assessment.totalReps': '{{n}} strength reps (checked) in window',
    'recap.assessment.avgRepsPerDay': 'Average on days with reps: {{n}}',
    'recap.assessment.avgDifficulty': 'Mean difficulty (catalog): {{d}} / 5',
    'recap.assessment.noDifficulty': 'Few exercises with a difficulty tag in the database.',
    'recap.assessment.quizHeading': 'Profile quiz ({{done}} / {{total}})',
    'recap.assessment.suggestions': 'Suggestions',
    'recap.assessment.predictions': 'Outlook',

    'recap.crossCoach.badge': 'Coach',
    'recap.crossCoach.title': 'Body · training · nutrition snapshot',
    'recap.crossCoach.subtitle':
      'Cross-pillar recap and prioritized nudges from your local logs (not medical advice).',
    'recap.crossCoach.loadingChip': 'Nutrition loading…',
    'recap.crossCoach.loadingGarminChip': 'Garmin loading…',
    'recap.crossCoach.pillar.training': 'Training',
    'recap.crossCoach.pillar.body': 'Body',
    'recap.crossCoach.pillar.nutrition': 'Nutrition',
    'recap.crossCoach.pillar.trainingLine':
      '{{days}} active days · {{reps}} reps this window · total load (kg×reps): {{vol}}',
    'recap.crossCoach.pillar.distinctExercisesLine':
      'Distinct program exercises checked in the recent window: ~{{n}}',
    'recap.crossCoach.pillar.bodyLine.weight': 'Latest weigh-in this window: {{w}} kg',
    'recap.crossCoach.pillar.bodyLine.none': 'No weigh-in logged in this window.',
    'recap.crossCoach.pillar.nutritionLine.loading': 'Loading nutrition journal…',
    'recap.crossCoach.pillar.nutritionLine.days': '{{n}} day(s) with at least one meal logged in this window',
    'recap.crossCoach.pillar.nutritionLine.empty': 'No meals logged in this window.',
    'recap.crossCoach.gapsTitle': 'To sharpen the recap',
    'recap.crossCoach.gap.quiz': 'Finish the profile quiz to align consistency targets and tips.',
    'recap.crossCoach.gap.nutrition_empty': 'Nutrition plan active but no meals logged across 28d.',
    'recap.crossCoach.gap.body_weight': 'Add a weigh-in (body tracking) to anchor weight trends.',
    'recap.crossCoach.disclaimer':
      'Computed locally from your logs; diet or health advice still belongs with a trusted professional.',
    'recap.crossCoach.remarksHeading': 'Notes',
    'recap.crossCoach.insight.quizIncomplete':
      'Profile quiz still incomplete ({{done}} / {{total}}): when you have five minutes it tunes targets and wording.',
    'recap.crossCoach.insight.logMealsWhenProgram':
      'Nutrition plan active — a handful of logged days quickly shows gaps vs targets.',
    'recap.crossCoach.insight.logMealsWhenProgramWithTraining':
      'Strong training streak but no meals logged: even 2–3 logged days clarify whether intake matches workload.',
    'recap.crossCoach.insight.tryMealsForTrainingContext':
      'No nutrition plan? Occasional meal notes still pair nicely with workouts for context.',
    'recap.crossCoach.insight.weekMoreActive':
      'Strong week — {{current}} active days, a notch above your usual trailing-week average (~{{priorAvg}}).',
    'recap.crossCoach.insight.weekLessActive':
      'Quieter week — {{current}} active days vs your recent trailing average (~{{priorAvg}}). Could be deliberate recovery or life load; skip the guilt loop.',
    'recap.crossCoach.insight.weekLiftVolumeModerate':
      'Loaded volume is a touch higher than usual over the past 7 days — keep fatigue and sleep in view.',
    'recap.crossCoach.insight.weekLiftVolumeStrong':
      'Loaded volume is clearly above prior weeks — if it keeps stacking, budget easy days or mobility.',
    'recap.crossCoach.insight.weekLiftVolumeVeryStrong':
      'Major loaded-volume spike versus prior weeks — prioritize recovery staples (sleep, food, hydration) before piling more on.',
    'recap.crossCoach.insight.repsWeekStrongerVsRecentWeeks':
      'This week lifts more logged strength reps than the earlier blocks inside the window — good if soreness stays manageable.',
    'recap.crossCoach.insight.repsWeekQuieterVsRecentWeeks':
      'Fewer reps this week versus prior windows — might be tapering or schedule noise; sanity-check versus how you felt.',
    'recap.crossCoach.insight.sportUpNutritionAligned':
      'At the same time: higher activity alongside calories drifting near targets (~{{meanPct}} % of target on avg).',
    'recap.crossCoach.insight.planCheckStreak':
      'Plan check streak: {{days}} day(s) ending today — nice alignment with the planned foods.',
    'recap.crossCoach.insight.planChecksBuilding':
      '{{leaves}} plan checks across {{days}} day(s) — useful without journaling every gram.',
    'recap.crossCoach.insight.regularityLow':
      'Consistency is under the quiz’s indicative pacing ({{pct}} %) — repeatable weekly slots outperform sporadic grind.',
    'recap.crossCoach.insight.sessionLoadGap':
      'Where planned vs logged load is comparable you’re drifting from the blueprint (think ~{{score}} % on average lately) — accurate sets/reps make this read trustworthy.',
    'recap.crossCoach.insight.sessionLoadGood':
      'Solid planned-vs-logged load (~{{score}} %) lately — adaptations are reflecting what you train.',
    'recap.crossCoach.insight.weightDown28':
      'Weight trending down ~{{delta}} kg on recent weigh-ins — cross-check intake and workload without overstating causality.',
    'recap.crossCoach.insight.weightUp28':
      'Weight up ~{{delta}} kg on recent weigh-ins — normal in surplus; contextualize vs your stated goal.',
    'recap.crossCoach.insight.addWeighIn':
      'No weigh-in on this window: one weekly-ish point often reveals the trend.',
    'recap.crossCoach.insight.firstMealsLogged':
      '{{days}} day(s) logged in 28d — momentum builds faster with short streaks than with rare “perfect”.',
    'recap.crossCoach.insight.nutritionProgramBuilding':
      'Nutrition program + journaling that grows: favor micro-adjustments you can repeat.',
    'recap.crossCoach.insight.complianceStrong':
      'Average compliance trending solid (~{{score}} / 100) on tracked days lately.',
    'recap.crossCoach.insight.complianceLow':
      'Average compliance softer (~{{score}} / 100) on tracked days — timing/portions/program fit may merit a tweak.',
    'recap.crossCoach.insight.calorieVariance':
      'Daily calorie swings are noticeable lately — repeatable meal templates tame yo-yos without rigidity.',
    'recap.crossCoach.insight.gtgBeneficialRhythm':
      'Grease the Groove showing up ({{days}} days in 28, ~{{reps}} reps total): neural practice without heavy fatigue — a solid add-on for pull-ups/dips/push-ups alongside running.',
    'recap.crossCoach.insight.gtgPlanHalfPlus':
      '{{days}} days at least halfway through your GTG plan: smart frequency without needing a perfect score every day.',
    'recap.crossCoach.insight.gtgFullDays':
      '{{days}} full GTG days lately — nice consistency. If sets feel trivial for several days, consider +1 rep per set.',
    'recap.crossCoach.insight.gtgLightTouch':
      'A light GTG touch this period ({{days}} days): already useful, and not mandatory daily — quality beats volume.',
    'recap.crossCoach.insight.gtgRecoveryFriendly':
      'Active GTG this week alongside solid cardio: easy mini-sets tend to sit well if you avoid failure.',
    'recap.crossCoach.insight.gtgOptionalExplore':
      'Grease the Groove (Challenges tab) can nudge pull-ups/dips/push-ups with minimal fatigue — worth a look if curious, zero pressure.',
    'recap.crossCoach.insight.gtgAdjustVolume':
      'GTG check-ins are sporadic and rarely past half the daily plan — maybe too many slots or exercises; aim for 4–6 easy mini-sets instead of catching up in one go.',
    'recap.crossCoach.insight.trainingProgramAnchored':
      'You are hitting planned training days (~{{pct}} %) more often lately — anchors progression.',
    'recap.crossCoach.insight.keepLogging':
      'Keep topping up lifts, weigh-ins or meals; richer logs make recap insights sharper.',
    'recap.crossCoach.insight.startAnyPillar':
      'Log a session, weigh-in or meal — once any pillar fills in, recap messages get more specific.',

    'recap.crossCoach.insight.firstNutritionJournalDay':
      'First logged meal day alongside your nutrition program — nice milestone; momentum beats perfection.',
    'recap.crossCoach.insight.weekStepsUpModerate':
      'Garmin steps are mildly above recent weekly norms — complements gym work nicely.',
    'recap.crossCoach.insight.weekStepsUpStrong':
      'Walking volume is noticeably up versus prior Garmin weeks — awesome if intentional; mindful if stacking with heavy lifting.',
    'recap.crossCoach.insight.weekFewerSteps':
      'Fewer Garmin steps lately — often commute, weather, or recovery weeks; metrics aren’t a verdict.',
    'recap.crossCoach.insight.stepsAndTrainingUp':
      'At the same time: higher Garmin steps and more active days in Momentum lately — complementary movement, not necessarily one cause.',
    'recap.crossCoach.insight.garminStressSleepLoad':
      'On sampled Garmin days: average stress ~{{stress}} and sleep ~{{sleep}} h — a broad “load” hint; cross-check with how you feel (indicative).',
    'recap.crossCoach.insight.seriesOverridesMany':
      '{{days}} day(s) with “today’s sets/reps” tweaks in-window · {{touches}} exercise line(s) touched: your planned load tracks your adjustments.',
    'recap.crossCoach.insight.distinctExercisesRich':
      '~{{n}} program exercises touched recently: healthy variety if recovery keeps up.',
    'recap.crossCoach.insight.weightTrendMatchesLeanGoal':
      'Your “lean / toned” goal aligns with a measured weight drift down (~{{delta}} kg this window) — still balance energy intake and fatigue before big changes.',
    'recap.crossCoach.insight.weightTrendMassGoal':
      'A “more muscular” goal meshes better with a modest rise (~{{delta}} kg) if training and intake match intent.',
    'recap.crossCoach.insight.quizCardioPriority':
      'Your quiz flags cardio as a priority: two short, repeatable sessions often lift conditioning without eating into lifting recovery.',
    'recap.crossCoach.insight.quizUpperLowerFocus':
      'Upper- or lower-body emphasis from the quiz: alternating focused blocks with full-body days often keeps volume productive.',
    'recap.crossCoach.insight.weightDown7':
      '~{{delta}} kg over the past 7 days on weigh-ins: a short signal—confirm across 2–3 weeks.',
    'recap.crossCoach.insight.weightUp7':
      '~{{delta}} kg over the past 7 days: a snapshot worth tracking with at least a weekly rhythm.',
    'recap.crossCoach.insight.quietSportRecentDays':
      'About {{days}} days since the last tracked session despite prior history — a tiny scheduled slot is often enough to restart.',

    'recap.muscleGroup.chest': 'Chest',
    'recap.muscleGroup.back': 'Back',
    'recap.muscleGroup.shoulders': 'Shoulders',
    'recap.muscleGroup.biceps': 'Biceps',
    'recap.muscleGroup.triceps': 'Triceps',
    'recap.muscleGroup.legs': 'Legs',
    'recap.muscleGroup.quads': 'Quadriceps',
    'recap.muscleGroup.hamstrings': 'Hamstrings',
    'recap.muscleGroup.calves': 'Calves',
    'recap.muscleGroup.tibialis_anterior': 'Tibialis anterior',
    'recap.muscleGroup.core': 'Core',
    'recap.muscleGroup.full_body': 'Full body',

    'anatomy.bank.sectionTitle': 'Anatomy view',
    'anatomy.bank.noMappedMuscles':
      'No 3D region matches this entry’s muscle labels yet. Refine labels in the database or the fine → group mapping.',
    'anatomy.bank.viewHintExercise':
      'Red: primary zones · orange: secondary. Default camera follows back vs front based on listed muscles.',
    'anatomy.bank.viewHintStretch':
      'Dark blue: primary zones · blue: secondary. Default camera follows back vs front based on listed areas.',
    'anatomy.bank.fallbackBodyHint':
      'No muscle maps to the 3D mesh yet: showing full body in a neutral tint. You can refine labels in the database.',

    'recap.zones.title': 'Per muscle zone',
    'recap.zones.intro':
      'Recap scores + checked reps (same source as calendar / data entry). Legs split into quads / hamstrings / calves / tibialis anterior; running and jump rope spread cardio load by session type, pace and duration. Card colors blend relative volume + relative load (aligned with per-zone 3D colors when meshes are mapped).',
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
    'recap.zones.detail.tibialis_anterior':
      'Tibialis anterior — dorsiflexion and foot-strike control; tends to rise with faster/interval running depending on pace and duration.',
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
    'recap.zones.cardioMinutesTitle': 'Cardio activation',
    'recap.zones.cardioMinutesValue': '{{m}} min ({{pct}}%)',
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
    'finance.subTabs.calendrier': 'Calendar',
    
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
      let result = tPluralFromNamespaces(key, count, lang, getTranslation, fallback);

      const otherParams = { ...params };
      delete otherParams.count;
      if (Object.keys(otherParams).length > 0) {
        result = interpolateTranslation(result, otherParams, lang);
      }

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

