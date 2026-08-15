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

/** Décompose une chaîne HH:MM:SS ou MM:SS → { hours, minutes, seconds }. */
export function splitHmsString(hms) {
  const raw = String(hms ?? '').trim();
  if (!raw.includes(':')) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const parts = raw.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    return {
      hours: Math.max(0, parts[0]),
      minutes: Math.max(0, parts[1]),
      seconds: clampSecPart(parts[2])
    };
  }
  if (parts.length === 2) {
    return { hours: 0, minutes: Math.max(0, parts[0]), seconds: clampSecPart(parts[1]) };
  }
  return { hours: 0, minutes: 0, seconds: 0 };
}

/** Formate HH:MM:SS (compatible stockage course). */
export function formatHmsString(hours, minutes, seconds) {
  const h = Math.max(0, parseInt(hours, 10) || 0);
  const m = Math.max(0, parseInt(minutes, 10) || 0);
  const sec = clampSecPart(seconds);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** HH:MM:SS → secondes totales. */
export function hmsStringToTotalSeconds(hms) {
  const { hours, minutes, seconds } = splitHmsString(hms);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Durée endurance : minutes décimales, MM:SS, HH:MM:SS ou secondes brutes (legacy).
 * @returns {number} secondes
 */
export function resolveEnduranceDurationSeconds(raw) {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw >= 1000) return Math.round(raw);
    return storedMinutesToTotalSeconds(raw);
  }
  const s = String(raw).trim();
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) return hmsStringToTotalSeconds(s);
    if (parts.length === 2) return parts[0] * 60 + clampSecPart(parts[1]);
  }
  const n = parseFloat(s.replace(',', '.'));
  if (Number.isFinite(n) && n > 0) return storedMinutesToTotalSeconds(n);
  return 0;
}
