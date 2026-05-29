/**
 * Questions système quiz → génération (rappels, défis, créneau préféré).
 */

/**
 * @param {object} answers
 * @param {import('./quizCoachPipeline').ArchetypeDeformers} deformers
 */
export function applySystemPrefsToDeformers(answers, deformers = {}) {
  const d = { ...deformers, preferredGroupWeights: { ...(deformers.preferredGroupWeights || {}) } };
  const why = [];

  const window = answers?.preferredTrainingWindow;
  if (window === 'very_early_morning' || window === 'morning') {
    d.maxExercisesPerSession = Math.min(d.maxExercisesPerSession ?? 7, 6);
    why.push('Créneau matin : séances un peu plus courtes pour tenir le rythme.');
  }
  if (window === 'night') {
    d.allowFractionné = false;
    why.push('Créneau tardif : fractionné évité pour protéger le sommeil.');
  }

  const reminder = answers?.setReminderIntensity;
  if (reminder === 'soft') {
    d.maxHeavyBlocksPerSession = Math.min(d.maxHeavyBlocksPerSession ?? 2, 1);
  } else if (reminder === 'hardcore') {
    d.maxExercisesPerSession = Math.min(10, (d.maxExercisesPerSession ?? 7) + 1);
    d.maxEffectiveSetsPerSession = Math.min(32, (d.maxEffectiveSetsPerSession ?? 25) + 2);
    why.push('Rappels intenses : volume séance légèrement relevé si récupération OK.');
  }

  const challenge = answers?.dailyChallengeDifficulty;
  if (challenge === 'easy') {
    d.volumeMul = Math.min(d.volumeMul ?? 1, 0.92);
    d.exerciseCountMul = Math.min(d.exerciseCountMul ?? 1, 0.9);
  } else if (challenge === 'nightmare') {
    d.volumeMul = Math.max(d.volumeMul ?? 1, 1.04);
    why.push('Défis quotidiens exigeants : structure un peu plus dense.');
  }

  return { deformers: d, whyLines: why };
}

/**
 * Indices nutrition / UX selon créneau.
 */
export function nutritionTimingHintFromQuiz(answers) {
  const w = answers?.preferredTrainingWindow;
  const map = {
    very_early_morning: 'Repas principal après la séance du matin tôt.',
    morning: 'Collation pré-séance légère si besoin.',
    midday: 'Déjeuner = repas clé autour de l’entraînement.',
    afternoon: 'Goûter protéiné post-séance recommandé.',
    evening: 'Dîner post-séance : privilégier protéines + glucides modérés.',
    night: 'Éviter gros repas tardif après séance nocturne.'
  };
  return map[w] || null;
}
