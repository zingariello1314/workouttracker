/**
 * Contraintes de programme (profil durable) — voyage, matériel, récupération.
 * Opt-in uniquement : ne retire jamais course/mission déjà choisies ailleurs.
 */

import { adjustSuggestedProgramWeeks } from './quizInfluence';

export const PROGRAM_CONSTRAINT_KEYS = new Set([
  'no_interval_after_legs',
  'travel_week',
  'limited_equipment'
]);

/** @deprecated doublon Q-R4 — ignoré à la lecture */
const LEGACY_IGNORED_KEYS = new Set(['can_long_run']);

const PORTABLE_EQUIPMENT = new Set([
  'bodyweight',
  'resistance_bands',
  'jump_rope',
  'pullup_bar',
  'parallel_bars',
  'dip_station',
  'dumbbells',
  'kettlebells'
]);

const HEAVY_EQUIPMENT = new Set([
  'barbell_plates',
  'squat_rack',
  'cable_machine',
  'bench',
  'smith_machine',
  'leg_press',
  'hack_squat'
]);

const experienceToDurationWeeks = {
  beginner_total: 4,
  beginner_0_3m: 6,
  intermediate_3_12m: 8,
  advanced_1_3y: 10,
  expert_3y_plus: 12
};

const sessionDurationToWeeks = {
  '15_30': 4,
  '30_45': 6,
  '45_60': 8,
  '60_90': 10
};

/**
 * @param {object} answers
 * @returns {string[]}
 */
export function normalizeProgramConstraints(answers) {
  const raw = Array.isArray(answers?.weeklyConstraints) ? answers.weeklyConstraints : [];
  const out = [];
  raw.forEach((k) => {
    const key = String(k);
    if (LEGACY_IGNORED_KEYS.has(key)) return;
    if (PROGRAM_CONSTRAINT_KEYS.has(key) && !out.includes(key)) out.push(key);
  });
  return out;
}

/**
 * @param {object} answers
 * @param {string} key
 */
export function hasProgramConstraint(answers, key) {
  return normalizeProgramConstraints(answers).includes(key);
}

/**
 * @param {object} answers
 */
export function getProfileConstraintEffects(answers) {
  const keys = normalizeProgramConstraints(answers);
  const travel = keys.includes('travel_week');
  const limited = keys.includes('limited_equipment');

  return {
    keys,
    avoidIntervalAfterLegs: keys.includes('no_interval_after_legs'),
    portableEquipmentOnly: travel || limited,
    maxActiveDaysDelta: travel ? -1 : 0,
    maxSessionMinutesCap: travel ? 48 : limited ? 55 : null,
    preferOutdoorCardio: travel,
    summaryFr: buildConstraintSummaryFr(keys)
  };
}

function buildConstraintSummaryFr(keys) {
  if (!keys.length) return null;
  const parts = [];
  if (keys.includes('travel_week')) parts.push('déplacements fréquents (séances plus courtes)');
  if (keys.includes('limited_equipment')) parts.push('priorité poids du corps / matériel léger');
  if (keys.includes('no_interval_after_legs')) {
    parts.push('pas de fractionné juste après jambes lourdes');
  }
  return parts.length ? `Contraintes actives : ${parts.join(' · ')}.` : null;
}

/**
 * Équipement effectif pour le fill (sans retirer les blocs course).
 * @param {object} answers
 */
export function resolveEffectiveQuizEquipment(answers) {
  const base = Array.isArray(answers?.availableEquipment) ? [...answers.availableEquipment] : [];
  if (!base.includes('bodyweight')) base.push('bodyweight');

  const { portableEquipmentOnly } = getProfileConstraintEffects(answers);
  if (!portableEquipmentOnly) return base;

  const filtered = base.filter((e) => PORTABLE_EQUIPMENT.has(e));
  if (filtered.length) return filtered;

  return ['bodyweight', ...(base.includes('pullup_bar') ? ['pullup_bar'] : [])];
}

/**
 * Durée du cycle programme (semaines) — explicite ou inférée.
 * @param {object} answers
 */
export function resolveProgramDurationWeeks(answers) {
  const raw = answers?.programDurationWeeks;
  if (raw && raw !== 'auto') {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.max(3, Math.min(16, Math.round(n)));
  }

  const level = answers?.experienceLevel;
  const duration = answers?.preferredSessionDuration;
  const base =
    sessionDurationToWeeks[duration] || experienceToDurationWeeks[level] || 6;
  return adjustSuggestedProgramWeeks(base, answers);
}

/**
 * @param {object} answers
 * @param {number} baseMax
 */
export function applyConstraintMaxActiveDays(baseMax, answers) {
  const { maxActiveDaysDelta } = getProfileConstraintEffects(answers);
  return Math.max(2, baseMax + maxActiveDaysDelta);
}

export function isHeavyEquipmentKey(key) {
  return HEAVY_EQUIPMENT.has(key);
}
