/**
 * Nuit Garmin / calendrier — source unique pour le futur moteur sommeil.
 *
 * Ne produit aucune analyse. Si une nuit n'a pas assez de champs,
 * retourne null. « Pas assez de données » n'est pas un texte à afficher.
 *
 * Alias alignés sur le calendrier (`calendarDayRecapDetail`) et l'onglet Garmin
 * (duration / deep|deepSleep / rem|remSleep / light|lightSleep, heures ou minutes).
 */

function toNum(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === 'object') {
    return toNum(v.value ?? v.avg ?? v.average ?? v.total ?? v.min ?? v.max);
  }
  return null;
}

/** Valeur Garmin : < 24 → heures, sinon minutes. */
export function garminDurationToMinutes(raw) {
  const n = toNum(raw);
  if (n == null || n <= 0) return null;
  if (n < 24) return Math.round(n * 60);
  return Math.round(n);
}

export function minutesToHours(min) {
  if (min == null || !Number.isFinite(min) || min <= 0) return null;
  return Math.round((min / 60) * 100) / 100;
}

function pickSleepObject(day) {
  if (!day || typeof day !== 'object') return null;
  if (day.sleep && typeof day.sleep === 'object') return day.sleep;
  if (day.sleepData && typeof day.sleepData === 'object') return day.sleepData;
  return null;
}

function bodyBatteryPack(day) {
  const raw = day?.bodyBattery ?? day?.bodyBatterySummary ?? null;
  if (raw == null) return { value: null, start: null, end: null, charged: null };
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { value: raw, start: null, end: raw, charged: null };
  }
  if (typeof raw !== 'object') return { value: null, start: null, end: null, charged: null };
  const start = toNum(raw.start ?? raw.chargedFrom ?? raw.low ?? raw.min);
  const end = toNum(raw.end ?? raw.chargedTo ?? raw.high ?? raw.max ?? raw.value);
  const charged =
    toNum(raw.charged ?? raw.change ?? raw.delta) ??
    (start != null && end != null ? end - start : null);
  return {
    value: end ?? toNum(raw.value),
    start,
    end,
    charged
  };
}

/**
 * Convention de rattachement F2 (source de vérité code).
 *
 * `ymd` = clé `garminData.dailyMetrics[ymd]`.
 * Commentaire produit historique : « la nuit qui se termine le matin de ymd »
 * (jour du réveil / clé journalière Garmin), **pas** le jour civil du coucher.
 * bedTime/wakeTime horaires peuvent chevaucher le jour précédent ; on ne
 * recalcule pas ymd depuis ces horaires.
 *
 * Si bedTime/wakeTime ISO absolus manquent, la convention reste celle de la clé
 * métriques — documentée comme `garmin_daily_metrics_key_wake_morning`.
 */
export const SLEEP_ATTACHMENT_CONVENTION = Object.freeze({
  id: 'garmin_daily_metrics_key_wake_morning',
  ymdMeans: 'wake_morning_of_key',
  sourceField: 'garmin.dailyMetrics[ymd]',
  certainty: 'documented_in_code',
  noteFr:
    'ymd est la clé dailyMetrics. Interprétation produit : nuit se terminant le matin de ymd. ' +
    'Pas de recalcul depuis bedTime/wakeTime.'
});

/**
 * Une nuit calendaire (la nuit qui se termine le matin de `ymd`).
 * @returns {object|null}
 */
