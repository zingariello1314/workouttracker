/**
 * Constantes partagées : bloc « Corps et charges » (sidebar + dashboard recap).
 */
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';

export const DASHBOARD_RECAP_PERIOD_KEY = 'dashboard.sport.recapPeriod';

export const DASHBOARD_RECAP_PERIODS = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7j' },
  { id: '30d', label: '30d' },
  { id: '3m', label: '3m' },
  { id: '6m', label: '6m' },
  { id: '1y', label: '1a' },
  { id: '2y', label: '2a' },
  { id: 'all', label: 'Toujours' }
];

export const DASHBOARD_RECAP_MUSCLE_GROUPS_TIME_OR_REPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR,
  MuscleGroups.CORE
]);
