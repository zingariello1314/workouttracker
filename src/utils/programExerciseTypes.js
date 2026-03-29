/**
 * Typologie des exercices dans les programmes (séparation du champ legacy `type` : circuit, superset…)
 */

export const PROGRAM_CATEGORIES = [
  { id: 'muscu', label: 'Musculation' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'street_workout', label: 'Street workout' },
  { id: 'mobilite', label: 'Mobilité' },
  { id: 'core', label: 'Core / gainage' },
  { id: 'autre', label: 'Autre' }
];

/** Sous-types quand catégorie = cardio (course, corde, autre cardio) */
export const CARDIO_KINDS = [
  { id: 'running', label: 'Course à pied' },
  { id: 'jump_rope', label: 'Corde à sauter' },
  { id: 'other', label: 'Autre cardio (vélo, rameur, etc.)' }
];

export const RUNNING_SUBTYPES = [
  { id: 'running_long', label: 'Sortie longue' },
  { id: 'running_short', label: 'Sortie courte / footing' },
  { id: 'running_interval', label: 'Fractionné / VMA' },
  { id: 'running_sprint', label: 'Sprints' },
  { id: 'running_tempo', label: 'Tempo / seuil' },
  { id: 'running_recovery', label: 'Récupération active' },
  { id: 'running_easy', label: 'Endurance facile' }
];

export const JUMP_ROPE_MODES = [
  { id: 'time', label: 'Par durée (min)' },
  { id: 'reps', label: 'Par nombre de sauts' },
  { id: 'rounds', label: 'Par rounds (séries × temps ou sauts)' }
];

export const MUSCU_PATTERNS = [
  { id: '', label: '— Classique —' },
  { id: 'straight', label: 'Séries droites' },
  { id: 'pyramid', label: 'Pyramide' },
  { id: '5x5', label: '5×5' },
  { id: 'amrap', label: 'AMRAP' },
  { id: 'emom', label: 'EMOM' },
  { id: 'superset', label: 'Superset' },
  { id: 'circuit', label: 'Circuit' }
];

export function getCategoryLabel(id) {
  return PROGRAM_CATEGORIES.find((c) => c.id === id)?.label || id || '';
}

export function createDefaultExercise() {
  const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: 'Nouvel exercice',
    series: '3×10',
    reps: '',
    rest: 90,
    intensity: 'moderate',
    materiel: '',
    notes: '',
    type: 'standard',
    programCategory: 'muscu',
    programSubType: '',
    cardioKind: '',
    meta: {}
  };
}

export function normalizeExerciseMeta(ex) {
  if (!ex || typeof ex !== 'object') return {};
  const m = ex.meta && typeof ex.meta === 'object' ? { ...ex.meta } : {};
  return m;
}