export function extractSleepNight(garminData, ymd) {
  const day = garminData?.dailyMetrics?.[ymd];
  if (!day) return null;
  const sleep = pickSleepObject(day);
  if (!sleep) return null;

  let totalMin = garminDurationToMinutes(sleep.duration || sleep.totalSleep || sleep.totalMinutes);
  if (totalMin == null) {
    const sec = toNum(sleep.sleepTimeSeconds ?? sleep.sleepTime);
    if (sec != null && sec >= 90 * 60 && sec <= 16 * 3600) {
      totalMin = Math.round(sec / 60);
    }
  }
  const deepMin = garminDurationToMinutes(sleep.deepSleep ?? sleep.deep);
  const lightMin = garminDurationToMinutes(sleep.lightSleep ?? sleep.light);
  const remMin = garminDurationToMinutes(sleep.remSleep ?? sleep.rem);
  const awakeMin = garminDurationToMinutes(sleep.awake ?? sleep.awakeSleep ?? sleep.awakeningsDuration);

  if (totalMin == null) {
    const sum = (deepMin || 0) + (lightMin || 0) + (remMin || 0) + (awakeMin || 0);
    if (sum > 0) totalMin = sum;
  }
  if (totalMin == null || totalMin < 90) return null;

  const hours = minutesToHours(totalMin);
  const efficiencyRaw = toNum(
    sleep.efficiency ?? sleep.sleepEfficiency ?? sleep.quality ?? sleep.score
  );
  const efficiency =
    efficiencyRaw != null && efficiencyRaw > 0 && efficiencyRaw <= 100 ? efficiencyRaw : null;

  const hr = day.heartRate || {};
  const sleepHr = toNum(
    sleep.avgHR ?? sleep.averageHeartRate ?? sleep.avgHeartRate ?? sleep.averageHR ?? sleep.heartRate
  );
  const rhr = toNum(
    hr.resting ?? day.restingHeartRate ?? day.restingHR ?? sleep.restingHeartRate
  );
  const hrv = toNum(
    sleep.hrv ?? sleep.avgHrv ?? day.hrv ?? day.hrvAverage ?? day.lastNightHrv
  );
  const bb = bodyBatteryPack(day);

  return {
    ymd,
    hours,
    totalMin,
    deepMin,
    lightMin,
    remMin,
    awakeMin,
    efficiency,
    bedTime: sleep.bedTime ?? sleep.startTime ?? sleep.sleepStart ?? null,
    wakeTime: sleep.wakeTime ?? sleep.endTime ?? sleep.sleepEnd ?? null,
    sleepHr,
    rhr,
    hrv,
    bodyBattery: bb.value,
    bodyBatteryStart: bb.start,
    bodyBatteryEnd: bb.end,
    bodyBatteryCharged: bb.charged,
    quality: toNum(sleep.quality ?? sleep.score),
    source: 'garmin.dailyMetrics',
    attachment: { ...SLEEP_ATTACHMENT_CONVENTION, ymd }
  };
}

/**
 * Rôle de publication d’une nuit vs fenêtre primaire sélectionnée.
 * @returns {{ role: 'primary_observation'|'historical_reference'|'out_of_scope', inPrimary: boolean }}
 */
export function classifySleepNightWindowRole(nightYmd, primaryWindow) {
  const ymd = nightYmd || null;
  if (!ymd || !primaryWindow?.end) {
    return { role: 'out_of_scope', inPrimary: false };
  }
  const start = primaryWindow.start;
  const end = primaryWindow.end;
  const inPrimary =
    start == null ? ymd <= end : ymd >= start && ymd <= end;
  if (inPrimary) return { role: 'primary_observation', inPrimary: true };
  return { role: 'historical_reference', inPrimary: false };
}

/**
 * Contrat de preuve sommeil minimal pour publication période.
 * Une nuit hors fenêtre ne peut pas être `primary_observation`.
 */
export function buildSleepNightProofFields(night, primaryWindow, { roleOverride = null } = {}) {
  if (!night?.ymd) return null;
  const classified = classifySleepNightWindowRole(night.ymd, primaryWindow);
  const role = roleOverride || classified.role;
  return {
    nightYmd: night.ymd,
    source: night.source || 'garmin.dailyMetrics',
    attachment: night.attachment || { ...SLEEP_ATTACHMENT_CONVENTION, ymd: night.ymd },
    primaryWindow: primaryWindow
      ? { start: primaryWindow.start ?? null, end: primaryWindow.end }
      : null,
    role,
    inPrimary: classified.inPrimary,
    indicators: {
      hours: night.hours ?? null,
      efficiency: night.efficiency ?? null,
      deepMin: night.deepMin ?? null,
      remMin: night.remMin ?? null
    },
    publishAsPeriodObservation: role === 'primary_observation' && classified.inPrimary
  };
}

/**
 * Toutes les nuits d'une fenêtre inclusive. Les dates sans sommeil sont omises
 * (pas de placeholder « insuffisant »).
 */
export function extractSleepNightsInWindow(garminData, startYmd, endYmd) {
  const dm = garminData?.dailyMetrics;
  if (!dm || !startYmd || !endYmd) return [];
  return Object.keys(dm)
    .filter((ymd) => ymd >= startYmd && ymd <= endYmd)
    .sort()
    .map((ymd) => extractSleepNight(garminData, ymd))
    .filter(Boolean);
}

export function sleepNightIsInformative(night) {
  return Boolean(night && night.hours != null && night.hours >= 1.5);
}

function addYmd(ymd, delta) {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Nuits réellement présentes, en remontant depuis `endYmd`.
 * Les jours sans sommeil sont sautés — pas de placeholder.
 */
export function extractRecentSleepNights(garminData, endYmd, count = 7, lookbackDays = 28) {
  if (!endYmd || !garminData?.dailyMetrics) return [];
  const nights = [];
  for (let i = 0; i < lookbackDays && nights.length < count; i += 1) {
    const ymd = addYmd(endYmd, -i);
    if (!ymd) break;
    const night = extractSleepNight(garminData, ymd);
    if (night) nights.push(night);
  }
  return nights;
}
