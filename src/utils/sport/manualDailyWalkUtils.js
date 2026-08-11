/**
 * Saisie manuelle des pas du jour (téléphone ou autre) quand la montre n’a pas la journée.
 * Garmin = source prioritaire ; le manuel ne remplace que l’absence de données montre.
 */
export const MANUAL_WALK_MAX_STEPS_PER_DAY = 55000;
export const MANUAL_WALK_MAX_DISTANCE_KM = 90;
/** @deprecated Conservé pour données legacy — ignoré par resolveDailySteps. */
export const MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY = 25000;

export const STEPS_XP_RATE_VERIFIED = 0.0042;
/** 50 % du taux montre — jours sans Garmin exploitable. */
export const STEPS_XP_RATE_DECLARATIVE = 0.0021;
export const STEPS_XP_DAILY_CAP = 100;

/** @typedef {'verified' | 'mixed' | 'self_reported'} StepsReliability */

/**
 * @typedef {object} ResolvedDailySteps
 * @property {number} garmin — pas montre (source fiable)
 * @property {number} declarative — pas saisis manuellement (affichage ; non additionnés si Garmin > 0)
 * @property {number} total — pas comptabilisés (XP, trophées, calendrier)
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

function parseManualEntry(manualInput) {
  if (manualInput == null) return null;
  if (typeof manualInput === 'object' && !Array.isArray(manualInput)) {
    return manualInput;
  }
  const m = Math.max(0, Math.round(Number(manualInput) || 0));
  return m > 0 ? { steps: m } : null;
}

/**
 * Résolveur central — pas du jour par source.
 * Garmin prioritaire ; le manuel ne s’additionne pas à une journée déjà couverte par la montre.
 * @param {number} garminSteps
 * @param {number | { steps?: number, entryMode?: 'total' | 'supplement' } | null | undefined} manualInput
 * @returns {ResolvedDailySteps}
 */
export function resolveDailySteps(garminSteps, manualInput) {
  const g = normalizeGarminSteps(garminSteps);
  const manualEntry = parseManualEntry(manualInput);

  if (!manualEntry?.steps || manualEntry.steps <= 0) {
    return { garmin: g, declarative: 0, total: g, reliability: 'verified' };
  }

  const declarative = clampInt(manualEntry.steps, 0, MANUAL_WALK_MAX_STEPS_PER_DAY);

  if (g > 0) {
    return { garmin: g, declarative, total: g, reliability: 'mixed' };
  }

  return { garmin: 0, declarative, total: declarative, reliability: 'self_reported' };
}

/** Pas effectifs pour un jour — préférer resolveDailySteps pour le détail source. */
export function mergedDailySteps(garminSteps, manualSteps) {
  return resolveDailySteps(garminSteps, manualSteps).total;
}

/**
 * XP pas : montre 0,0042 XP/pas, manuel 0,0021 XP/pas (plafond 100/j chacun).
 * Si Garmin et manuel coexistent, seule la part Garmin génère de l’XP.
 * @param {ResolvedDailySteps} resolved
 * @returns {{ stepsXp: number, stepsXpVerified: number, stepsXpDeclarative: number }}
 */
export function computeStepsXpFromResolved(resolved) {
  const reliability = resolved?.reliability ?? 'verified';
  const g = resolved?.garmin ?? 0;

  if (reliability === 'self_reported') {
    const d = resolved?.total ?? resolved?.declarative ?? 0;
    const stepsXpDeclarative = Math.min(
      STEPS_XP_DAILY_CAP,
      Math.round(d * STEPS_XP_RATE_DECLARATIVE)
    );
    return { stepsXp: stepsXpDeclarative, stepsXpVerified: 0, stepsXpDeclarative };
  }

  const stepsXpVerified = Math.min(STEPS_XP_DAILY_CAP, Math.round(g * STEPS_XP_RATE_VERIFIED));
  return { stepsXp: stepsXpVerified, stepsXpVerified, stepsXpDeclarative: 0 };
}

/**
 * Libellés d’affichage pour la provenance des pas (calendrier, endurance, récap).
 * @param {ResolvedDailySteps | null | undefined} resolved
 * @param {(key: string, defaultValue: string, vars?: object) => string} [t]
 */
export function formatStepsProvenance(resolved, t) {
  const tr = typeof t === 'function' ? t : (_k, d) => d;
  const r = resolved?.reliability ?? 'verified';
  const garmin = resolved?.garmin ?? 0;
  const declarative = resolved?.declarative ?? 0;
  const total = resolved?.total ?? 0;

  if (r === 'self_reported' && total > 0) {
    return {
      badge: '✏️',
      label: tr('endurance.stepsProvenance.declared', 'Déclarés manuellement'),
      detail: null
    };
  }

  if (r === 'mixed' && garmin > 0) {
    return {
      badge: '🟢',
      label: tr('endurance.stepsProvenance.verifiedGarmin', 'Vérifiés par Garmin'),
      detail: declarative > 0
        ? tr('endurance.stepsProvenance.manualNotCounted', {
            count: declarative,
            defaultValue: `✏️ +${declarative.toLocaleString('fr-FR')} déclarés manuellement (non comptés)`
          })
        : null
    };
  }

  if (garmin > 0) {
    return {
      badge: '🟢',
      label: tr('endurance.stepsProvenance.verifiedGarmin', 'Vérifiés par Garmin'),
      detail: null
    };
  }

  return { badge: null, label: null, detail: null };
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
    out[dateKey] = {
      steps,
      ...(distanceKm != null && distanceKm > 0 ? { distanceKm } : {}),
      updatedAt
    };
  }
  return out;
}

/**
 * Total de pas comptabilisés (Garmin prioritaire, manuel en fallback).
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
