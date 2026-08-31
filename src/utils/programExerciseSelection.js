/**
 * Sélection en lot des exercices d’un jour de programme
 * (séance principale + variantes salle semaine A/B).
 */

export const PROGRAM_EXERCISE_SLOTS = {
  MAIN: 'main',
  SEMAINE_A: 'semaineA',
  SEMAINE_B: 'semaineB'
};

export function exerciseSelectionKey(slot, exerciseId) {
  const s = slot || PROGRAM_EXERCISE_SLOTS.MAIN;
  return `${s}:${exerciseId}`;
}

export function parseExerciseSelectionKey(key) {
  const raw = String(key || '');
  const i = raw.indexOf(':');
  if (i <= 0) {
    return { slot: PROGRAM_EXERCISE_SLOTS.MAIN, exerciseId: raw };
  }
  return { slot: raw.slice(0, i), exerciseId: raw.slice(i + 1) };
}

/** Anciennes clés = id nu (piste principale). */
export function normalizeSelectedKeys(selectedKeys) {
  return (selectedKeys || []).map((k) => (String(k).includes(':') ? String(k) : `main:${k}`));
}

export function isExerciseSelected(selectedKeys, slot, exerciseId) {
  const keys = normalizeSelectedKeys(selectedKeys);
  return keys.includes(exerciseSelectionKey(slot, exerciseId));
}

export function toggleExerciseSelectionKeys(selectedKeys, slot, exerciseId, checked) {
  const keys = new Set(normalizeSelectedKeys(selectedKeys));
  const k = exerciseSelectionKey(slot, exerciseId);
  if (checked) keys.add(k);
  else keys.delete(k);
  return Array.from(keys);
}

export function removeExerciseFromSelection(selectedKeys, slot, exerciseId) {
  const k = exerciseSelectionKey(slot, exerciseId);
  return normalizeSelectedKeys(selectedKeys).filter((x) => x !== k);
}

export function dropSlotFromSelection(selectedKeys, slot) {
  return normalizeSelectedKeys(selectedKeys).filter((k) => parseExerciseSelectionKey(k).slot !== slot);
}

export function buildSingleDuplicateItem(exercise, slot = PROGRAM_EXERCISE_SLOTS.MAIN) {
  const s = slot || PROGRAM_EXERCISE_SLOTS.MAIN;
  return {
    id: `exercise_${s}_${exercise.id}`,
    kind: 'exercise',
    sourceSlot: s,
    label:
      s === PROGRAM_EXERCISE_SLOTS.MAIN
        ? exercise.name
        : `${exercise.name} · ${programExerciseSlotLabel(s)}`,
    payload: exercise
  };
}

export function programExerciseSlotLabel(slot) {
  if (slot === PROGRAM_EXERCISE_SLOTS.SEMAINE_A) return 'Semaine A';
  if (slot === PROGRAM_EXERCISE_SLOTS.SEMAINE_B) return 'Semaine B';
  return 'Séance principale';
}

export function listExercisesOnSlot(dayData, slot) {
  if (!slot || slot === PROGRAM_EXERCISE_SLOTS.MAIN) return dayData?.exercises || [];
  return dayData?.salleVariants?.[slot]?.exercises || [];
}

export function collectSelectedProgramExercises(dayData, selectedKeys) {
  const out = [];
  normalizeSelectedKeys(selectedKeys).forEach((key) => {
    const { slot, exerciseId } = parseExerciseSelectionKey(key);
    const exercise = listExercisesOnSlot(dayData, slot).find((ex) => String(ex.id) === String(exerciseId));
    if (exercise) out.push({ slot, exercise, selectionKey: key });
  });
  return out;
}

export function buildDuplicateItemsFromSelection(dayData, selectedKeys) {
  return collectSelectedProgramExercises(dayData, selectedKeys).map(({ slot, exercise }) => ({
    id: `exercise_${slot}_${exercise.id}`,
    kind: 'exercise',
    sourceSlot: slot,
    label:
      slot === PROGRAM_EXERCISE_SLOTS.MAIN
        ? exercise.name
        : `${exercise.name} · ${programExerciseSlotLabel(slot)}`,
    payload: exercise
  }));
}

