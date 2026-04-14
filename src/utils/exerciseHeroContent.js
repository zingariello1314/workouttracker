/**
 * Contenu « héros » fiche exercice : référentiel + profil (calendrier / Récap).
 */
import { findExerciseInDatabase } from '../data/exerciseDatabase';

function nameNorm(exercise) {
  return String(exercise?.name || exercise?.nom || '')
    .trim()
    .toLowerCase();
}

export function getExerciseDatabaseHit(exercise) {
  const raw = nameNorm(exercise);
  if (!raw) return null;
  let hit = findExerciseInDatabase(raw);
  if (hit) return hit;
  const base = raw.split('(')[0].trim();
  if (base && base !== raw) hit = findExerciseInDatabase(base);
  return hit || null;
}

/**
 * @param {{ calendarLoadMode: string }} profile — sortie `resolveExerciseDetailProfile`
 * @returns {string} clé i18n exercisesTab.detail.hero.mode*
 */
export function getExerciseVolumeModeTranslationKey(profile) {
  const m = profile?.calendarLoadMode;
  if (m === 'tiered_isometric') return 'exercisesTab.detail.hero.modeIso';
  if (m === 'cardio_reference') return 'exercisesTab.detail.hero.modeCardio';
  return 'exercisesTab.detail.hero.modeReps';
}

export function formatMuscleList(list) {
  if (!Array.isArray(list) || !list.length) return '';
  return list.map((s) => String(s).trim()).filter(Boolean).join(' · ');
}
