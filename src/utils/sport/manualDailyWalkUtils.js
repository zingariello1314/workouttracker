/**
 * Saisie manuelle des pas du jour (téléphone ou autre) quand la montre n’a pas la journée.
 * Plafonds anti-abus : pas trop permissifs mais suffisants pour une journée très active réelle.
 */
export const MANUAL_WALK_MAX_STEPS_PER_DAY = 55000;
export const MANUAL_WALK_MAX_DISTANCE_KM = 90;
/** Complément seul (mode « après montre ») — plafond journalier. */
export const MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY = 25000;

/** Facteur XP sur la part déclarative (montre = 100 %). */
export const DECLARATIVE_STEPS_XP_FACTOR = 0.5;

/** @typedef {'verified' | 'mixed' | 'self_reported'} StepsReliability */

/**
 * @typedef {object} ResolvedDailySteps
 * @property {number} garmin — pas montre (source fiable)
 * @property {number} declarative — apport manuel au total (source déclarative)
 * @property {number} total — pas affichés / trophées
 * @property {StepsReliability} reliability
 */

function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function normalizeGarminSteps(garminSteps) {
  return Math.max(0, Math.round(Number(garminSteps) || 0));
}

/**
 * Résolveur central — pas du jour par source.
 * @param {number} garminSteps
 * @param {number | { steps?: number, entryMode?: 'total' | 'supplement' } | null | undefined} manualInput
 * @returns {ResolvedDailySteps}
 */
export function resolveDailySteps(garminSteps, manualInput) {
  const g = normalizeGarminSteps(garminSteps);

  let manualEntry = null;
  if (manualInput != null && typeof manualInput === 'object' && !Array.isArray(manualInput)) {
    manualEntry = manualInput;
  } else {
    const m = Math.max(0, Math.round(Number(manualInput) || 0));
    if (m > 0) manualEntry = { steps: m };
  }

  if (!manualEntry?.steps || manualEntry.steps <= 0) {
    return { garmin: g, declarative: 0, total: g, reliability: 'verified' };
  }

  const rawManual = clampInt(manualEntry.steps, 0, MANUAL_WALK_MAX_STEPS_PER_DAY);
  let total;

  if (manualEntry.entryMode === 'supplement') {
    const supplement = clampInt(rawManual, 0, MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY);
    total = Math.min(MANUAL_WALK_MAX_STEPS_PER_DAY, g + supplement);
  } else {
    total = Math.min(MANUAL_WALK_MAX_STEPS_PER_DAY, Math.max(g, rawManual));
  }

  const declarative = Math.max(0, total - g);
  /** @type {StepsReliability} */
  let reliability = 'verified';
  if (declarative > 0) {
    reliability = g > 0 ? 'mixed' : 'self_reported';
  }

  return { garmin: g, declarative, total, reliability };
}

/** Pas effectifs pour un jour : max(montre, saisie) — rétrocompat ; préférer resolveDailySteps. */
export function mergedDailySteps(garminSteps, manualSteps) {
  return resolveDailySteps(garminSteps, manualSteps).total;
}

/**
 * XP pas : Garmin 100 %, déclaratif 50 %.
 * @param {ResolvedDailySteps} resolved
 * @returns {{ stepsXp: number, stepsXpVerified: number, stepsXpDeclarative: number }}
 */
export function computeStepsXpFromResolved(resolved) {
  const g = resolved?.garmin ?? 0;
  const d = resolved?.declarative ?? 0;
  const stepsXpVerified = Math.round(g * 0.01);
  const stepsXpDeclarative = Math.round(d * 0.01 * DECLARATIVE_STEPS_XP_FACTOR);
  return {
    stepsXp: stepsXpVerified + stepsXpDeclarative,
    stepsXpVerified,
    stepsXpDeclarative
  };
}

/**
 * @param {Record<string, any>} raw — clés YYYY-MM-DD
 * @returns {Record<string, { steps: number, distanceKm?: number, updatedAt: string }>}
 */
export function normalizeManualDailyWalkByDate(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [dateKey, entry] of Object.entries(src)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) continue;
    const steps = clampInt(entry?.steps, 0, MANUAL_WALK_MAX_STEPS_PER_DAY);
    if (steps <= 0) continue;
    let distanceKm;
    if (entry?.distanceKm != null && String(entry.distanceKm).trim() !== '') {
      const km = Number(String(entry.distanceKm).replace(',', '.'));
      if (Number.isFinite(km) && km > 0) {
        distanceKm = Math.min(MANUAL_WALK_MAX_DISTANCE_KM, Math.round(km * 1000) / 1000);
      }
    }
    const updatedAt =
      typeof entry?.updatedAt === 'string' && entry.updatedAt ? entry.updatedAt : new Date().toISOString();
    const entryMode = entry?.entryMode === 'supplement' ? 'supplement' : undefined;
    out[dateKey] = {
      steps,
      ...(entryMode ? { entryMode } : {}),
      ...(distanceKm != null && distanceKm > 0 ? { distanceKm } : {}),
      updatedAt
    };
  }
  return out;
}

/**
 * Total de pas utilisé pour l’XP (et cohérent avec affichage calendrier) : par jour max(Garmin, saisie manuelle).
 * @param {Record<string,{steps?:number}>} dailyMetrics
 * @param {Record<string,any>} manualByDateRaw — sera normalisé
 */
export function sumMergedDailyStepsTotal(dailyMetrics, manualByDateRaw) {
  const manual = normalizeManualDailyWalkByDate(manualByDateRaw);
  const gm = dailyMetrics && typeof dailyMetrics === 'object' ? dailyMetrics : {};
  const keys = new Set([...Object.keys(gm), ...Object.keys(manual)]);
  let total = 0;
  keys.forEach((dateKey) => {
    const dm = gm[dateKey];
    const gSteps =
      dm?.steps != null && Number.isFinite(Number(dm.steps)) ? Math.max(0, Math.round(Number(dm.steps))) : 0;
    const manualEntry = manual[dateKey] || null;
    total += resolveDailySteps(gSteps, manualEntry).total;
  });
  return total;
}

export function manualDailyWalkChecksum(raw) {
  const n = normalizeManualDailyWalkByDate(raw);
  const keys = Object.keys(n).sort();
  let stepsSum = 0;
  let kmChecksum = 0;
  keys.forEach((k) => {
    stepsSum += n[k]?.steps || 0;
    if (n[k]?.distanceKm != null) {
      kmChecksum += Math.round(Number(n[k].distanceKm) * 1000);
    }
  });
  return `${keys.length}|${stepsSum}|${kmChecksum}`;
}
