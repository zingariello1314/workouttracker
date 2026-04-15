/**
 * Repères calendaires (1er jour, 7 j, 20 j, mois 1…12, puis chaque mois jusqu’à 20 ans),
 * distincts des jalons « santé » (timeline tabac / THC).
 */

import { MS, TWENTY_YEARS_MS } from './addictionQuitConstants';

/** @typedef {{ ms: number, labelKey: string, params?: Record<string, string> }} PeriodMilestoneDef */

/** Liste triée par ms croissant (une entrée par seuil). */
export function getPeriodMilestoneDefinitions() {
  /** @type {PeriodMilestoneDef[]} */
  const out = [];
  const add = (ms, labelKey, params) => {
    out.push(params ? { ms, labelKey, params } : { ms, labelKey });
  };
  add(1 * MS.DAY, 'addictionQuit.period.day1');
  add(7 * MS.DAY, 'addictionQuit.period.day7');
  add(20 * MS.DAY, 'addictionQuit.period.day20');
  for (let n = 1; n <= 12; n += 1) {
    if (n === 1) add(1 * MS.MONTH, 'addictionQuit.period.month1');
    else add(n * MS.MONTH, 'addictionQuit.period.monthN', { n: String(n) });
  }
  for (let n = 13; n * MS.MONTH < TWENTY_YEARS_MS; n += 1) {
    add(n * MS.MONTH, 'addictionQuit.period.monthN', { n: String(n) });
  }
  if (out.length && out[out.length - 1].ms < TWENTY_YEARS_MS) {
    add(TWENTY_YEARS_MS, 'addictionQuit.period.twentyYears');
  }
  out.sort((a, b) => a.ms - b.ms);
  return out;
}

export function resolvePeriodMilestoneLabel(def, t) {
  if (!def?.labelKey) return '';
  const p = def.params;
  if (p && typeof p === 'object' && Object.keys(p).length) return t(def.labelKey, p);
  return t(def.labelKey);
}

export function periodMilestonesCrossedBetween(startE, endE, defs = getPeriodMilestoneDefinitions()) {
  if (!Array.isArray(defs) || endE <= 0) return [];
  return defs.filter((m) => m.ms > startE && m.ms <= endE);
}

/**
 * Prochain repère temps non atteint.
 * @param {number} elapsedMs
 * @param {(key: string, params?: object) => string} t
 */
export function getNextPeriodMilestone(elapsedMs, t) {
  const defs = getPeriodMilestoneDefinitions();
  for (const d of defs) {
    if (elapsedMs < d.ms) {
      return {
        def: d,
        label: resolvePeriodMilestoneLabel(d, t),
        msUntil: d.ms - elapsedMs,
      };
    }
  }
  return null;
}

/** Fraction de la jauge « 20 ans » (0–1) pour positionner un tick. */
export function periodMilestoneGaugeT(ms) {
  return Math.min(1, Math.max(0, ms / TWENTY_YEARS_MS));
}
