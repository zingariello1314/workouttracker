/** Thème visuel des modules sidebar (aligné sur l’onglet d’origine). */
const SPORT_IDS = new Set([
  'course-garmin-running',
  'sidebar-sport-planning',
  'sidebar-sport-calendar',
  'sidebar-muscu-recap',
  'sidebar-body-recap',
  'metriques-garmin'
]);

const QUESTS_IDS = new Set(['sidebar-daily-quests']);

const BOOKS_IDS = new Set([
  'progression-lecture',
  'session-lecture-active',
  'sidebar-reading-session',
  'sidebar-book-focus',
  'sidebar-books-recap'
]);

const FINANCE_IDS = new Set(['sidebar-finance-snapshot', 'liste-courses']);

const LEARNING_IDS = new Set(['apprentissage-express']);

const HOME_IDS = new Set(['creativite-projets', 'performance-globale']);

/**
 * @param {string} [moduleId]
 * @returns {'sport' | 'quests' | 'books' | 'finance' | 'learning' | 'home' | 'default'}
 */
export function getSidebarModuleTheme(moduleId) {
  if (!moduleId) return 'default';
  if (SPORT_IDS.has(moduleId)) return 'sport';
  if (QUESTS_IDS.has(moduleId)) return 'quests';
  if (BOOKS_IDS.has(moduleId)) return 'books';
  if (FINANCE_IDS.has(moduleId)) return 'finance';
  if (LEARNING_IDS.has(moduleId)) return 'learning';
  if (HOME_IDS.has(moduleId)) return 'home';
  return 'default';
}
