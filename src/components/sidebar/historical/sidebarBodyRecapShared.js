/**
 * Constantes partagées : bloc « Corps et charges » (sidebar + dashboard recap).
 */
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';

export const DASHBOARD_RECAP_PERIOD_KEY = 'dashboard.sport.recapPeriod';

export const DASHBOARD_RECAP_PERIODS = [
  { id: 'today', label: "Aujourd'hui", labelFull: "Aujourd'hui" },
  { id: '7d', label: '7j', labelFull: '7 jours' },
  { id: '30d', label: '30d', labelFull: '30 jours' },
  { id: '3m', label: '3m', labelFull: '3 mois' },
  { id: '6m', label: '6m', labelFull: '6 mois' },
  { id: '1y', label: '1a', labelFull: '1 an' },
  { id: '2y', label: '2a', labelFull: '2 ans' },
  { id: 'all', label: 'Toujours', labelFull: 'Toujours' }
];

export const DASHBOARD_RECAP_MUSCLE_GROUPS_TIME_OR_REPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR,
  MuscleGroups.CORE
]);