function ensureSalleVariant(day, slot) {
  const variants = { ...(day.salleVariants || {}) };
  const existing = variants[slot] || {};
  variants[slot] = {
    name: existing.name || (slot === PROGRAM_EXERCISE_SLOTS.SEMAINE_A ? 'Variante salle A' : 'Variante salle B'),
    exercises: Array.isArray(existing.exercises) ? [...existing.exercises] : []
  };
  return { ...day, salleVariants: variants };
}

/**
 * Duplique des exercices vers un jour, en conservant la piste (main / semaine A / semaine B).
 */
export function appendDuplicateExercisesToDay(day, items, duplicateAsNew) {
  let next = { ...day };
  const grouped = {
    [PROGRAM_EXERCISE_SLOTS.MAIN]: [],
    [PROGRAM_EXERCISE_SLOTS.SEMAINE_A]: [],
    [PROGRAM_EXERCISE_SLOTS.SEMAINE_B]: []
  };
  (items || []).forEach((item) => {
    if (!item?.payload) return;
    const slot = grouped[item.sourceSlot] ? item.sourceSlot : PROGRAM_EXERCISE_SLOTS.MAIN;
    grouped[slot].push(duplicateAsNew(item.payload));
  });

  if (grouped.main.length) {
    next.exercises = [...(next.exercises || []), ...grouped.main];
  }
  if (grouped.semaineA.length) {
    next = ensureSalleVariant(next, PROGRAM_EXERCISE_SLOTS.SEMAINE_A);
    next.salleVariants = {
      ...next.salleVariants,
      semaineA: {
        ...next.salleVariants.semaineA,
        exercises: [...(next.salleVariants.semaineA.exercises || []), ...grouped.semaineA]
      }
    };
  }
  if (grouped.semaineB.length) {
    next = ensureSalleVariant(next, PROGRAM_EXERCISE_SLOTS.SEMAINE_B);
    next.salleVariants = {
      ...next.salleVariants,
      semaineB: {
        ...next.salleVariants.semaineB,
        exercises: [...(next.salleVariants.semaineB.exercises || []), ...grouped.semaineB]
      }
    };
  }
  return next;
}

export function deleteSelectedExercisesFromDay(day, selectedKeys) {
  const bySlot = {
    [PROGRAM_EXERCISE_SLOTS.MAIN]: new Set(),
    [PROGRAM_EXERCISE_SLOTS.SEMAINE_A]: new Set(),
    [PROGRAM_EXERCISE_SLOTS.SEMAINE_B]: new Set()
  };
  normalizeSelectedKeys(selectedKeys).forEach((key) => {
    const { slot, exerciseId } = parseExerciseSelectionKey(key);
    if (bySlot[slot]) bySlot[slot].add(String(exerciseId));
  });

  const next = { ...day };
  if (bySlot.main.size) {
    next.exercises = (next.exercises || []).filter((ex) => !bySlot.main.has(String(ex.id)));
  }
  if (day?.salleVariants && (bySlot.semaineA.size || bySlot.semaineB.size)) {
    const variants = { ...day.salleVariants };
    [PROGRAM_EXERCISE_SLOTS.SEMAINE_A, PROGRAM_EXERCISE_SLOTS.SEMAINE_B].forEach((slot) => {
      if (!bySlot[slot].size || !variants[slot]) return;
      variants[slot] = {
        ...variants[slot],
        exercises: (variants[slot].exercises || []).filter((ex) => !bySlot[slot].has(String(ex.id)))
      };
    });
    next.salleVariants = variants;
  }
  return next;
}

export function selectionTouchesEditing(selectedKeys, editingExercise, dayKey) {
  if (!editingExercise || editingExercise.dayKey !== dayKey) return false;
  const slot = editingExercise.variantKey || PROGRAM_EXERCISE_SLOTS.MAIN;
  return isExerciseSelected(selectedKeys, slot, editingExercise.exerciseId);
}
