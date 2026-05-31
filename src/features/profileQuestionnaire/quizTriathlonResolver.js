/**
 * Module triathlon v6.2b — distance + point faible (SPEC §6.3).
 */

import { TRIATHLON_DISTANCE_KEYS, TRIATHLON_WEAK_LEG_KEYS } from './data/missionProfilesExtended';

/**
 * @param {object} answers
 * @returns {string|null} triathlon_sprint | triathlon_olympic | ...
 */
export function resolveTriathlonMissionId(answers) {
  const pm = answers?.primaryMission;
  if (typeof pm === 'string' && pm.startsWith('triathlon_')) return pm;

  const hasTriIntent = pm === 'triathlon' || TRIATHLON_DISTANCE_KEYS.includes(answers?.triathlonDistance);
  if (!hasTriIntent) return null;

  const dist = answers?.triathlonDistance;
  const key = TRIATHLON_DISTANCE_KEYS.includes(dist) ? dist : 'olympic';
  return `triathlon_${key}`;
}

/**
 * Ajuste la répartition intensité course selon le point faible.
 * @param {{ easy: number, tempo: number, intervals: number }} split
 * @param {string} [weakLeg]
 */
export function adjustIntensitySplitForTriathlonWeakLeg(split, weakLeg) {
  if (!split) return split;
  const s = { easy: split.easy ?? 0.7, tempo: split.tempo ?? 0.2, intervals: split.intervals ?? 0.1 };
  const w = TRIATHLON_WEAK_LEG_KEYS.includes(weakLeg) ? weakLeg : null;

  if (w === 'swim' || w === 'bike') {
    s.easy += 0.06;
    s.intervals -= 0.04;
    s.tempo -= 0.02;
  } else if (w === 'run') {
    s.intervals += 0.05;
    s.tempo += 0.03;
    s.easy -= 0.08;
  }

  const sum = s.easy + s.tempo + s.intervals;
  return {
    easy: Math.max(0.5, s.easy / sum),
    tempo: Math.max(0.05, s.tempo / sum),
    intervals: Math.max(0.05, s.intervals / sum)
  };
}

/**
 * @param {object} answers
 * @returns {string|null}
 */
export function triathlonWeakLegLabelFr(answers) {
  const w = answers?.triathlonWeakLeg;
  if (w === 'swim') return 'natation';
  if (w === 'bike') return 'vélo';
  if (w === 'run') return 'course à pied';
  return null;
}
