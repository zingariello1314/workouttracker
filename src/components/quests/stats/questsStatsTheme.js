/**
 * Thème Quêtes > Statistiques : fond noir, accents dorés (contraste avec Calendrier quêtes : fond doré, contour noir).
 * Ne pas utiliser pour les boutons de navigation / gradient-button-premium.
 */

export const qstatsPanel =
  'rounded-2xl border-2 border-amber-400/75 bg-black px-4 py-3 shadow-md shadow-black/50';

export const qstatsHeaderRow =
  'text-xs text-amber-400 mb-3 font-semibold tracking-wide flex items-center gap-2';

export const qstatsAccentBar =
  'w-1 h-4 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full';

export const qstatsMuted = 'text-amber-200/70';

export const qstatsMutedTight = 'text-amber-200/60';

export const qstatsValue = 'text-amber-300 font-semibold';

export const qstatsTitle = 'text-white';

/** Grilles / axes Recharts (famille ambre, pas slate) */
export const qstatsChartGrid = '#422006';
export const qstatsChartTick = '#fbbf24';
export const qstatsChartAxis = '#b45309';

/**
 * Couleurs de séries Recharts (lignes, barres, points) — bien distinctes sur fond noir.
 * Les cartes / bordures restent noir + doré (qstatsPanel).
 */
export const qstatsSeriesPalette = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#ef4444',
];

/** Couleurs par catégorie (aires, scatter, sunburst, sankey) */
export const qstatsCategoryChartColors = {
  Santé: { from: '#10b981', to: '#34d399' },
  Travail: { from: '#3b82f6', to: '#60a5fa' },
  Apprentissage: { from: '#8b5cf6', to: '#a78bfa' },
  Lecture: { from: '#ec4899', to: '#f472b6' },
  Sport: { from: '#f59e0b', to: '#fbbf24' },
  Ménage: { from: '#06b6d4', to: '#22d3ee' },
  Spirituel: { from: '#6366f1', to: '#818cf8' },
  Repas: { from: '#f97316', to: '#fb923c' },
  Projets: { from: '#14b8a6', to: '#2dd4bf' },
  Hobby: { from: '#a855f7', to: '#c084fc' },
  Social: { from: '#ef4444', to: '#f87171' },
  Finance: { from: '#22c55e', to: '#4ade80' },
  Créativité: { from: '#eab308', to: '#facc15' },
  'Bien-être': { from: '#06b6d4', to: '#38bdf8' },
};

export const qstatsCategoryStroke = Object.fromEntries(
  Object.entries(qstatsCategoryChartColors).map(([k, v]) => [k, v.from])
);

/** Couleurs « difficulté » pie / barres */
export const qstatsDifficultyColors = {
  1: '#10b981',
  2: '#06b6d4',
  3: '#f59e0b',
  4: '#ef4444',
};

export const qstatsDifficultyGradients = {
  1: { from: '#10b981', to: '#34d399' },
  2: { from: '#06b6d4', to: '#22d3ee' },
  3: { from: '#f59e0b', to: '#fbbf24' },
  4: { from: '#ef4444', to: '#f87171' },
};
