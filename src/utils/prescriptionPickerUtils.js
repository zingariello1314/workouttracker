/**
 * Listes et conversion pour saisie uniforme séries × reps (Programme).
 */

import { detectExerciseUnit } from './exerciseCalculations';
import { parsePrescriptionFromSeries } from './programPrescriptionNormalizer';

export const PRESCRIPTION_SET_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const PRESCRIPTION_REP_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);
export const PRESCRIPTION_TIME_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120, 180];
export const PRESCRIPTION_MINUTE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90];

export const PRESCRIPTION_REP_RANGE_PRESETS = [
  { min: 4, max: 6 },
  { min: 6, max: 8 },
  { min: 8, max: 10 },
  { min: 8, max: 12 },
  { min: 10, max: 12 },
  { min: 12, max: 15 },
  { min: 10, max: 15 }
];

/**
 * @typedef {object} EditorPrescription
 * @property {'reps'|'seconds'|'minutes'} volumeMode
 * @property {number} setCount
 * @property {number} repsMin
 * @property {number} repsMax
 * @property {'total'|'per_hand'|'per_side'} repsScope
 * @property {boolean} useRange
 */

/**
 * @param {object} exercise
 * @returns {EditorPrescription}
 */
export function seriesToEditorPrescription(exercise) {
  const meta = exercise?.meta;
  if (meta?.setCount != null && meta?.volumeMode) {
    return {
      volumeMode: meta.volumeMode,
      setCount: meta.setCount,
      repsMin: meta.repsMin ?? 10,
      repsMax: meta.repsMax ?? meta.repsMin ?? 10,
      repsScope: meta.repsScope || 'total',
      useRange: meta.repsMin != null && meta.repsMax != null && meta.repsMin !== meta.repsMax
    };
  }

  const parsed = parsePrescriptionFromSeries(exercise?.series, exercise);
  if (parsed && !parsed.skip) {
    return {
      volumeMode: parsed.volumeMode,
      setCount: parsed.setCount,
      repsMin: parsed.repsMin,
      repsMax: parsed.repsMax,
      repsScope: parsed.repsScope || 'total',
      useRange: parsed.repsMin !== parsed.repsMax
    };
  }

  const unit = detectExerciseUnit(exercise);
  if (unit?.isTimeBased) {
    return {
      volumeMode: unit.unit === 'min' ? 'minutes' : 'seconds',
      setCount: 1,
      repsMin: 30,
      repsMax: 30,
      repsScope: 'total',
      useRange: false
    };
  }

  return {
    volumeMode: 'reps',
    setCount: 3,
    repsMin: 10,
    repsMax: 10,
    repsScope: 'total',
    useRange: false
  };
}

/**
 * @param {EditorPrescription} p
 * @returns {string}
 */
export function buildSeriesFromEditorPrescription(p) {
  if (p.volumeMode === 'seconds') {
    return p.setCount > 1 ? `${p.setCount}×${p.repsMin} sec` : `${p.repsMin} sec`;
  }
  if (p.volumeMode === 'minutes') {
    return p.setCount > 1 ? `${p.setCount}×${p.repsMin} min` : `${p.repsMin} min`;
  }
  const scopeSuffix =
    p.repsScope === 'per_hand' ? '/main' : p.repsScope === 'per_side' ? '/côté' : '';
  const repsPart = p.useRange ? `${p.repsMin}-${p.repsMax}` : String(p.repsMin);
  return `${p.setCount}×${repsPart}${scopeSuffix}`;
}

/**
 * Prescription par défaut à l’ajout d’un exercice (banque → programme).
 * Holds type wall sit → séries × minutes ; planche → séries × secondes ; cardio bloc → 1 × N min.
 * @param {object} exercise
 * @returns {EditorPrescription}
 */
export function defaultEditorPrescriptionForExercise(exercise) {
  const unit = detectExerciseUnit(exercise);
  if (unit?.isTimeBased) {
    const name = String(exercise?.name || '').toLowerCase();
    const isCardioBlock =
      /course|footing|running|endurance|corde|boxe|natation|marche\s+active/.test(name);
    if (unit.unit === 'min') {
      if (isCardioBlock) {
        return {
          volumeMode: 'minutes',
          setCount: 1,
          repsMin: 20,
          repsMax: 20,
          repsScope: 'total',
          useRange: false
        };
      }
      return {
        volumeMode: 'minutes',
        setCount: 3,
        repsMin: 1,
        repsMax: 1,
        repsScope: 'total',
        useRange: false
      };
    }
    return {
      volumeMode: 'seconds',
      setCount: 3,
      repsMin: 30,
      repsMax: 30,
      repsScope: 'total',
      useRange: false
    };
  }
  return {
    volumeMode: 'reps',
    setCount: 3,
    repsMin: 10,
    repsMax: 10,
    repsScope: 'total',
    useRange: false
  };
}

export function defaultSeriesForExercise(exercise) {
  return buildSeriesFromEditorPrescription(defaultEditorPrescriptionForExercise(exercise));
}

/**
 * @param {EditorPrescription} p
 * @returns {object}
 */
export function editorPrescriptionToMeta(p) {
  return {
    volumeMode: p.volumeMode,
    setCount: p.setCount,
    repsMin: p.repsMin,
    repsMax: p.useRange ? p.repsMax : p.repsMin,
    repsScope: p.repsScope || 'total',
    prescriptionNormalized: true,
    ...(p.volumeMode === 'reps' && p.repsScope === 'per_hand'
      ? { repsPerHand: p.useRange ? `${p.repsMin}-${p.repsMax}` : p.repsMin }
      : {}),
    ...(p.volumeMode === 'reps' && p.repsScope === 'per_side'
      ? { repsPerSide: p.useRange ? `${p.repsMin}-${p.repsMax}` : p.repsMin }
      : {})
  };
}

/**
 * Applique une prescription éditeur sur un exercice (series + meta).
 * @param {object} exercise
 * @param {Partial<EditorPrescription>} patch
 */
export function applyEditorPrescriptionToExercise(exercise, patch) {
  const current = seriesToEditorPrescription(exercise);
  const next = { ...current, ...patch };
  if (!next.useRange) next.repsMax = next.repsMin;
  const series = buildSeriesFromEditorPrescription(next);
  const meta = {
    ...(exercise?.meta && typeof exercise.meta === 'object' ? exercise.meta : {}),
    ...editorPrescriptionToMeta(next)
  };
  return { ...exercise, series, meta };
}
