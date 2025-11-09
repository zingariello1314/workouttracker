import {
  getTodayDateStr,
  subtractDaysFromDateStr,
  isDateValid,
  isDateBeforeOrEqual
} from '../../hooks/garminDateUtils';

const STORAGE_KEY = 'garmin:forceSync:last-range';
const MAX_SPAN_DAYS_DEFAULT = 30;
const ESTIMATED_CALLS_PER_DAY = 8;

/**
 * Calcule le nombre de jours (inclusifs) entre deux dates YYYY-MM-DD.
 * Retourne null si une des dates est invalide.
 */
export function diffDaysInclusive(start, end) {
  if (!isDateValid(start) || !isDateValid(end)) {
    return null;
  }
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Valide une plage de dates. Retourne { valid, error, spanDays }.
 */
export function validateRange(start, end, options = {}) {
  const { maxSpanDays = MAX_SPAN_DAYS_DEFAULT } = options;

  if (!start || !end) {
    return { valid: false, error: 'La plage doit contenir une date de début et de fin.' };
  }
  if (!isDateValid(start) || !isDateValid(end)) {
    return { valid: false, error: 'Format de date invalide (utiliser YYYY-MM-DD).' };
  }
  if (!isDateBeforeOrEqual(start, end)) {
    return { valid: false, error: 'La date de début doit être antérieure ou égale à la date de fin.' };
  }

  const spanDays = diffDaysInclusive(start, end);
  if (spanDays === null) {
    return { valid: false, error: 'Impossible de calculer la plage.' };
  }

  if (spanDays > maxSpanDays) {
    return {
      valid: false,
      error: `La plage maximale autorisée est de ${maxSpanDays} jours (plage demandée : ${spanDays} jours).`
    };
  }

  return { valid: true, error: null, spanDays };
}

/**
 * Génère une requête pour un preset (today, yesterday, auto).
 */
export function mapPresetToRequest(mode) {
  const today = getTodayDateStr();
  const yesterday = subtractDaysFromDateStr(today, 1);

  switch (mode) {
    case 'today':
      return {
        forceRefresh: true,
        skipDelay: true,
        mode,
        range: { start: today, end: today }
      };
    case 'yesterday':
      return {
        forceRefresh: true,
        skipDelay: true,
        mode,
        range: { start: yesterday, end: yesterday }
      };
    default:
      return {
        forceRefresh: true,
        skipDelay: true,
        mode,
        range: { start: today, end: today }
      };
  }
}

/**
 * Génère une requête à partir d'une plage personnalisée.
 */
export function mapRangeToRequest(range, includeToday = false) {
  const today = getTodayDateStr();
  const start = range?.start ?? today;
  let end = range?.end ?? start;

  if (includeToday) {
    end = today;
  }

  return {
    forceRefresh: true,
    skipDelay: true,
    mode: 'range',
    range: { start, end },
    meta: { includeToday }
  };
}

/**
 * Sauvegarde la dernière plage forcée dans sessionStorage.
 */
export function storeLastRange(range) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    // storage plein ou indisponible : ignorer
  }
}

/**
 * Restaure la dernière plage forcée depuis sessionStorage.
 */
export function restoreLastRange() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.start || !parsed.end) return null;
    if (!isDateValid(parsed.start) || !isDateValid(parsed.end)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Estime le nombre d'appels API nécessaires pour n jours.
 * Valeur basée sur les endpoints actuels (stats + steps + HR + sleep + bodyBattery + stress + spo2 + intensity).
 */
export function estimateApiCalls(spanDays, options = {}) {
  const callsPerDay = options.callsPerDay ?? ESTIMATED_CALLS_PER_DAY;
  if (!spanDays || spanDays < 1) return 0;
  return spanDays * callsPerDay;
}

/**
 * Décrit la plage (dates, span) sous forme prête à afficher.
 */
export function describeRange(range, includeToday = false, options = {}) {
  if (!range) return null;
  const today = getTodayDateStr();
  const effectiveEnd = includeToday ? today : range.end;
  const validation = validateRange(range.start, effectiveEnd, options);
  const spanDays = validation.valid ? validation.spanDays : null;

  return {
    start: range.start,
    end: effectiveEnd,
    spanDays,
    validation
  };
}



