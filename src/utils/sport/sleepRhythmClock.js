/**
 * Horloge veille-sommeil à partir des heures HH:MM déjà stockées.
 * N'invente pas de sieste, ne réécrit pas la durée Garmin, ne choisit pas
 * entre deux sources quand elles se contredisent.
 */

const MIN_NIGHT_MIN = 90;
const MAX_NIGHT_MIN = 16 * 60;
const DURATION_DISAGREE_MIN = 90;

/** @returns {number|null} minutes 0–1439 */
export function parseClockMinutes(hhmm) {
  const match = String(hhmm ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function storedDurationMinutes(durationHours) {
  const n = Number(durationHours);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 24 ? n * 60 : n;
}

/**
 * Les deux heures sont obligatoires. Si le coucher est après le lever sur
 * l'horloge, le coucher est la veille. Durée reconstruite hors 1 h 30–16 h,
 * ou à plus de 90 min de la durée stockée : nuit rejetée.
 * @returns {{ complete: true, ymd: string|null, bedMin: number, wakeMin: number, durationMin: number, midpointMin: number }|null}
 */
export function normalizeSleepClock({ ymd = null, bedTime, wakeTime, durationHours } = {}) {
  const bed = parseClockMinutes(bedTime);
  const wake = parseClockMinutes(wakeTime);
  if (bed == null || wake == null) return null;

  let bedMin = bed;
  const wakeMin = wake;
  if (bedMin > wakeMin) bedMin -= 1440;

  const durationMin = wakeMin - bedMin;
  if (durationMin < MIN_NIGHT_MIN || durationMin > MAX_NIGHT_MIN) return null;

  const stored = storedDurationMinutes(durationHours);
  if (stored != null && Math.abs(stored - durationMin) > DURATION_DISAGREE_MIN) return null;

  return {
    complete: true,
    ymd: ymd || null,
    bedMin,
    wakeMin,
    durationMin,
    midpointMin: bedMin + durationMin / 2
  };
}

/** Affichage « 3 h 12 ». Les minutes négatives (veille) reviennent sur 0–1439. */
export function formatClockFr(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return '';
  const m = ((Math.round(Number(minutes)) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h} h ${String(min).padStart(2, '0')}`;
}

/** Bande de 30 minutes sur l'horloge locale, pas la bande de part à 10 points. */
export function sleepClockBand(bedMin) {
  if (bedMin == null || !Number.isFinite(Number(bedMin))) return null;
  const norm = ((Math.round(Number(bedMin)) % 1440) + 1440) % 1440;
  return Math.floor(norm / 30) * 30;
}
