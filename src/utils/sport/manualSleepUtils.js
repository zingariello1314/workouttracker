/**
 * Overrides manuels du sommeil (calendrier Sport) :
 * horaires corrigés + phases physiologiques neutralisées.
 */

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseHmToMinutes(hm) {
  if (!hm || typeof hm !== 'string') return null;
  const m = hm.trim().match(TIME_RE);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Durée en heures entre coucher et lever (peut traverser minuit). */
export function sleepDurationHoursFromTimes(bedTime, wakeTime) {
  const a = parseHmToMinutes(bedTime);
  const b = parseHmToMinutes(wakeTime);
  if (a == null || b == null) return null;
  let diff = b - a;
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function normalizeManualSleepEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const bedTime = typeof raw.bedTime === 'string' && TIME_RE.test(raw.bedTime.trim()) ? raw.bedTime.trim() : null;
  const wakeTime =
    typeof raw.wakeTime === 'string' && TIME_RE.test(raw.wakeTime.trim()) ? raw.wakeTime.trim() : null;
  const sleepStart =
    typeof raw.sleepStart === 'string' && TIME_RE.test(raw.sleepStart.trim())
      ? raw.sleepStart.trim()
      : null;
  const sleepEnd =
    typeof raw.sleepEnd === 'string' && TIME_RE.test(raw.sleepEnd.trim()) ? raw.sleepEnd.trim() : null;
  if (!bedTime && !wakeTime && !sleepStart && !sleepEnd) return null;
  const durationHours =
    raw.durationHours != null && Number.isFinite(Number(raw.durationHours))
      ? Math.min(24, Math.max(0, Number(raw.durationHours)))
      : sleepDurationHoursFromTimes(bedTime || sleepStart, wakeTime || sleepEnd);
  return {
    bedTime,
    wakeTime,
    sleepStart,
    sleepEnd,
    durationHours: durationHours ?? null,
    phasesNeutralized: true,
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
  };
}

export function normalizeManualSleepByDate(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [dateKey, entry] of Object.entries(src)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) continue;
    const n = normalizeManualSleepEntry(entry);
    if (n) out[dateKey] = n;
  }
  return out;
}

/**
 * Fusionne Garmin + override manuel. Les phases sont null si manuel.
 * @returns {object|null}
 */
export function resolveDaySleep(garminData, dateStr, manualSleepByDate) {
  const garmin = garminData?.dailyMetrics?.[dateStr]?.sleep || null;
  const manualMap = normalizeManualSleepByDate(manualSleepByDate);
  const manual = dateStr ? manualMap[dateStr] : null;
  if (!manual && !garmin) return null;
  if (!manual) return garmin;

  return {
    ...(garmin && typeof garmin === 'object' ? garmin : {}),
    bedTime: manual.bedTime || garmin?.bedTime || null,
    wakeTime: manual.wakeTime || garmin?.wakeTime || null,
    startTime: manual.sleepStart || manual.bedTime || garmin?.startTime || null,
    endTime: manual.sleepEnd || manual.wakeTime || garmin?.endTime || null,
    duration: manual.durationHours != null ? manual.durationHours : garmin?.duration,
    deepSleep: null,
    lightSleep: null,
    remSleep: null,
    awake: null,
    deep: null,
    light: null,
    rem: null,
    quality: null,
    score: null,
    avgHR: null,
    averageHeartRate: null,
    _manualOverride: true,
    _phasesUnavailable: true,
  };
}
