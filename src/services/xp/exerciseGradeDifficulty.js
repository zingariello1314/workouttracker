/**
 * Poids « rep équivalent pompes » par exercice (difficulté biomechanique + charge).
 */

import { inferExerciseIntensityCoeff, tieredIsometricRawUnits } from '../../utils/trainingLoadUtils';

/** 1 rep = difficulté d’une pompe classique (référence). */
const PUSHUP_INFER_REF = 3;

/** @type {Record<string, { repWeight?: number, holdFactor?: number, label?: string }>} */
export const REGISTRY_DIFFICULTY = {
  pushups: { repWeight: 1, label: 'Pompes (réf.)' },
  dips: { repWeight: 1.4, label: 'Dips' },
  pullups_strict: { repWeight: 1.75, label: 'Tractions strictes' },
  pullups_australian: { repWeight: 0.9, label: 'Tractions australiennes' },
  muscle_up: { repWeight: 2.2, label: 'Muscle-up' },
  bodyweight_squat: { repWeight: 0.7, label: 'Squat poids du corps' },
  bench_press: { repWeight: 1.1, holdFactor: 0, label: 'Développé couché' },
  overhead_press: { repWeight: 1.15, label: 'Développé militaire' },
  dumbbell_curl: { repWeight: 0.45, label: 'Curl haltère' },
  hammer_curl: { repWeight: 0.5, label: 'Curl marteau' },
  zottman_curl: { repWeight: 0.55, label: 'Curl Zottman' },
  barbell_squat: { repWeight: 1.25, label: 'Squat barre' },
  deadlift: { repWeight: 1.35, label: 'Soulevé de terre' },
  crunches: { repWeight: 0.35, label: 'Abdos' },
  plank_straight_arm: { holdFactor: 1, label: 'Planche' },
  side_plank: { holdFactor: 1.1, label: 'Planche latérale' },
  wall_sit: { holdFactor: 0.85, label: 'Chaise' },
  gainage_static: { holdFactor: 0.95, label: 'Gainage' }
};

const ISO_TO_REP_EQ = 0.575 / 8;

export function resolveExerciseDifficultyProfile(catalogKey, def, getExerciseNameById) {
  const regKey = def?.registryKey || (catalogKey?.startsWith('ex:') ? null : catalogKey);
  if (regKey && REGISTRY_DIFFICULTY[regKey]) {
    return { ...REGISTRY_DIFFICULTY[regKey], registryKey: regKey };
  }

  const label = def?.label || catalogKey || '';
  const inferStub = { id: catalogKey, name: label };
  const coeff = inferExerciseIntensityCoeff(inferStub);
  const repWeight = Math.round((Math.max(0.25, coeff) / PUSHUP_INFER_REF) * 100) / 100;
  return { repWeight, holdFactor: 0.9, registryKey: regKey, label: label || 'Exercice' };
}

export function holdSecondsToRepEquivalent(seconds, holdFactor = 1) {
  const raw = tieredIsometricRawUnits(seconds);
  return Math.round(raw * ISO_TO_REP_EQ * holdFactor * 10) / 10;
}

/**
 * @returns {{ weightedPeak: number, weightedLife: number, repWeight: number, holdFactor: number }}
 */
export function applyDifficultyWeightToMetrics(metrics, metric, profile) {
  const repW = profile.repWeight ?? 1;
  const holdF = profile.holdFactor ?? 1;

  if (metric === 'hold_seconds') {
    const peak = holdSecondsToRepEquivalent(metrics.maxHoldSeconds || 0, holdF);
    const life = holdSecondsToRepEquivalent(
      metrics.lifetimeHoldSeconds || metrics.maxHoldSeconds || 0,
      holdF
    );
    return { weightedPeak: peak, weightedLife: life, repWeight: repW, holdFactor: holdF };
  }

  if (metric === 'max_weight_kg') {
    const peak = (metrics.maxWeightKg || 0) * repW * 0.15;
    const life = (metrics.totalVolumeKg || metrics.lifetimeVolumeKg || 0) * repW * 0.02;
    return { weightedPeak: peak, weightedLife: life, repWeight: repW, holdFactor: holdF };
  }

  const peak = (metrics.maxDailyTotalReps || metrics.maxSetReps || 0) * repW;
  const life = (metrics.totalReps || 0) * repW;
  return { weightedPeak: peak, weightedLife: life, repWeight: repW, holdFactor: holdF };
}
