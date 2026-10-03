/**
 * Ordre et visibilité des blocs sous chaque mois du calendrier.
 * Le choix n'a pas de date de départ : réactiver un bloc réaffiche
 * tous les mois qui ont déjà la donnée.
 */

export const CALENDAR_MONTH_TILE_LAYOUT_KEY = 'momentum.calendar.monthTileLayout';
export const CALENDAR_MONTH_TILE_LAYOUT_EVENT = 'momentum-calendar-month-tiles';

export const CALENDAR_MONTH_TILE_GROUPS = [
  {
    id: 'training',
    label: 'Musculation',
    hint: 'Reps, temps, kilos, série, jours entraînés'
  },
  {
    id: 'running',
    label: 'Course',
    hint: 'Kilomètres, temps, sorties, meilleure course'
  },
  {
    id: 'steps',
    label: 'Pas',
    hint: 'Total du mois, record, moyenne, semaines'
  },
  {
    id: 'weekReps',
    label: 'Reps par semaine',
    hint: 'Total de répétitions sur S1 à S4'
  },
  {
    id: 'weekKm',
    label: 'Km par semaine',
    hint: 'Distance courue sur S1 à S4'
  },
  {
    id: 'dailyKcal',
    label: 'Kcal de la journée',
    hint: 'Dépense Garmin du jour entier, hors détail des séances'
  },
  {
    id: 'activityKcal',
    label: 'Kcal des activités',
    hint: 'Calories des séances sportives, distinctes de la journée'
  },
  {
    id: 'recovery',
    label: 'Sommeil et repos',
    hint: 'Sommeil, repos cochés, étirements'
  },
  {
    id: 'highlights',
    label: 'Records',
    hint: 'Meilleur jour en reps, volume, muscles'
  }
];

const GROUP_IDS = CALENDAR_MONTH_TILE_GROUPS.map((group) => group.id);

/** Sections visuelles de la carte « Stats du mois ». L'ordre suit le premier bloc de chaque section. */
export const CALENDAR_MONTH_VISUAL_SECTIONS = [
  { id: 'training', label: 'Musculation', parts: ['training', 'weekReps', 'highlights'] },
  { id: 'running', label: 'Course', parts: ['running', 'weekKm'] },
  { id: 'steps', label: 'Pas', parts: ['steps'] },
  { id: 'energy', label: 'Énergie', parts: ['dailyKcal', 'activityKcal'] },
  { id: 'recovery', label: 'Récupération', parts: ['recovery'] }
];

export function orderedCalendarMonthSections(layout) {
  const normalized = normalizeCalendarMonthTileLayout(layout);
  return [...CALENDAR_MONTH_VISUAL_SECTIONS].sort((a, b) => {
    const first = (section) => Math.min(...section.parts.map((id) => normalized.order.indexOf(id)));
    return first(a) - first(b);
  });
}

export function layoutOrderFromSections(sections, layout) {
  const normalized = normalizeCalendarMonthTileLayout(layout);
  return sections.flatMap((section) =>
    [...section.parts].sort(
      (a, b) => normalized.order.indexOf(a) - normalized.order.indexOf(b)
    )
  );
}

export function defaultCalendarMonthTileLayout() {
  return { order: [...GROUP_IDS], hidden: [] };
}

export function normalizeCalendarMonthTileLayout(raw) {
  const order = [];
  const seen = new Set();
  (Array.isArray(raw?.order) ? raw.order : []).forEach((id) => {
    if (GROUP_IDS.includes(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  });
  GROUP_IDS.forEach((id) => {
    if (!seen.has(id)) order.push(id);
  });
  const hidden = (Array.isArray(raw?.hidden) ? raw.hidden : []).filter(
    (id, index, list) => GROUP_IDS.includes(id) && list.indexOf(id) === index
  );
  return { order, hidden };
}

export function readCalendarMonthTileLayout() {
  if (typeof localStorage === 'undefined') return defaultCalendarMonthTileLayout();
  try {
    const raw = localStorage.getItem(CALENDAR_MONTH_TILE_LAYOUT_KEY);
    if (!raw) return defaultCalendarMonthTileLayout();
    return normalizeCalendarMonthTileLayout(JSON.parse(raw));
  } catch {
    return defaultCalendarMonthTileLayout();
  }
}

export function writeCalendarMonthTileLayout(layout) {
  const next = normalizeCalendarMonthTileLayout(layout);
  try {
    localStorage.setItem(CALENDAR_MONTH_TILE_LAYOUT_KEY, JSON.stringify(next));
  } catch {
    /* quota ou mode privé : l'état React du réglage reste valable pour la session */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CALENDAR_MONTH_TILE_LAYOUT_EVENT));
  }
  return next;
}

export function visibleCalendarMonthTileIds(layout) {
  const normalized = normalizeCalendarMonthTileLayout(layout);
  const hidden = new Set(normalized.hidden);
  return normalized.order.filter((id) => !hidden.has(id));
}
