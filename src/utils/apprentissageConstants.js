/**
 * Constantes pour l'onglet Apprentissage
 * Centralise tous les magic numbers et configurations
 */

// Durées par défaut (en secondes)
export const TIMER_DEFAULTS = {
  DEFAULT_SESSION_DURATION: 25 * 60, // 25 minutes
  DEFAULT_BREAK_DURATION: 5 * 60, // 5 minutes
  WARNING_TIME: 5 * 60, // Avertissement 5 dernières minutes
  MIN_SESSION_DURATION: 1 * 60, // 1 minute minimum
  MAX_SESSION_DURATION: 480 * 60, // 480 minutes maximum (8h)
};

// Seuils de durée de session (en secondes)
export const SESSION_DURATION_THRESHOLDS = {
  SHORT_SESSION: 15 * 60, // < 15 minutes = session courte
  LONG_SESSION: 45 * 60, // >= 45 minutes = session longue
  VERY_LONG_SESSION: 90 * 60, // >= 90 minutes = session très longue
};

// Horaires pour bonus XP
export const TIME_BONUSES = {
  EARLY_MORNING_START: 5, // 5h
  EARLY_MORNING_END: 8, // 8h
  LATE_EVENING_START: 20, // 20h
  LATE_EVENING_END: 23, // 23h
};

// Configuration XP
export const XP_CONFIG = {
  session_completed: 30,
  session_perfect: 45,
  base_xp_per_minute: 1.2,
  long_session_bonus: 1.4, // 45min+
  very_long_session_bonus: 1.8, // 90min+
  short_session_penalty: 0.8, // <15min
  early_morning_bonus: 1.2, // 5h-8h
  late_evening_bonus: 1.1, // 20h-23h
  weekend_bonus: 1.15,
  level_formula: (level) => Math.floor(Math.pow(level, 1.8) * 150),
  streak_multipliers: {
    3: 1.1,
    7: 1.2,
    14: 1.3,
    30: 1.5,
  },
  min_xp: 8, // XP minimum par session
};

// Badges par niveau
export const SUBJECT_BADGES = {
  1: { icon: '🔰', name: 'Novice', color: '#6b7280' },
  3: { icon: '📖', name: 'Apprenti', color: '#3b82f6' },
  5: { icon: '🎒', name: 'Étudiant', color: '#10b981' },
  8: { icon: '📜', name: 'Érudit', color: '#8b5cf6' },
  12: { icon: '🎓', name: 'Expert', color: '#f59e0b' },
  20: { icon: '👑', name: 'Maître', color: '#ef4444' },
  30: { icon: '⚡', name: 'Légende', color: '#ffd700' },
  50: { icon: '🌟', name: 'Immortel', color: '#ff1493' },
};

// Badges contextuels
export const CONTEXTUAL_BADGES = [
  { id: 'early_study', icon: '🐦', name: 'Lève-tôt', description: '10 sessions avant 7h', condition: 'early_study', threshold: 10 },
  { id: 'late_study', icon: '🦉', name: 'Hibou de Nuit', description: '10 sessions après 22h', condition: 'late_study', threshold: 10 },
  { id: 'weekend_study', icon: '⚔️', name: 'Guerrier du Weekend', description: '8 weekends d\'étude', condition: 'weekend_study', threshold: 8 },
  { id: 'daily_consistency', icon: '👑', name: 'Roi de la Régularité', description: '30 jours consécutifs', condition: 'daily_consistency', threshold: 30 },
  { id: 'quick_sessions', icon: '💨', name: 'Démon de Vitesse', description: '20 sessions rapides', condition: 'quick_sessions', threshold: 20 },
  { id: 'long_sessions', icon: '🏃‍♂️', name: 'Marathonien Mental', description: '5 sessions longues', condition: 'long_sessions', threshold: 5 },
  { id: 'perfect_sessions', icon: '💎', name: 'Perfectionniste', description: '25 sessions parfaites', condition: 'perfect_sessions', threshold: 25 },
  { id: 'subject_variety', icon: '🧠', name: 'Polymathe', description: '5 matières différentes', condition: 'subject_variety', threshold: 5 },
];

