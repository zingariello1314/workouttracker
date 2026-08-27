/**
 * Référentiels Momentum V1 — grades par exercice, sexe et tranche d'âge.
 */

import { catalogKeyReceivesPushupDefis } from '../../services/xp/exerciseGradePushupVariants';
import {
  PUSHUPS_MALE,
  PULLUPS_MALE,
  DIPS_MALE,
  PUSHUPS_TENSION_MALE,
  PUSHUPS_INCLINE_MALE,
  PUSHUPS_DECLINE_MALE,
  PULLUPS_SUPINATION_MALE,
  CURL_DUMBBELL_MALE,
  CURL_HAMMER_MALE,
  CURL_ZOTTMAN_MALE
} from './demographicLadderTables';

/** @typedef {{ sortIndex: number, gradeId: string, performanceRequired: number, volumePerDay: number }} DemographicLadderRow */

export const DEMOGRAPHIC_AGE_BANDS = [
  { id: '18-20', min: 18, max: 20 },
  { id: '21-24', min: 21, max: 24 },
  { id: '25-29', min: 25, max: 29 },
  { id: '30-34', min: 30, max: 34 },
  { id: '35-39', min: 35, max: 39 },
  { id: '40-44', min: 40, max: 44 },
  { id: '45-50', min: 45, max: 50 }
];

const FEMALE_PERF_RATIO = 0.65;
const FEMALE_VOLUME_RATIO = 0.75;

function scaleLadderRows(maleRows, perfRatio, volumeRatio) {
  return maleRows.map((row) => ({
    ...row,
    performanceRequired: Math.max(1, Math.round(row.performanceRequired * perfRatio)),
    volumePerDay: Math.max(1, Math.round(row.volumePerDay * volumeRatio))
  }));
}

function scaleLadderTables(maleTables) {
  return Object.fromEntries(
    Object.entries(maleTables).map(([band, rows]) => [
      band,
      scaleLadderRows(rows, FEMALE_PERF_RATIO, FEMALE_VOLUME_RATIO)
    ])
  );
}

export const MOMENTUM_V1_PUSHUPS_MALE = PUSHUPS_MALE;
export const MOMENTUM_V1_PUSHUPS_FEMALE = scaleLadderTables(PUSHUPS_MALE);
export const MOMENTUM_V1_PULLUPS_MALE = PULLUPS_MALE;
export const MOMENTUM_V1_PULLUPS_FEMALE = scaleLadderTables(PULLUPS_MALE);
export const MOMENTUM_V1_DIPS_MALE = DIPS_MALE;
export const MOMENTUM_V1_DIPS_FEMALE = scaleLadderTables(DIPS_MALE);
export const MOMENTUM_V1_PUSHUPS_TENSION_MALE = PUSHUPS_TENSION_MALE;
export const MOMENTUM_V1_PUSHUPS_TENSION_FEMALE = scaleLadderTables(PUSHUPS_TENSION_MALE);
export const MOMENTUM_V1_PUSHUPS_INCLINE_MALE = PUSHUPS_INCLINE_MALE;
export const MOMENTUM_V1_PUSHUPS_INCLINE_FEMALE = scaleLadderTables(PUSHUPS_INCLINE_MALE);
export const MOMENTUM_V1_PUSHUPS_DECLINE_MALE = PUSHUPS_DECLINE_MALE;
export const MOMENTUM_V1_PUSHUPS_DECLINE_FEMALE = scaleLadderTables(PUSHUPS_DECLINE_MALE);
export const MOMENTUM_V1_PULLUPS_SUPINATION_MALE = PULLUPS_SUPINATION_MALE;
export const MOMENTUM_V1_PULLUPS_SUPINATION_FEMALE = scaleLadderTables(PULLUPS_SUPINATION_MALE);
export const MOMENTUM_V1_CURL_DUMBBELL_MALE = CURL_DUMBBELL_MALE;
export const MOMENTUM_V1_CURL_DUMBBELL_FEMALE = scaleLadderTables(CURL_DUMBBELL_MALE);
export const MOMENTUM_V1_CURL_HAMMER_MALE = CURL_HAMMER_MALE;
export const MOMENTUM_V1_CURL_HAMMER_FEMALE = scaleLadderTables(CURL_HAMMER_MALE);
export const MOMENTUM_V1_CURL_ZOTTMAN_MALE = CURL_ZOTTMAN_MALE;
export const MOMENTUM_V1_CURL_ZOTTMAN_FEMALE = scaleLadderTables(CURL_ZOTTMAN_MALE);

