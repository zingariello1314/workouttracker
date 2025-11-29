/**
 * cycleDetection.js
 *
 * Module V2 léger pour la détection de cycles simples
 * dans l’entraînement et les justifications.
 *
 * Objectifs :
 * - Ne PAS refaire de grosses analyses côté client
 * - Fournir une première approximation utile pour l’IA
 * - Rester purement dérivé (pas d’accès base de données)
 */

import { DateHelper } from '../dateHelper';

function normalizeDate(input) {
  if (!input) return null;
  try {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return DateHelper.toYYYYMMDD(d);
  } catch {
    return null;
  }
}

/**
 * Détecte des cycles d’entraînement de type 3 semaines ON / 1 semaine OFF.
 *
 * Heuristique très simple :
 * - On regarde la fréquence de séances par semaine
 * - On cherche des motifs [haut, haut, haut, bas] répétés
 *
 * @param {Array<{date:string|Date}>} workoutHistory
 * @returns {{ pattern:'3on1off'|'none', occurrences:number, weeks:Array }|null}
 */
export function detectTrainingCycles(workoutHistory) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length < 8) return null;

  // Agrégation par semaine (clé : YYYY-Wxx)
  const weeks = {};
  workoutHistory.forEach((session) => {
    const normalized = normalizeDate(session.date);
    if (!normalized) return;
    const d = new Date(normalized + 'T00:00:00');
    const year = d.getFullYear();
    // Approximation "semaine" suffisante pour notre heuristique
    const week = Math.ceil((d.getDate() + d.getDay()) / 7);
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    weeks[key] = (weeks[key] || 0) + 1;
  });

  const orderedWeeks = Object.entries(weeks)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, count]) => ({ key, count }));

  if (orderedWeeks.length < 4) return null;

  const thresholdHigh =
    orderedWeeks.reduce((sum, w) => sum + w.count, 0) /
    orderedWeeks.length;

  let occurrences = 0;
  const matchedWindows = [];

  for (let i = 0; i <= orderedWeeks.length - 4; i++) {
    const slice = orderedWeeks.slice(i, i + 4);
    const [w1, w2, w3, w4] = slice;
    const isHigh = (w) => w.count >= thresholdHigh;
    const isLow = (w) => w.count < thresholdHigh * 0.6;

    if (isHigh(w1) && isHigh(w2) && isHigh(w3) && isLow(w4)) {
      occurrences += 1;
      matchedWindows.push(slice.map((w) => w.key));
    }
  }

  if (occurrences === 0) {
    return {
      pattern: 'none',
      occurrences: 0,
      weeks: [],
    };
  }

  return {
    pattern: '3on1off',
    occurrences,
    weeks: matchedWindows,
  };
}

/**
 * Détecte des cycles de justifications (ex : pics récurrents après périodes intenses).
 *
 * Ici V2 reste volontairement simple : on regroupe par semaine et on regarde
 * les semaines avec un nombre de justifications bien supérieur à la moyenne.
 *
 * @param {Object<string,{reason:string}>} dayJustifications
 * @returns {{ highWeeks:Array<{week:string,count:number}>, average:number }|null}
 */
export function detectJustificationCycles(dayJustifications) {
  if (
    !dayJustifications ||
    typeof dayJustifications !== 'object' ||
    Object.keys(dayJustifications).length === 0
  ) {
    return null;
  }

  const weeks = {};

  Object.entries(dayJustifications).forEach(([dateStr]) => {
    const normalized = normalizeDate(dateStr);
    if (!normalized) return;
    const d = new Date(normalized + 'T00:00:00');
    const year = d.getFullYear();
    const week = Math.ceil((d.getDate() + d.getDay()) / 7);
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    weeks[key] = (weeks[key] || 0) + 1;
  });

  const entries = Object.entries(weeks).map(([key, count]) => ({
    week: key,
    count,
  }));

  if (entries.length === 0) return null;

  const avg =
    entries.reduce((sum, w) => sum + w.count, 0) / entries.length;

  const highWeeks = entries.filter((w) => w.count >= avg * 1.5);

  return {
    highWeeks,
    average: Math.round(avg * 10) / 10,
  };
}



