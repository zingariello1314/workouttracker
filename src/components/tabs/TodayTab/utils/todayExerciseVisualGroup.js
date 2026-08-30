/** Accent visuel + filtres (affichage uniquement). */
export const TODAY_GROUP_IDS = [
  'pecs',
  'epaules',
  'triceps',
  'biceps',
  'dos',
  'core',
  'cardio',
  'default'
];

export function todayExerciseVisualGroup(exercise) {
  const type = String(exercise?.type || '').toLowerCase();
  const name = String(exercise?.name || '').toLowerCase();

  if (type.includes('cardio') || name.includes('boxe') || name.includes('natation')) {
    return 'cardio';
  }
  if (
    type.includes('abdos') ||
    name.includes('planche') ||
    name.includes('crunch') ||
    name.includes('vacuum') ||
    name.includes('gainage') ||
    name.includes('mountain') ||
    name.includes('relevé') ||
    name.includes('releve')
  ) {
    return 'core';
  }
  if (
    name.includes('curl') ||
    name.includes('biceps') ||
    name.includes('zottman') ||
    name.includes('marteau')
  ) {
    return 'biceps';
  }
  if (
    name.includes('traction') ||
    name.includes('rowing') ||
    name.includes('dorsal') ||
    name.includes('australien')
  ) {
    return 'dos';
  }
  if (
    type.includes('triceps') ||
    name.includes('triceps') ||
    name.includes('kickback') ||
    name.includes('diamant') ||
    name.includes('dip') ||
    (name.includes('pompe') && name.includes('tempo'))
  ) {
    return 'triceps';
  }
  if (
    type.includes('epaule') ||
    name.includes('élévation') ||
    name.includes('elevation') ||
    name.includes('oiseau') ||
    name.includes('arnold') ||
    name.includes('face pull') ||
    name.includes('militaire')
  ) {
    return 'epaules';
  }
  if (
    name.includes('pect') ||
    name.includes('pompe') ||
    name.includes('développé') ||
    name.includes('developpe')
  ) {
    return 'pecs';
  }
  return 'default';
}

export function todayFocusTags(focus) {
  if (!focus) return [];
  return String(focus)
    .split(/[/—,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function uniqueTodayExerciseGroups(exercises) {
  const seen = new Set();
  (exercises || []).forEach((ex) => {
    seen.add(todayExerciseVisualGroup(ex));
  });
  return TODAY_GROUP_IDS.filter((id) => seen.has(id));
}