/** @type {Record<string, { male: Record<string, DemographicLadderRow[]>, female: Record<string, DemographicLadderRow[]> }>} */
export const DEMOGRAPHIC_LADDER_REGISTRY = {
  pushups: { male: MOMENTUM_V1_PUSHUPS_MALE, female: MOMENTUM_V1_PUSHUPS_FEMALE },
  pushups_incline: { male: MOMENTUM_V1_PUSHUPS_INCLINE_MALE, female: MOMENTUM_V1_PUSHUPS_INCLINE_FEMALE },
  pushups_decline: { male: MOMENTUM_V1_PUSHUPS_DECLINE_MALE, female: MOMENTUM_V1_PUSHUPS_DECLINE_FEMALE },
  pushups_tension: { male: MOMENTUM_V1_PUSHUPS_TENSION_MALE, female: MOMENTUM_V1_PUSHUPS_TENSION_FEMALE },
  pullups_pronation: { male: MOMENTUM_V1_PULLUPS_MALE, female: MOMENTUM_V1_PULLUPS_FEMALE },
  pullups_supination: { male: MOMENTUM_V1_PULLUPS_SUPINATION_MALE, female: MOMENTUM_V1_PULLUPS_SUPINATION_FEMALE },
  dips: { male: MOMENTUM_V1_DIPS_MALE, female: MOMENTUM_V1_DIPS_FEMALE },
  dumbbell_curl: { male: MOMENTUM_V1_CURL_DUMBBELL_MALE, female: MOMENTUM_V1_CURL_DUMBBELL_FEMALE },
  hammer_curl: { male: MOMENTUM_V1_CURL_HAMMER_MALE, female: MOMENTUM_V1_CURL_HAMMER_FEMALE },
  zottman_curl: { male: MOMENTUM_V1_CURL_ZOTTMAN_MALE, female: MOMENTUM_V1_CURL_ZOTTMAN_FEMALE }
};

/** Exposants ajustement poids → reps équivalent référence (75 kg). */
export const WEIGHT_ADJUST_EXPONENT = {
  pullups_pronation: 0.65,
  pullups_supination: 0.65,
  pushups_decline: 0.5
};

/** Exposants 1RM chargé → équivalent 75 kg (curl haltère / marteau / Zottman). */
export const LOADED_1RM_ADJUST_EXPONENT = {
  dumbbell_curl: 0.45,
  hammer_curl: 0.45,
  zottman_curl: 0.45
};

export function normalizeDemographicSex(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'female' || s === 'f' || s === 'femme') return 'female';
  if (s === 'male' || s === 'm' || s === 'homme') return 'male';
  return 'male';
}

export function resolveDemographicAgeBand(age) {
  const a = Math.floor(Number(age) || 30);
  if (a < 18) return '18-20';
  if (a > 50) return '45-50';
  const band = DEMOGRAPHIC_AGE_BANDS.find((b) => a >= b.min && a <= b.max);
  return band?.id || '30-34';
}

export function isPullupPronationCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  if (k === 'pullups_strict') return true;
  if (k.startsWith('name:tractions-pronation')) return true;
  return false;
}

export function isPullupSupinationCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  return k.startsWith('name:tractions-supination');
}

export function isPushupsInclineCatalogKey(catalogKey) {
  return String(catalogKey || '') === 'name:pompes-inclinees';
}

