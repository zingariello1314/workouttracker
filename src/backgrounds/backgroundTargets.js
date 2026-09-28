const SPORT_TABS = new Set([
  'anatomy', 'recap', 'today', 'data-entry', 'program', 'addiction-quit', 'nutrition',
  'exercises', 'progress', 'endurance', 'calendar', 'charts', 'performance-challenges',
  'sport-analytics', 'garmin', 'sport',
]);

const CODE_TABS = new Set(['code', 'code-calendar', 'code-journal', 'code-stats']);

/** Onglets principaux auxquels un fond peut être assigné. Les sous-onglets Sport et Code suivent leur famille. */
export const BACKGROUND_TAB_TARGETS = [
  { id: 'home', label: 'Accueil' },
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'sport', label: 'Sport' },
  { id: 'quests', label: 'Quêtes' },
  { id: 'apprentissage', label: 'Apprentissage' },
  { id: 'rubiks', label: 'Rubik' },
  { id: 'books', label: 'Livres' },
  { id: 'knowledge', label: 'Savoir' },
  { id: 'code', label: 'Code' },
  { id: 'finance', label: 'Finance' },
  { id: 'settings', label: 'Paramètres' },
];

export const ROTATE_INTERVALS = [
  { sec: 15, label: '15 secondes' },
  { sec: 30, label: '30 secondes' },
  { sec: 60, label: '1 minute' },
  { sec: 300, label: '5 minutes' },
  { sec: 900, label: '15 minutes' },
];

export function backgroundTargetForTab(activeTab) {
  if (SPORT_TABS.has(activeTab)) return 'sport';
  if (CODE_TABS.has(activeTab)) return 'code';
  if (BACKGROUND_TAB_TARGETS.some((target) => target.id === activeTab)) return activeTab;
  return null;
}
