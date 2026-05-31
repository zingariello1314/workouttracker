/**
 * Métabolisme basal (BMR) — formule Mifflin–St Jeor (1990).
 * @see https://en.wikipedia.org/wiki/Basal_metabolic_rate
 */

/**
 * @param {{ weightKg?: number|string, heightCm?: number|string, ageYears?: number|string, sex?: 'male'|'female'|'other'|string|null }} input
 * @returns {number|null} kcal/jour (BMR pur, sans facteur d'activité)
 */
export function mifflinStJeorBmr(input = {}) {
  const w = Number(input.weightKg);
  const h = Number(input.heightCm);
  const a = Number(input.ageYears);
  if (!Number.isFinite(w) || w <= 0) return null;
  if (!Number.isFinite(h) || h < 100 || h > 250) return null;
  if (!Number.isFinite(a) || a < 10 || a > 120) return null;

  const base = 10 * w + 6.25 * h - 5 * a;
  const sex = normalizeSexForBmr(input.sex);
  if (sex === 'female') return Math.round(base - 161);
  if (sex === 'male') return Math.round(base + 5);
  return Math.round(base - 78);
}

/**
 * @param {object} input
 */
export function canComputeMifflinStJeor(input = {}) {
  return mifflinStJeorBmr(input) != null;
}

/**
 * @param {'male'|'female'|'other'|string|null|undefined} sex
 * @returns {'male'|'female'|'other'}
 */
export function normalizeSexForBmr(sex) {
  const s = String(sex || '').toLowerCase();
  if (s === 'female' || s === 'f' || s === 'femme' || s === 'woman') return 'female';
  if (s === 'male' || s === 'm' || s === 'homme' || s === 'man') return 'male';
  return 'other';
}

/**
 * Libellé court pour l’UI (formule affichée).
 * @param {'male'|'female'|'other'} sex
 */
export function mifflinFormulaHintFr(sex) {
  const s = normalizeSexForBmr(sex);
  const tail =
    s === 'female' ? '− 161' : s === 'male' ? '+ 5' : '− 78 (sexe non précisé : moyenne)';
  return `BMR = 10 × poids(kg) + 6,25 × taille(cm) − 5 × âge(ans) ${tail}`;
}
