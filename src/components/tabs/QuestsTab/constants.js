/**
 * Constantes pour QuestsTab
 * 
 * ✅ PHASE 4 : Extraction des constantes
 * 
 * @module components/tabs/QuestsTab/constants
 */

export { CRENEAUX } from '../../../utils/quests';

export const CATEGORIES = [
  'Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Étirements', 'Nutrition',
  'Ménage', 'Spirituel', 'Prière', 'Repas', 'Projets', 'Hobby', 
  'Social', 'Finance', 'Créativité', 'Bien-être'
];

/** Les 5 prières islamiques (pour quêtes catégorie Prière) */
export const PRIERES = [
  { value: 'fajr', label: 'Fajr' },
  { value: 'dhuhr', label: 'Dhuhr' },
  { value: 'asr', label: 'Asr' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isha', label: 'Isha' },
];

export const DIFFICULTIES = [
  { value: 1, label: 'Facile' },
  { value: 2, label: 'Moyen' },
  { value: 3, label: 'Difficile' },
  { value: 4, label: 'Épique' },
];

export const JOUR_OPTIONS = [
  { value: 'all', label: 'Tous les jours' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export const RECURRENCE_PRESETS = [
  { label: 'Tous les jours', jours: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Semaine', jours: [1, 2, 3, 4, 5] },
  { label: 'Week‑end', jours: [6, 7] },
];

/** Pas de durée (minutes) : multiple de 5 entre 5 et 420 (inclut 10, 20, 30, …). */
export const DURATION_MIN = 5;
export const DURATION_MAX = 420;
export const DURATION_STEP = 5;

export const DURATION_OPTIONS = Array.from(
  { length: Math.floor((DURATION_MAX - DURATION_MIN) / DURATION_STEP) + 1 },
  (_, i) => DURATION_MIN + i * DURATION_STEP
);

/**
 * Ramène une durée brute (formulaire / IndexedDB) vers un multiple de 5 valide pour le select.
 * @param {unknown} raw
 * @param {number} [fallback=30]
 */
export function snapDureeToValidOption(raw, fallback = 30) {
  if (raw == null || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(n)));
  const snapped = Math.round(clamped / DURATION_STEP) * DURATION_STEP;
  return Math.min(DURATION_MAX, Math.max(DURATION_MIN, snapped));
}
