/**
 * Fusion Garmin pour Recap Analyse.
 *
 * Le moteur sommeil lit uniquement garminData.dailyMetrics (extractSleepNight).
 * L’UI Recap charge souvent les nuits via loadDataByRange (garminPartial),
 * pendant que loadAllData() (bundle) peut être null ou incomplet.
 *
 * Union des dates. Sur une date commune, le partial prêt écrase les champs
 * qu’il apporte, sans jeter une nuit du bundle si le partial n’en a pas.
 */

function isUsablePartial(partial) {
  if (!partial || typeof partial !== 'object') return false;
  if (partial.status === 'loading' || partial.status === 'skipped') return false;
  return true;
}

function hasSleepPayload(day) {
  if (!day || typeof day !== 'object') return false;
  const sleep = day.sleep || day.sleepData;
  if (!sleep || typeof sleep !== 'object') return false;
  return (
    sleep.duration != null ||
    sleep.totalSleep != null ||
    sleep.totalMinutes != null ||
    sleep.deep != null ||
    sleep.deepSleep != null ||
    sleep.rem != null ||
    sleep.remSleep != null ||
    sleep.light != null ||
    sleep.lightSleep != null
  );
}

function mergeDayMetrics(base, overlay) {
  if (!overlay) return base || null;
  if (!base) return overlay;
  const merged = { ...base, ...overlay };
  if (hasSleepPayload(overlay)) {
    merged.sleep = overlay.sleep || overlay.sleepData;
  } else if (hasSleepPayload(base)) {
    merged.sleep = base.sleep || base.sleepData;
  }
  const overlayBb = overlay.bodyBattery ?? overlay.bodyBatterySummary;
  const baseBb = base.bodyBattery ?? base.bodyBatterySummary;
  if (overlayBb != null) merged.bodyBattery = overlay.bodyBattery ?? overlay.bodyBatterySummary;
  else if (baseBb != null) merged.bodyBattery = base.bodyBattery ?? base.bodyBatterySummary;
  return merged;
}

function mergeDailyMaps(...maps) {
  const out = {};
  maps.forEach((map) => {
    if (!map || typeof map !== 'object') return;
    Object.keys(map).forEach((ymd) => {
      const day = map[ymd];
      if (!day || typeof day !== 'object') return;
      out[ymd] = mergeDayMetrics(out[ymd], day);
    });
  });
  return out;
}

function activityKey(act) {
  if (!act || typeof act !== 'object') return '';
  return String(
    act.activityId ??
      act.id ??
      `${act.date || ''}-${act.activityType || ''}-${act.duration ?? act.movingDuration ?? ''}`
  );
}

function mergeActivityBuckets(base = {}, overlay = {}) {
  const keys = new Set([...Object.keys(base || {}), ...Object.keys(overlay || {})]);
  const out = {};
  keys.forEach((bucket) => {
    const left = Array.isArray(base?.[bucket]) ? base[bucket] : [];
    const right = Array.isArray(overlay?.[bucket]) ? overlay[bucket] : [];
    const seen = new Set();
    const list = [];
    [...left, ...right].forEach((act) => {
      const id = activityKey(act);
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push(act);
    });
    out[bucket] = list;
  });
  return out;
}

/**
 * @param {object|null} garminData — bundle loadAllData()
 * @param {object|null} garminPartial — hook Recap (souvent status ready + dailyMetrics fenêtre)
 * @param {object|null} garminDailyMetrics — dailyMetrics déjà extraits du partial
 * @returns {object|null}
 */
export function mergeGarminDataForRecap(garminData = null, garminPartial = null, garminDailyMetrics = null) {
  const bundle = garminData && typeof garminData === 'object' ? garminData : null;
  const partial = isUsablePartial(garminPartial) ? garminPartial : null;
  const extraDm =
    garminDailyMetrics && typeof garminDailyMetrics === 'object' ? garminDailyMetrics : null;

  if (!bundle && !partial && !extraDm) return null;

  const dailyMetrics = mergeDailyMaps(bundle?.dailyMetrics, extraDm, partial?.dailyMetrics);
  const activities = mergeActivityBuckets(bundle?.activities, partial?.activities);

  return {
    ...(bundle || {}),
    dailyMetrics,
    activities
  };
}
