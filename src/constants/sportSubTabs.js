/**
 * Identifiants des vues rattachées au méta-onglet Sport (Navigation).
 * Utilisé pour afficher la barre XP sport sur chaque sous-onglet.
 */
export const SPORT_SUB_TAB_IDS = [
  'recap',
  'today',
  'data-entry',
  'program',
  'addiction-quit',
  'nutrition',
  'exercises',
  'progress',
  'endurance',
  'calendar',
  'charts',
  'performance-challenges',
  /** Statistiques + prédictions + équilibre IA + historique (hub unique) */
  'sport-analytics',
  'garmin',
];

export const isSportSubTab = (tabId) =>
  typeof tabId === 'string' && SPORT_SUB_TAB_IDS.includes(tabId);
