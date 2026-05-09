/**
 * Saisie manuelle des pas du jour (téléphone ou autre) quand la montre n’a pas la journée.
 * Plafonds anti-abus : pas trop permissifs mais suffisants pour une journée très active réelle.
 */
export const MANUAL_WALK_MAX_STEPS_PER_DAY = 55000;
export const MANUAL_WALK_MAX_DISTANCE_KM = 90;

function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Pas effectifs pour un jour : on prend le maximum montre vs saisie (évite doublons si tu recopies la même journée). */
export function mergedDailySteps(garminSteps, manualSteps) {
  const g = Math.max(0, Math.round(Number(garminSteps) || 0));
  const m = Math.max(0, Math.round(Number(manualSteps) || 0));
  return Math.max(g, m);
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
    const mSteps = manual[dateKey]?.steps || 0;
    total += mergedDailySteps(gSteps, mSteps);
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
