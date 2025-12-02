/**
 * seasonalAnalysis.js
 *
 * Module V2 léger pour l’analyse saisonnière / mensuelle des données.
 *
 * Objectifs :
 * - Rester purement dérivé (aucun accès IndexedDB, aucune I/O)
 * - Travailler sur des tableaux déjà agrégés (dates + valeurs)
 * - Fournir une vue simple mais exploitable des tendances par mois / saison
 *
 * Les fonctions ici sont génériques pour pouvoir être réutilisées avec :
 * - l’historique d’entraînement
 * - les justifications
 * - les métriques Garmin / Nutrition / Body Tracking
 */

/**
 * Normalise une date en YYYY-MM-DD.
 * @param {string|Date} input
 * @returns {string|null}
 */
function normalizeDate(input) {
  if (!input) return null;
  try {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Retourne un libellé simple de mois.
 * @param {number} monthIndex 0-11
 * @returns {string}
 */
function getMonthLabel(monthIndex) {
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return months[monthIndex] || 'inconnu';
}

/**
 * Construit une agrégation mensuelle à partir d’un tableau d’événements.
 *
 * @param {Array<{date:string|Date, value?:number}>} items
 * @returns {Object<string,{ year:number, month:number, count:number, sum:number, avg:number }>}
 */
export function buildMonthlyAggregation(items) {
  if (!Array.isArray(items) || items.length === 0) return {};

  const perMonth = {};

  for (const item of items) {
    const normalized = normalizeDate(item.date);
    if (!normalized) continue;
    const d = new Date(normalized + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;

    if (!perMonth[key]) {
      perMonth[key] = {
        year,
        month,
        label: getMonthLabel(month),
        count: 0,
        sum: 0,
      };
    }

    perMonth[key].count += 1;
    const numericValue =
      typeof item.value === 'number' && Number.isFinite(item.value)
        ? item.value
        : 1;
    perMonth[key].sum += numericValue;
  }

  // Calcul des moyennes
  Object.values(perMonth).forEach((entry) => {
    entry.avg =
      entry.count > 0 ? Math.round((entry.sum / entry.count) * 10) / 10 : 0;
  });

  return perMonth;
}

/**
 * Détecte des tendances simples (hausse/baisse) entre les premiers et derniers mois.
 *
 * @param {Object<string,{count:number,avg:number}>} monthlyAggregation
 * @returns {{ direction:'up'|'down'|'stable', percentChange:number }|null}
 */
export function detectSeasonalTrend(monthlyAggregation) {
  const keys = Object.keys(monthlyAggregation).sort();
  if (keys.length < 2) return null;

  const first = monthlyAggregation[keys[0]];
  const last = monthlyAggregation[keys[keys.length - 1]];

  const base = first.avg ?? first.count;
  const current = last.avg ?? last.count;
  if (!base || !current) return null;

  const diff = current - base;
  const percent = (diff / base) * 100;
  let direction = 'stable';
  if (percent > 5) direction = 'up';
  else if (percent < -5) direction = 'down';

  return {
    direction,
    percentChange: Math.round(percent * 10) / 10,
  };
}

/**
 * Résume l’agrégation saisonnière pour l’UI (top mois, mois faibles, trend).
 *
 * @param {Object<string,{label:string,count:number,avg:number}>} monthlyAggregation
 * @returns {{ topMonths:Array, lowMonths:Array, trend:object|null }}
 */
export function summarizeSeasonality(monthlyAggregation) {
  const entries = Object.entries(monthlyAggregation);
  if (entries.length === 0) {
    return { topMonths: [], lowMonths: [], trend: null };
  }

  const sortedByCount = [...entries].sort(
    (a, b) => b[1].count - a[1].count,
  );

  const topMonths = sortedByCount.slice(0, 3).map(([key, val]) => ({
    key,
    label: val.label,
    count: val.count,
    avg: val.avg,
  }));

  const lowMonths = sortedByCount
    .slice(-3)
    .reverse()
    .map(([key, val]) => ({
      key,
      label: val.label,
      count: val.count,
      avg: val.avg,
    }));

  const trend = detectSeasonalTrend(monthlyAggregation);

  return { topMonths, lowMonths, trend };
}





