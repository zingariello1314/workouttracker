/**
 * patternLearning.js
 *
 * Module V2 pour un "apprentissage" très léger des patterns utilisateur,
 * uniquement à partir des données déjà chargées en mémoire.
 *
 * Ce module ne stocke rien et ne touche jamais à IndexedDB.
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
 * Détecte les jours de la semaine les plus utilisés pour l’entraînement.
 * @param {Array<{date:string|Date}>} workoutHistory
 * @param {number} lookbackDays
 * @returns {Array<number>} indices 0-6 des jours dominants
 */
export function detectPreferredTrainingDays(workoutHistory, lookbackDays = 90) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
    return [];
  }

  const cutoff = (() => {
    const today = new Date();
    today.setDate(today.getDate() - lookbackDays);
    return today.getTime();
  })();

  const counts = Array(7).fill(0);

  workoutHistory.forEach((session) => {
    const normalized = normalizeDate(session.date);
    if (!normalized) return;
    const d = new Date(normalized + 'T00:00:00');
    if (d.getTime() < cutoff) return;
    const dow = d.getDay(); // 0-6
    counts[dow] += 1;
  });

  const max = Math.max(...counts);
  if (max === 0) return [];

  return counts
    .map((count, idx) => ({ idx, count }))
    .filter((e) => e.count >= max * 0.7) // Jours "préférés" ~70% du max
    .map((e) => e.idx);
}

/**
 * Détecte les créneaux horaires les plus fréquents (heure de début approximée).
 * On s’attend à ce que les sessions incluent une heure dans un champ optionnel
 * (sinon cette fonction renvoie un tableau vide sans impacter le reste).
 *
 * @param {Array<{date:string|Date,startTime?:string}>} workoutHistory
 * @param {number} lookbackDays
 * @returns {Array<{ label:string, start:string, end:string }>}
 */
export function detectPreferredTrainingHours(
  workoutHistory,
  lookbackDays = 90,
) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
    return [];
  }

  const cutoff = (() => {
    const today = new Date();
    today.setDate(today.getDate() - lookbackDays);
    return today.getTime();
  })();

  const buckets = {
    morning: 0, // 5-11
    afternoon: 0, // 12-17
    evening: 0, // 18-22
    night: 0, // 23-4
  };

  workoutHistory.forEach((session) => {
    const normalized = normalizeDate(session.date);
    if (!normalized) return;
    const d = new Date(normalized + 'T00:00:00');
    if (d.getTime() < cutoff) return;

    // Heure approximative stockée quelque part (best effort)
    const timeStr = session.startTime || session.time || null;
    if (!timeStr || typeof timeStr !== 'string') return;
    const [hStr] = timeStr.split(':');
    const h = Number.parseInt(hStr, 10);
    if (Number.isNaN(h)) return;

    if (h >= 5 && h < 12) buckets.morning += 1;
    else if (h >= 12 && h < 18) buckets.afternoon += 1;
    else if (h >= 18 && h < 23) buckets.evening += 1;
    else buckets.night += 1;
  });

  const entries = Object.entries(buckets).filter(([, v]) => v > 0);
  if (entries.length === 0) return [];

  const max = Math.max(...entries.map(([, v]) => v));
  const preferred = entries.filter(([, v]) => v >= max * 0.7);

  return preferred.map(([slot]) => {
    switch (slot) {
      case 'morning':
        return { label: 'Matin', start: '05:00', end: '11:59' };
      case 'afternoon':
        return { label: 'Après‑midi', start: '12:00', end: '17:59' };
      case 'evening':
        return { label: 'Soir', start: '18:00', end: '22:59' };
      case 'night':
      default:
        return { label: 'Nuit', start: '23:00', end: '04:59' };
    }
  });
}

/**
 * Point d’entrée générique pour "apprendre" quelques patterns simples.
 *
 * @param {Array} workoutHistory
 * @param {Object} dayJustifications
 * @returns {{ preferredDays:Array<number>, preferredHours:Array, justificationVolume:number }}
 */
export function learnUserPatterns(workoutHistory, dayJustifications) {
  const preferredDays = detectPreferredTrainingDays(workoutHistory, 90);
  const preferredHours = detectPreferredTrainingHours(workoutHistory, 90);

  const justificationVolume = dayJustifications
    ? Object.keys(dayJustifications).length
    : 0;

  return {
    preferredDays,
    preferredHours,
    justificationVolume,
  };
}



