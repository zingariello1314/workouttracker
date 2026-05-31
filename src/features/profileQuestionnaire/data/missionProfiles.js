/**
 * Profils mission v6 — minimal + extensions v6.2b (marathon, triathlon, sports).
 * Pas de solveur : templates pour l’ordonnanceur hiérarchisé.
 */

import { MISSION_PROFILES_V6_EXTENDED } from './missionProfilesExtended';

/** @typedef {import('../quizWeeklyBudgetBuilder.js').IntensitySplit} IntensitySplit */

/**
 * @typedef {object} MissionProfileDef
 * @property {string} id
 * @property {string} labelFr
 * @property {number[]} [weeklyKmRange]
 * @property {IntensitySplit} [intensitySplit]
 * @property {number} maxStrengthDays
 * @property {'maintenance'|'balanced'|'priority'} strengthPriority
 * @property {number} cardioCapSessionsPerWeek
 * @property {number} [cardioFractionMax] 0–1 part de la semaine en run/cardio
 * @property {string} defaultStructure
 * @property {{ pull?: number, push?: number, legs?: number, core?: number }} strengthFamilyMul
 */

/** @type {Record<string, MissionProfileDef>} */
export const MISSION_PROFILES_V6_MINIMAL = {
  hypertrophy: {
    id: 'hypertrophy',
    labelFr: 'Hypertrophie',
    maxStrengthDays: 5,
    strengthPriority: 'priority',
    cardioCapSessionsPerWeek: 2,
    cardioFractionMax: 0.35,
    defaultStructure: 'upper_lower',
    strengthFamilyMul: { pull: 1.05, push: 1.05, legs: 1, core: 1 }
  },
  hypertrophy_street: {
    id: 'hypertrophy_street',
    labelFr: 'Hypertrophie + street',
    maxStrengthDays: 5,
    strengthPriority: 'priority',
    cardioCapSessionsPerWeek: 1,
    cardioFractionMax: 0.3,
    defaultStructure: 'upper_lower',
    strengthFamilyMul: { pull: 1.12, push: 1.08, legs: 0.95, core: 1 }
  },
  strength_max: {
    id: 'strength_max',
    labelFr: 'Force maximale',
    maxStrengthDays: 4,
    strengthPriority: 'priority',
    cardioCapSessionsPerWeek: 1,
    cardioFractionMax: 0.25,
    defaultStructure: 'upper_lower',
    strengthFamilyMul: { pull: 1.08, push: 1.08, legs: 1.1, core: 0.9 }
  },
  recomposition: {
    id: 'recomposition',
    labelFr: 'Recomposition',
    maxStrengthDays: 4,
    strengthPriority: 'balanced',
    cardioCapSessionsPerWeek: 3,
    cardioFractionMax: 0.4,
    defaultStructure: 'upper_lower',
    strengthFamilyMul: { pull: 1, push: 1, legs: 1, core: 1.05 }
  },
  general_health: {
    id: 'general_health',
    labelFr: 'Santé / forme générale',
    maxStrengthDays: 4,
    strengthPriority: 'balanced',
    cardioCapSessionsPerWeek: 3,
    cardioFractionMax: 0.45,
    defaultStructure: 'full_body',
    strengthFamilyMul: { pull: 1, push: 1, legs: 1, core: 1 }
  },
  run_5k_10k: {
    id: 'run_5k_10k',
    labelFr: 'Course 5–10 km',
    weeklyKmRange: [20, 40],
    intensitySplit: { easy: 0.7, tempo: 0.2, intervals: 0.1 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 4,
    cardioFractionMax: 0.55,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.9, push: 0.85, legs: 0.95, core: 1.05 }
  },
  run_half: {
    id: 'run_half',
    labelFr: 'Préparation semi-marathon',
    weeklyKmRange: [40, 80],
    intensitySplit: { easy: 0.75, tempo: 0.15, intervals: 0.1 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 5,
    cardioFractionMax: 0.65,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.85, push: 0.8, legs: 0.9, core: 1.1 }
  },
  run_health: {
    id: 'run_health',
    labelFr: 'Course — santé / reprise',
    weeklyKmRange: [10, 25],
    intensitySplit: { easy: 0.85, tempo: 0.1, intervals: 0.05 },
    maxStrengthDays: 2,
    strengthPriority: 'maintenance',
    cardioCapSessionsPerWeek: 3,
    cardioFractionMax: 0.5,
    defaultStructure: 'running_focus',
    strengthFamilyMul: { pull: 0.9, push: 0.9, legs: 0.9, core: 1 }
  },
  hybrid_run_strength: {
    id: 'hybrid_run_strength',
    labelFr: 'Hybride course + musculation',
    weeklyKmRange: [15, 35],
    intensitySplit: { easy: 0.72, tempo: 0.18, intervals: 0.1 },
    maxStrengthDays: 3,
    strengthPriority: 'balanced',
    cardioCapSessionsPerWeek: 4,
    cardioFractionMax: 0.5,
    defaultStructure: 'hybrid_alternating',
    strengthFamilyMul: { pull: 1, push: 1, legs: 0.95, core: 1 }
  },
  ...MISSION_PROFILES_V6_EXTENDED
};

/** Alias : profils minimal + v6.2b (résolution ordonnanceur). */
export const MISSION_PROFILES_V6 = MISSION_PROFILES_V6_MINIMAL;

export const WEEKLY_PLANNER_ENGINE_VERSION = 2;
export const WEEKLY_PLANNER_PHASE = 'v6_4_meal_enrichment';
