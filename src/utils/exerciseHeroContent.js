/**
 * Contenu « héros » fiche exercice : référentiel + profil (calendrier / Récap).
 */
import { exerciseDatabase, findExerciseInDatabase, resolveExerciseDatabaseKey } from '../data/exerciseDatabase';

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

const databaseKeyByName = new Map();

function lookupExerciseDatabaseKey(raw) {
  return resolveExerciseDatabaseKey(raw);
}

/** Clé `exerciseDatabase` pour l’exercice courant (similarités, banque). */
export function getExerciseDatabaseKey(exercise) {
  if (!exercise) return null;
  if (exercise.databaseKey && exerciseDatabase[exercise.databaseKey]) return exercise.databaseKey;
  const raw = nameNorm(exercise);
  if (!raw) return null;
  if (databaseKeyByName.has(raw)) return databaseKeyByName.get(raw);
  const resolved = lookupExerciseDatabaseKey(raw);
  databaseKeyByName.set(raw, resolved);
  return resolved;
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

const PROGRAM_NOTES_MAX_LEN = 120;

/** Résumé court pour programme / Aujourd'hui (≠ description fiche banque). */
export function getExerciseProgramNotes(dbEntry) {
  if (!dbEntry) return '';
  if (typeof dbEntry.summary === 'string' && dbEntry.summary.trim()) {
    return dbEntry.summary.trim();
  }
  const desc = String(dbEntry.description || '').trim();
  if (!desc) return '';
  const firstBlock = desc.split(/\n\n+/)[0].trim();
  if (firstBlock.length <= PROGRAM_NOTES_MAX_LEN) return firstBlock;
  const slice = firstBlock.slice(0, PROGRAM_NOTES_MAX_LEN);
  const lastPeriod = slice.lastIndexOf('. ');
  if (lastPeriod >= 50) return slice.slice(0, lastPeriod + 1);
  return `${slice.trim()}…`;
}

/** Notes affichées dans Aujourd'hui / programme — corrige les anciennes notes = description complète. */
export function resolveProgramExerciseNotes(exercise) {
  const raw = String(exercise?.notes || '').trim();
  if (!raw) return '';

  const dbHit = getExerciseDatabaseHit(exercise);
  if (dbHit) {
    const shortNotes = getExerciseProgramNotes(dbHit);
    const fullDesc = String(dbHit.description || '').trim();
    if (fullDesc && raw === fullDesc) return shortNotes;
    if (fullDesc.length > PROGRAM_NOTES_MAX_LEN && raw.length > PROGRAM_NOTES_MAX_LEN) {
      const norm = (s) => s.replace(/\s+/g, ' ').trim();
      if (norm(raw) === norm(fullDesc) || norm(fullDesc).startsWith(norm(raw).slice(0, 80))) {
        return shortNotes;
      }
    }
  }

  if (raw.length > PROGRAM_NOTES_MAX_LEN) {
    const first = raw.split(/\n\n+/)[0].trim();
    if (first.length <= PROGRAM_NOTES_MAX_LEN) return first;
    return `${first.slice(0, PROGRAM_NOTES_MAX_LEN - 1).trim()}…`;
  }
  return raw;
}
