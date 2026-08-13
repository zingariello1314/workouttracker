/**
 * Valeurs temps stockées dans reps[key] :
 * - unité « min » → minutes décimales (40.5 = 40 min 30 s)
 * - unité « sec » → secondes décimales (45.25 = 45 s 25 cs)
 */

export function clampInt(raw, min, max) {
  const n = parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** minutes décimales → { primary: min, secondary: sec } */
export function splitStoredMinutes(stored) {
  const n = Math.max(0, Number(stored) || 0);
  const primary = Math.floor(n);
  const secondary = Math.round((n - primary) * 60);
  if (secondary >= 60) {
    return { primary: primary + 1, secondary: 0 };
  }
  return { primary, secondary };
}

/** secondes décimales → { primary: sec, secondary: centiseconds } */
export function splitStoredSeconds(stored) {
  const n = Math.max(0, Number(stored) || 0);
  const primary = Math.floor(n);
  const secondary = Math.round((n - primary) * 100);
  if (secondary >= 100) {
    return { primary: primary + 1, secondary: 0 };
  }
  return { primary, secondary };
}

export function combineMinutesParts(minutes, seconds) {
  const m = clampInt(minutes, 0, 9999);
  const s = clampInt(seconds, 0, 59);
  return Math.round((m + s / 60) * 1000) / 1000;
}

export function combineSecondsParts(seconds, centiseconds) {
  const s = clampInt(seconds, 0, 99999);
  const cs = clampInt(centiseconds, 0, 99);
  return Math.round((s + cs / 100) * 100) / 100;
}

/** Total secondes pour comparaison / XP (unité min ou sec). */
export function storedTimeToTotalSeconds(stored, unit) {
  const n = Math.max(0, Number(stored) || 0);
  if (unit === 'min') return Math.round(n * 60);
  return n;
}

/** Affichage « 40 min 30 s » ou « 45 s 25 cs » */
export function formatStoredTimeLabel(stored, unit) {
  const n = Number(stored);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (unit === 'min') {
    const { primary, secondary } = splitStoredMinutes(n);
    if (secondary === 0) return `${primary} min`;
    return `${primary} min ${secondary} s`;
  }
  const { primary, secondary } = splitStoredSeconds(n);
  if (secondary === 0) return `${primary} s`;
  return `${primary} s ${String(secondary).padStart(2, '0')} cs`;
}

/** Minutes totales arrondies pour la barre XP */
export function storedTimeToDisplayMinutes(stored, unit) {
  return storedTimeToTotalSeconds(stored, unit) / 60;
}
