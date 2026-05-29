/**
 * Résolution muscle fin : banque DB en priorité, regex en secours.
 * Lecture seule — ne modifie pas exerciseDatabase.
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';

/** @typedef {'back'|'chest'|'shoulders'|'biceps'|'triceps'|'quads'|'hamstrings'|'glutes'|'calves'|'core'} FineMuscle */

export function resolveFineMuscleFromName(nameOrKey) {
  const s = String(nameOrKey || '').toLowerCase();
  if (/gainage|planche|abdo|core|oblique/.test(s)) return 'core';
  if (/mollet|calf/.test(s)) return 'calves';
  if (/ischio|hamstring|leg curl/.test(s)) return 'hamstrings';
  if (/fessier|glute/.test(s)) return 'glutes';
  if (/squat|presse|quad|fente/.test(s) && !/fessier/.test(s)) return 'quads';
  if (/traction|pull|rowing|tirage|dos|lat/.test(s) && !/développé|press|pompe/.test(s)) return 'back';
  if (/biceps|curl/.test(s) && !/triceps/.test(s)) return 'biceps';
  if (/triceps|extension bras/.test(s)) return 'triceps';
  if (/épaule|shoulder|militaire|lateral|élévation/.test(s)) return 'shoulders';
  if (/pompe|dip|développé|bench|pec|poitrine|écarté|ecarte/.test(s)) return 'chest';
  return null;
}

/**
 * @param {string} dbKey
 * @param {object} dbEntry
 * @returns {FineMuscle|null}
 */
function resolveFineMuscleFromMuscleText(text) {
  const blob = String(text || '').toLowerCase();
  if (!blob) return null;
  if (/pectoraux|poitrine|\bpec\b/.test(blob)) return 'chest';
  if (/grand dorsal|dorsal|rhombo|trapèze|trapeze|latissimus/.test(blob)) return 'back';
  if (/delto|épaule|epaule/.test(blob)) return 'shoulders';
  if (/biceps|brachial/.test(blob) && !/triceps/.test(blob)) return 'biceps';
  if (/triceps/.test(blob)) return 'triceps';
  if (/quadriceps|quad|vaste/.test(blob)) return 'quads';
  if (/ischio|hamstring|biceps fémoral/.test(blob)) return 'hamstrings';
  if (/fessier|glute/.test(blob)) return 'glutes';
  if (/mollet|gastrocn|soléaire|soleaire/.test(blob)) return 'calves';
  if (/abdo|core|transverse|oblique/.test(blob)) return 'core';
  return null;
}

export function resolveFineMuscleFromBankEntry(dbKey, dbEntry) {
  if (!dbEntry) return null;

  const prim = resolveFineMuscleFromMuscleText((dbEntry.primaryMuscles || []).join(' '));
  if (prim) return prim;

  const sec = resolveFineMuscleFromMuscleText((dbEntry.secondaryMuscles || []).join(' '));
  if (sec) return sec;

  return resolveFineMuscleFromName(`${dbEntry.name || ''} ${dbKey}`);
}

/**
 * Extrait la clé banque depuis un id programme quiz (`quiz_ex_...`).
 * @param {string|number} exerciseId
 * @returns {string|null}
 */
export function parseQuizExerciseBankKey(exerciseId) {
  const s = String(exerciseId || '');
  if (!s.startsWith('quiz_ex_')) return null;
  const rest = s.slice('quiz_ex_'.length);
  const keys = Object.keys(exerciseDatabase).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const slug = key.replace(/\s+/g, '_');
    if (rest === slug || rest.startsWith(`${slug}_`)) return key;
  }
  return null;
}

/**
 * @param {string|number} exerciseId
 * @param {string} [nameHint]
 * @param {(id: string) => string} [getExerciseNameById]
 * @returns {FineMuscle|null}
 */
export function resolveFineMuscleFromExerciseRef(exerciseId, nameHint = '', getExerciseNameById = null) {
  const bankKey = parseQuizExerciseBankKey(exerciseId);
  if (bankKey && exerciseDatabase[bankKey]) {
    const fromBank = resolveFineMuscleFromBankEntry(bankKey, exerciseDatabase[bankKey]);
    if (fromBank) return fromBank;
  }

  if (String(exerciseId || '').startsWith('db_')) {
    const keyGuess = String(exerciseId).replace(/^db_/, '').replace(/_/g, ' ');
    const hit = Object.keys(exerciseDatabase).find(
      (k) => k.toLowerCase().replace(/\s+/g, ' ') === keyGuess.toLowerCase()
    );
    if (hit) {
      const fromBank = resolveFineMuscleFromBankEntry(hit, exerciseDatabase[hit]);
      if (fromBank) return fromBank;
    }
  }

  let name = nameHint;
  if (!name && typeof getExerciseNameById === 'function') {
    name = getExerciseNameById(exerciseId) || '';
  }
  if (name) {
    const byNameKey = Object.keys(exerciseDatabase).find(
      (k) => exerciseDatabase[k]?.name?.toLowerCase() === name.toLowerCase()
    );
    if (byNameKey) {
      const fromBank = resolveFineMuscleFromBankEntry(byNameKey, exerciseDatabase[byNameKey]);
      if (fromBank) return fromBank;
    }
    const fromName = resolveFineMuscleFromName(name);
    if (fromName) return fromName;
  }

  return resolveFineMuscleFromName(String(exerciseId || ''));
}
