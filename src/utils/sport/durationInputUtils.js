/**
 * Saisie durée min + sec (défis endurance, gainage…).
 * Stockage legacy : secondes entières ou minutes décimales selon le champ.
 */

export function clampSecPart(seconds) {
  const s = parseInt(seconds, 10);
  if (!Number.isFinite(s) || s < 0) return 0;
  return Math.min(59, s);
}

export function parseMinSecPart(minutes, seconds) {
  const m = parseInt(minutes, 10);
  const safeM = Number.isFinite(m) && m >= 0 ? m : 0;
  return safeM * 60 + clampSecPart(seconds);
}

/** Décompose un total en secondes → { minutes, seconds }. */
export function splitTotalSeconds(totalSeconds) {
  const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return {
    minutes: Math.floor(total / 60),
    seconds: total % 60
  };
}

/** Minutes décimales (ex. 1.5) → parties min / sec pour affichage. */
export function splitStoredMinutes(storedMinutes) {
  return splitTotalSeconds(Math.round((Number(storedMinutes) || 0) * 60));
}

/** Total secondes → minutes décimales (2 décimales max). */
export function totalSecondsToStoredMinutes(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return Math.round((sec / 60) * 100) / 100;
}

/** Minutes décimales → secondes entières. */
export function storedMinutesToTotalSeconds(storedMinutes) {
  return Math.round((Number(storedMinutes) || 0) * 60);
}

/** Libellé lisible « 2 min 30 s ». */
export function formatMinSecLabel(totalSeconds, emptyLabel = '—') {
  const { minutes, seconds } = splitTotalSeconds(totalSeconds);
  if (minutes === 0 && seconds === 0) return emptyLabel;
  if (minutes === 0) return `${seconds} s`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} s`;
}
