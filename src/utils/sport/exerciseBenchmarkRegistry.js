/**
 * Registre exercice → benchmark (pattern matching + métrique).
 */

import { STRENGTH_EXERCISE_BENCHMARKS } from '../../data/performanceBenchmarks/strengthExercises';
import {
  isVerticalPullExercise,
  isAustralianPullExercise,
  isPushupExercise,
  exerciseMovementBlob
} from './recapInsightHelpers';
import { classifyIsometricBenchmarkKey } from './exerciseIsometricMatch';

function matchBlob(blob, patterns) {
  const b = String(blob || '').toLowerCase();
  return patterns.some((re) => re.test(b));
}

/**
 * @typedef {object} ExerciseBenchmarkDef
 * @property {string} key
 * @property {string} label
 * @property {'max_set_reps'|'hold_seconds'|'max_weight_kg'} metric
 * @property {(exerciseId: string|number, getExerciseNameById?: Function) => boolean} match
 * @property {object} benchmark
 */

/** @type {ExerciseBenchmarkDef[]} */
export const EXERCISE_BENCHMARK_REGISTRY = [
  {
    key: 'pullups_australian',
    label: STRENGTH_EXERCISE_BENCHMARKS.pullups_australian.label,
    metric: 'max_set_reps',
    match: (id, getName) => isAustralianPullExercise(id, getName),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.pullups_australian
  },
  {
    key: 'pullups_strict',
    label: STRENGTH_EXERCISE_BENCHMARKS.pullups_strict.label,
    metric: 'max_set_reps',
    match: (id, getName) => isVerticalPullExercise(id, getName),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.pullups_strict
  },
  {
    key: 'dips',
    label: STRENGTH_EXERCISE_BENCHMARKS.dips.label,
    metric: 'max_set_reps',
    match: (id, getName) => {
      const blob = exerciseMovementBlob({ id }, getName);
      return matchBlob(blob, [/dip\b/, /barre parallèle/, /paralleles/]) && !/traction|pull/.test(blob);
    },
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.dips
  },
  {
    key: 'pushups',
    label: STRENGTH_EXERCISE_BENCHMARKS.pushups.label,
    metric: 'max_set_reps',
    match: (id, getName) => isPushupExercise(id, getName),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.pushups
  },
  {
    key: 'plank_straight_arm',
    label: STRENGTH_EXERCISE_BENCHMARKS.plank_straight_arm.label,
    metric: 'hold_seconds',
    match: (id, getName) => classifyIsometricBenchmarkKey(id, getName) === 'plank_straight_arm',
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.plank_straight_arm
  },
  {
    key: 'side_plank',
    label: STRENGTH_EXERCISE_BENCHMARKS.side_plank.label,
    metric: 'hold_seconds',
    match: (id, getName) => classifyIsometricBenchmarkKey(id, getName) === 'side_plank',
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.side_plank
  },
  {
    key: 'wall_sit',
    label: STRENGTH_EXERCISE_BENCHMARKS.wall_sit.label,
    metric: 'hold_seconds',
    match: (id, getName) => classifyIsometricBenchmarkKey(id, getName) === 'wall_sit',
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.wall_sit
  },
  {
    key: 'gainage_static',
    label: STRENGTH_EXERCISE_BENCHMARKS.gainage_static.label,
    metric: 'hold_seconds',
    match: (id, getName) => classifyIsometricBenchmarkKey(id, getName) === 'gainage_static',
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.gainage_static
  },
  {
    key: 'bodyweight_squat',
    label: STRENGTH_EXERCISE_BENCHMARKS.bodyweight_squat.label,
    metric: 'max_set_reps',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /squat/,
        /air squat/,
        /pistol/
      ]) && !/barre|barbell|haltère|haltere|presse/.test(exerciseMovementBlob({ id }, getName)),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.bodyweight_squat
  },
  {
    key: 'dumbbell_curl',
    label: STRENGTH_EXERCISE_BENCHMARKS.dumbbell_curl.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [/curl/, /biceps/]) &&
      !/marteau|hammer|pupitre|preacher/.test(exerciseMovementBlob({ id }, getName)),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.dumbbell_curl
  },
  {
    key: 'hammer_curl',
    label: STRENGTH_EXERCISE_BENCHMARKS.hammer_curl.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [/marteau/, /hammer curl/]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.hammer_curl
  },
  {
    key: 'bench_press',
    label: STRENGTH_EXERCISE_BENCHMARKS.bench_press.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /développé couché/,
        /developpe couche/,
        /bench press/,
        /dc barre/,
        /\bdc\b/
      ]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.bench_press
  },
  {
    key: 'barbell_squat',
    label: STRENGTH_EXERCISE_BENCHMARKS.barbell_squat.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /squat barre/,
        /back squat/,
        /squat.*barre/,
        /barbell squat/
      ]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.barbell_squat
  },
  {
    key: 'deadlift',
    label: STRENGTH_EXERCISE_BENCHMARKS.deadlift.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /soulevé de terre/,
        /souleve de terre/,
        /deadlift/,
        /dead lift/,
        /\bsdt\b/
      ]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.deadlift
  },
  {
    key: 'overhead_press',
    label: STRENGTH_EXERCISE_BENCHMARKS.overhead_press.label,
    metric: 'max_weight_kg',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /développé militaire/,
        /developpe militaire/,
        /overhead press/,
        /military press/,
        /ohp/
      ]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.overhead_press
  },
  {
    key: 'crunches',
    label: STRENGTH_EXERCISE_BENCHMARKS.crunches.label,
    metric: 'max_set_reps',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [
        /crunch/,
        /abdomin/,
        /sit-up/,
        /relevé de buste/
      ]) && !/planche|gainage|plank/.test(exerciseMovementBlob({ id }, getName)),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.crunches
  },
  {
    key: 'muscle_up',
    label: STRENGTH_EXERCISE_BENCHMARKS.muscle_up.label,
    metric: 'max_set_reps',
    match: (id, getName) =>
      matchBlob(exerciseMovementBlob({ id }, getName), [/muscle[- ]?up/, /muscleup/]),
    benchmark: STRENGTH_EXERCISE_BENCHMARKS.muscle_up
  }
];

export function resolveExerciseBenchmark(exerciseId, getExerciseNameById) {
  const id = String(exerciseId || '').replace(/_semaineA$|_semaineB$/, '');
  for (const def of EXERCISE_BENCHMARK_REGISTRY) {
    if (def.match(id, getExerciseNameById)) return def;
  }
  return null;
}

export function tierForValue(tiers, value) {
  if (!Array.isArray(tiers) || value == null || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const sorted = [...tiers].sort((a, b) => b.min - a.min);
  return sorted.find((t) => v >= t.min && v <= t.max) || null;
}
