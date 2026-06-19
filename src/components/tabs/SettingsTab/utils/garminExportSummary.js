/**
 * Résumés Garmin pour export Sport complet et aperçu UI.
 * @module components/tabs/SettingsTab/utils/garminExportSummary
 */

/** @param {string|undefined} dateVal */
function toYmd(dateVal) {
  if (!dateVal) return null;
  const s = String(dateVal);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** @param {object} act */
export function summarizeGarminActivity(act) {
  if (!act || typeof act !== 'object') return null;
  return {
    id: act.id ?? null,
    activityType: act.activityType || act.type || 'cardio',
    date: act.date ?? null,
    duration: act.duration ?? null,
    distance: act.distance ?? null,
    calories: act.calories?.total ?? act.calories ?? null,
    avgHR: act.avgHR ?? act.averageHR ?? null,
    maxHR: act.maxHR ?? null,
    minHR: act.minHR ?? null,
    sweatLoss: act.sweatLoss ?? null,
    intensityMinutes: act.intensityMinutes ?? null,
    elevation: act.elevation ?? null,
    running: act.running
      ? {
          lapCount: act.running.lapCount ?? null,
          laps: Array.isArray(act.running.laps) ? act.running.laps.length : 0
        }
      : null
  };
}

/** @param {object} m */
export function summarizeGarminDailyMetrics(m) {
  if (!m || typeof m !== 'object') return null;
  return {
    steps: m.steps ?? null,
    distance: m.distance ?? null,
    floors: m.floors ?? null,
    calories: m.calories ?? null,
    heartRate: m.heartRate
      ? {
          resting: m.heartRate.resting ?? null,
          max: m.heartRate.max ?? null,
          avg: m.heartRate.avg ?? m.heartRate.average ?? null
        }
      : null,
    bodyBattery: m.bodyBattery?.current ?? m.bodyBattery ?? null,
    stress: m.stress ? { average: m.stress.average, max: m.stress.max } : null,
    respiration: m.respiration ?? null,
    sleep: m.sleep
      ? {
          duration: m.sleep.duration ?? null,
          quality: m.sleep.quality ?? null,
          deepSleep: m.sleep.deepSleep ?? null,
          remSleep: m.sleep.remSleep ?? null
        }
      : null,
    intensityMinutes: m.intensityMinutes ?? null,
    spo2: m.spo2 ?? null
  };
}

/**
 * Index jour par jour : métriques + activités regroupées.
 * @param {object|null} garminData
 */
export function buildGarminDailyIndex(garminData) {
  const activities = garminData?.activities || {};
  const dailyMetrics = garminData?.dailyMetrics || {};
  const byDate = {};

  const ensure = (dateStr) => {
    if (!byDate[dateStr]) {
      byDate[dateStr] = {
        date: dateStr,
        metrics: null,
        activities: { swimming: [], jumpRope: [], cardio: [] },
        activityCount: 0
      };
    }
    return byDate[dateStr];
  };

  for (const [type, list] of Object.entries(activities)) {
    if (!Array.isArray(list)) continue;
    const bucket = type === 'jumpRope' ? 'jumpRope' : type;
    for (const act of list) {
      const dateStr = toYmd(act.date || act.startTimeLocal || act.startTimeGMT);
      if (!dateStr) continue;
      const day = ensure(dateStr);
      const summary = summarizeGarminActivity(act);
      if (summary && day.activities[bucket]) {
        day.activities[bucket].push(summary);
        day.activityCount += 1;
      }
    }
  }

  for (const [dateStr, metrics] of Object.entries(dailyMetrics)) {
    const day = ensure(dateStr);
    day.metrics = summarizeGarminDailyMetrics(metrics);
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compteurs globaux + répartition par type de course/activité.
 * @param {object|null} garminData
 */
export function buildGarminExportSummary(garminData) {
  if (!garminData) {
    return {
      swimming: 0,
      jumpRope: 0,
      cardio: 0,
      totalActivities: 0,
      dailyMetricsDays: 0,
      activityTypes: {},
      dateRange: { earliest: null, latest: null }
    };
  }

  const acts = garminData.activities || {};
  const swimming = (acts.swimming || []).length;
  const jumpRope = (acts.jumpRope || []).length;
  const cardioList = acts.cardio || [];
  const cardio = cardioList.length;

  const activityTypes = {};
  for (const act of cardioList) {
    const t = act.activityType || act.type || 'cardio';
    activityTypes[t] = (activityTypes[t] || 0) + 1;
  }
  for (const act of acts.swimming || []) {
    activityTypes.swimming = (activityTypes.swimming || 0) + 1;
  }
  for (const act of acts.jumpRope || []) {
    activityTypes.jumpRope = (activityTypes.jumpRope || 0) + 1;
  }

  const metricDates = Object.keys(garminData.dailyMetrics || {}).sort();
  const activityDates = buildGarminDailyIndex(garminData).map((d) => d.date);
  const allDates = [...new Set([...metricDates, ...activityDates])].sort();

  return {
    swimming,
    jumpRope,
    cardio,
    totalActivities: swimming + jumpRope + cardio,
    dailyMetricsDays: metricDates.length,
    activityTypes,
    dateRange: {
      earliest: allDates[0] || null,
      latest: allDates[allDates.length - 1] || null
    }
  };
}
