/**
 * Constantes pour QuestsTab
 * 
 * ✅ PHASE 4 : Extraction des constantes
 * 
 * @module components/tabs/QuestsTab/constants
 */

export { CRENEAUX } from '../../../utils/quests';

export const CATEGORIES = [
  'Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 
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

// Génère les options de durée (5 à 420 min, pas de 10)
export const DURATION_OPTIONS = Array.from(
  { length: (420 - 5) / 10 + 1 }, 
  (_, i) => 5 + i * 10
);
