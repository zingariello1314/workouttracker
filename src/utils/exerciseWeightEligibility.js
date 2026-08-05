/**
 * Éligibilité au lesté (Aujourd’hui programme) — banque + programme.
 */
import { exerciseDatabase, findExerciseInDatabase } from '../data/exerciseDatabase';
import { exerciseUsesExternalLoad } from './programUtils';

const LOADABLE_EQUIP_RE =
  /haltère|haltere|barre|kettlebell|poulie|machine|disque|smith|landmine|trap bar|ez bar|olympique|lest|weight|dumbbell|barbell|cable|t-bar|gouvernail/i;

const OPTIONAL_BW_RE =
  /pomp|push[- ]?up|traction|pull[- ]?up|chin|dip|répulsion|muscle[- ]?up|squat|fente|pistol|handstand/i;

function normalizeText(exercise) {
  const name = String(exercise?.name || exercise?.nom || '').trim();
  const mat = String(exercise?.materiel || exercise?.equipment || '').trim();
  return { name, mat, combined: `${name} ${mat}`.toLowerCase() };
}

function bankEntryForExercise(exercise) {
  const { name } = normalizeText(exercise);
  if (!name) return null;
  const hit = findExerciseInDatabase(name.toLowerCase());
  if (hit) return hit;
  const key = Object.keys(exerciseDatabase).find(
    (k) => String(exerciseDatabase[k]?.name || '').toLowerCase() === name.toLowerCase()
  );
  return key ? exerciseDatabase[key] : null;
}

export function isEquipmentStringLoadable(equipment) {
  const e = String(equipment || '').toLowerCase();
  if (!e) return false;
  if (/^poids du corps$/i.test(e.trim()) || e === 'aucun') return false;
  if (LOADABLE_EQUIP_RE.test(e)) return true;
  if (e.includes('+') && LOADABLE_EQUIP_RE.test(e)) return true;
  return false;
}

/**
 * @returns {{ mode: 'required' | 'optional' } | null}
 */
export function getExerciseWeightUiMode(exercise) {
  if (!exercise || typeof exercise !== 'object') return null;
  if (exerciseUsesExternalLoad(exercise)) return { mode: 'required' };

  const bank = bankEntryForExercise(exercise);
  if (bank && isEquipmentStringLoadable(bank.equipment)) return { mode: 'optional' };

  const { combined, mat } = normalizeText(exercise);
  if (LOADABLE_EQUIP_RE.test(combined) || LOADABLE_EQUIP_RE.test(mat)) {
    return { mode: 'optional' };
  }
  if (OPTIONAL_BW_RE.test(combined)) return { mode: 'optional' };

  return null;
}

export function exerciseShowsWeightField(exercise, markedWeighted) {
  const ui = getExerciseWeightUiMode(exercise);
  if (!ui) return false;
  if (ui.mode === 'required') return true;
  return Boolean(markedWeighted);
}