// Trophées
export const TROPHIES_CONFIG = [
  { id: 'first_step', icon: '🌟', name: 'Premier Pas', description: 'Première session', type: 'progression', requirement: { type: 'sessions', value: 1 }, xp: 50 },
  { id: 'bronze_regularity', icon: '🥉', name: 'Régularité Bronze', description: '3 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 3 }, xp: 100 },
  { id: 'silver_regularity', icon: '🥈', name: 'Régularité Argent', description: '7 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 7 }, xp: 200 },
  { id: 'gold_regularity', icon: '🥇', name: 'Régularité Or', description: '30 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 30 }, xp: 500 },
  { id: 'beginner_student', icon: '📚', name: 'Étudiant Débutant', description: '10 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 36000 }, xp: 150 },
  { id: 'confirmed_student', icon: '🎓', name: 'Étudiant Confirmé', description: '50 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 180000 }, xp: 300 },
  { id: 'master_student', icon: '👨‍🎓', name: 'Maître Étudiant', description: '100 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 360000 }, xp: 500 },
  { id: 'specialist', icon: '⭐', name: 'Spécialiste', description: 'Niveau 10 dans une matière', type: 'specialization', requirement: { type: 'subjectLevel', value: 10 }, xp: 400 },
  { id: 'polymath', icon: '🧠', name: 'Polymathe', description: '5 matières différentes', type: 'specialization', requirement: { type: 'subjectCount', value: 5 }, xp: 300 },
  { id: 'night_owl', icon: '🦉', name: 'Hibou de Nuit', description: 'Étudier après 22h', type: 'special', requirement: { type: 'late_study', value: 1 }, xp: 100 },
  { id: 'early_bird', icon: '🐦', name: 'Lève-tôt', description: 'Étudier avant 7h', type: 'special', requirement: { type: 'early_study', value: 1 }, xp: 100 },
  { id: 'marathon_runner', icon: '🏃‍♂️', name: 'Marathonien', description: 'Session 3h', type: 'special', requirement: { type: 'long_session', value: 10800 }, xp: 200 },
  { id: 'perfectionist', icon: '💎', name: 'Perfectionniste', description: '20 sessions sans interruption', type: 'special', requirement: { type: 'perfect_sessions', value: 20 }, xp: 250 },
];

// Jours de la semaine
export const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const WEEK_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Types de session
export const SESSION_TYPES = {
  WORK: 'work',
  BREAK: 'break',
};

// Limites et contraintes
export const LIMITS = {
  MAX_SUBJECT_NAME_LENGTH: 100,
  MAX_SUMMARY_LENGTH: 2000,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SESSIONS_DISPLAY: 10, // Nombre de sessions affichées par défaut
  SESSIONS_PER_PAGE: 50, // Pour pagination
};

// Types de fichiers acceptés
export const ACCEPTED_FILE_TYPES = ['.odt', '.ods', '.pdf', '.docx', '.xlsx', '.txt', '.md'];
export const ACCEPTED_MIME_TYPES = [
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
];

// Debounce timings (en ms)
export const DEBOUNCE_DELAYS = {
  SAVE: 300, // Sauvegarde IndexedDB
  SEARCH: 500, // Recherche
  VALIDATION: 200, // Validation formulaire
};

// Couleurs timer selon état
export const TIMER_COLORS = {
  RUNNING: '#2ed573', // Vert
  PAUSED: '#ff8c42', // Orange
  WARNING: '#ff4757', // Rouge (5 dernières minutes)
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  SUBJECT_NAME_REQUIRED: 'Le nom de la matière est requis',
  SUBJECT_ALREADY_EXISTS: 'Cette matière existe déjà',
  SUBJECT_NAME_TOO_LONG: `Le nom ne peut pas dépasser ${LIMITS.MAX_SUBJECT_NAME_LENGTH} caractères`,
  SUMMARY_TOO_LONG: `Le résumé ne peut pas dépasser ${LIMITS.MAX_SUMMARY_LENGTH} caractères`,
  FILE_TOO_LARGE: `Le fichier ne peut pas dépasser ${LIMITS.MAX_FILE_SIZE_MB}MB`,
  INVALID_FILE_TYPE: 'Type de fichier non accepté',
  SESSION_INVALID: 'Données de session invalides',
  INDEXEDDB_ERROR: 'Erreur lors de l\'accès à la base de données',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  LOAD_ERROR: 'Erreur lors du chargement',
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  SUBJECT_ADDED: 'Matière ajoutée avec succès',
  SUBJECT_DELETED: 'Matière supprimée',
  SESSION_ADDED: 'Session ajoutée',
  SESSION_EDITED: 'Session modifiée',
  SESSION_DELETED: 'Session supprimée',
  SESSION_STARTED: 'Session démarrée',
  SESSION_STOPPED: 'Session arrêtée',
  SESSION_COMPLETED: 'Session terminée !',
  DATA_EXPORTED: 'Données exportées avec succès',
  DATA_IMPORTED: 'Données importées avec succès',
};

