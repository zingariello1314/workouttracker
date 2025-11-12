/**
 * 🔴 FIX #51-60: Constantes centralisées pour l'onglet Garmin
 * Évite les "magic numbers" dispersés dans le code
 */

// ==================== TEMPS & DÉLAIS ====================
export const SYNC_TIMEOUT_MS = 90000; // 90 secondes pour couvrir les forçages lourds
export const DEBOUNCE_DELAY_MS = 100; // 100ms pour navigation temporelle
export const CACHE_TTL_MS = 60000; // 60 secondes pour cache frontend
export const RETRY_BASE_DELAY_MS = 1000; // 1 seconde de base pour retry
export const RETRY_MAX_ATTEMPTS = 3; // 3 tentatives max
export const FORCE_SYNC_DEGRADE_THRESHOLD_MS = 30000; // 30 secondes avant passage en mode dégradé pour un forçage

export const CIRCUIT_BREAKER = {
  MAX_FAILURES: 3,
  COOLDOWN_MS: 30000
};

export const CACHE_SCHEMA_VERSION = 'v1';
export const TELEMETRY_SCHEMA_VERSION = 'v1';

export const TELEMETRY_DEFAULTS = {
  THROTTLE_MS: 250,
  HISTORY_LIMIT: 50,
  RENDER_HISTORY_LIMIT: 50,
  SNAPSHOT_HISTORY_LIMIT: 10,
  AUTO_PUSH_INTERVAL_MS: 60000
};

// ==================== RANGES DE DONNÉES ====================
export const DATE_RANGE = {
  ACTIVITIES_DAYS: 7, // ±7 jours autour de la date sélectionnée pour activités
  METRICS_DAYS: 90, // 90 derniers jours pour métriques
  MAX_HISTORY_DAYS: 365 // Maximum d'historique à charger
};

// ==================== VALIDATION RANGES ====================
export const HEART_RATE = {
  MIN: 30,
  MAX: 220,
  RESTING_MIN: 40,
  RESTING_MAX: 120,
  MAX_MIN: 100,
  MAX_MAX: 220,
  AVG_MIN: 50,
  AVG_MAX: 200
};

export const CALORIES = {
  MIN: 0,
  MAX: 20000 // 20k kcal/jour maximum raisonnable
};

export const DISTANCE = {
  MIN: 0,
  MAX: 100, // 100km/jour maximum suspect
  STEPS_TO_KM_RATIO: 0.75 / 1000 // 0.75m par pas = 0.00075 km/pas
};

export const DURATION = {
  MIN: 0,
  MAX: 86400 // 24 heures en secondes
};

// ==================== TIME SERIES ====================
export const TIME_SERIES = {
  TARGET_POINTS: 288, // Points cibles pour downsampling (5min * 288 = 24h)
  MIN_POINTS_FOR_WARNING: 100, // Avertir si moins de 100 points
  COMPRESSION_RATIO_TARGET: 2.0 // Ratio de compression cible
};

// ==================== PAGINATION ====================
export const PAGINATION = {
  ACTIVITIES_PER_PAGE: 10,
  INITIAL_PAGE: 1
};

// ==================== ACTIVITÉS ====================
export const ACTIVITY = {
  SWIMMING: {
    DISTANCE_MIN_M: 50,
    DISTANCE_MAX_M: 5000,
    RE_CLASSIFY_DISTANCE_MIN_M: 100,
    RE_CLASSIFY_DISTANCE_MAX_M: 4000,
    MIN_DURATION_S: 300 // 5 minutes minimum
  },
  JUMP_ROPE: {
    MIN_JUMPS: 1,
    MAX_JUMPS: 50000
  }
};

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  SYNC: '/api/garmin/sync',
  STATUS: '/api/garmin/status',
  METRICS: '/api/garmin/metrics'
};

// ==================== MESSAGES ====================
export const MESSAGES = {
  SYNC_SUCCESS: 'Synchronisation réussie',
  SYNC_ERROR: 'Erreur de synchronisation',
  LOADING: 'Chargement...',
  NO_DATA: 'Aucune donnée disponible',
  MISSING_METRIC: 'Donnée non disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin.'
};

// ==================== ARIA LABELS ====================
export const ARIA_LABELS = {
  SYNC_BUTTON: 'Synchroniser les données Garmin',
  BACKFILL_BUTTON: 'Récupérer les données historiques',
  DATE_SELECTOR: 'Sélectionner une date',
  TAB_DASHBOARD: 'Onglet tableau de bord',
  TAB_ACTIVITIES: 'Onglet activités',
  TAB_METRICS: 'Onglet métriques quotidiennes',
  TAB_CHARTS: 'Onglet graphiques',
  HEART_RATE_CHART: 'Graphique de la fréquence cardiaque',
  BODY_BATTERY_CHART: 'Graphique du niveau de batterie corporelle',
  STRESS_CHART: 'Graphique du niveau de stress',
  SLEEP_CHART: 'Graphique du sommeil',
  RESPIRATION_CHART: 'Graphique de la respiration',
  ACTIVITY_HEATMAP: 'Carte de chaleur des activités'
};

// ==================== KEYBOARD SHORTCUTS ====================
export const KEYBOARD = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown'
};