export function isPushupsDeclineCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  return k === 'name:pompes-declinees' || k.startsWith('name:pompes-declinees-');
}

export function isPushupsTensionCatalogKey(catalogKey) {
  return String(catalogKey || '') === 'name:pompes-en-tension-continue';
}

export function isDipsCatalogKey(catalogKey) {
  return String(catalogKey || '') === 'dips';
}

export function isZottmanCurlCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  return k === 'zottman_curl' || k.startsWith('name:zottman') || k.startsWith('name:curl-zottman');
}

export function isHammerCurlCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  return k === 'hammer_curl' || k.startsWith('name:curl-marteau') || k.startsWith('name:hammer-curl');
}

export function isDumbbellCurlCatalogKey(catalogKey) {
  const k = String(catalogKey || '');
  if (isZottmanCurlCatalogKey(k) || isHammerCurlCatalogKey(k)) return false;
  return k === 'dumbbell_curl' || k === 'name:curl-halteres' || k === 'name:curl-haltères';
}

/**
 * @param {string} catalogKey
 * @param {string|null} [registryKey]
 * @returns {string|null}
 */
export function resolveDemographicExerciseId(catalogKey, registryKey) {
  void registryKey;
  if (isPushupsInclineCatalogKey(catalogKey)) return 'pushups_incline';
  if (isPushupsDeclineCatalogKey(catalogKey)) return 'pushups_decline';
  if (isPushupsTensionCatalogKey(catalogKey)) return 'pushups_tension';
  if (catalogKey === 'pushups' || catalogKey === 'pushups_classic') return 'pushups';
  if (catalogKeyReceivesPushupDefis(catalogKey)) return 'pushups';
  if (isDipsCatalogKey(catalogKey)) return 'dips';
  if (isZottmanCurlCatalogKey(catalogKey)) return 'zottman_curl';
  if (isHammerCurlCatalogKey(catalogKey)) return 'hammer_curl';
  if (isDumbbellCurlCatalogKey(catalogKey)) return 'dumbbell_curl';
  if (isPullupSupinationCatalogKey(catalogKey)) return 'pullups_supination';
  if (isPullupPronationCatalogKey(catalogKey)) return 'pullups_pronation';
  return null;
}

export function usesMomentumDemographicLadder(catalogKey, registryKey) {
  return Boolean(resolveDemographicExerciseId(catalogKey, registryKey));
}

export function demographicExerciseUsesWeightAdjustedPeak(exerciseId) {
  return exerciseId != null && exerciseId in WEIGHT_ADJUST_EXPONENT;
}

export function weightAdjustExponentForExercise(exerciseId) {
  return WEIGHT_ADJUST_EXPONENT[exerciseId] ?? null;
}

export function demographicExerciseUsesLoaded1Rm(exerciseId) {
  return exerciseId != null && exerciseId in LOADED_1RM_ADJUST_EXPONENT;
}

export function loadedOneRmAdjustExponentForExercise(exerciseId) {
  return LOADED_1RM_ADJUST_EXPONENT[exerciseId] ?? null;
}

export function getDemographicLadderForExercise(catalogKey, registryKey, vitals = {}) {
  const exerciseId = resolveDemographicExerciseId(catalogKey, registryKey);
  if (!exerciseId) return null;

  const registry = DEMOGRAPHIC_LADDER_REGISTRY[exerciseId];
  if (!registry) return null;

  const sex = normalizeDemographicSex(vitals.sex);
  const ageBand = resolveDemographicAgeBand(vitals.age);
  const table = sex === 'female' ? registry.female : registry.male;
  return table[ageBand] || registry.male['30-34'];
}

export function demographicLadderToProgressGates(ladder) {
  if (!ladder?.length) return null;
  return ladder.map((row, i) => ({
    peak: row.performanceRequired,
    life: row.volumePerDay,
    checks: Math.max(0, Math.round((i + 1) * 1.5))
  }));
}
