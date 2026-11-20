/**
 * Politique par horizon. La même conclusion peut exister sur plusieurs
 * fenêtres ; sa présence doit répondre à la question de l'horizon.
 */

export const HORIZON_QUESTION = Object.freeze({
  today: 'Qu’est-ce qui distingue ce qui vient d’être fait ?',
  week: 'Comment la semaine s’est-elle organisée ?',
  month: 'Qu’est-ce qui change et devient reproductible ?',
  long: 'Qu’est-ce qui s’installe, disparaît ou change de rôle ?',
  year: 'Quelles transformations le parcours disponible montre-t-il ?'
});

const FITTING_NATURE = {
  today: new Set(['now']),
  week: new Set(['now', 'trajectory']),
  month: new Set(['trajectory', 'journey', 'now']),
  long: new Set(['journey', 'trajectory']),
  year: new Set(['journey', 'trajectory'])
};

export function horizonFit(voiceKey, nature) {
  const question = HORIZON_QUESTION[voiceKey] || HORIZON_QUESTION.week;
  const fitting = FITTING_NATURE[voiceKey] || FITTING_NATURE.week;
  const justified = fitting.has(nature || 'trajectory');
  return {
    voiceKey: voiceKey || 'week',
    question,
    justified,
    angle: justified ? 'primary' : 'secondary'
  };
}

export const ANALYTICAL_CATEGORY = Object.freeze({
  ACTIVITY: 'activity',
  PROGRESSION: 'progression',
  SLEEP: 'sleep',
  RHYTHM: 'rhythm',
  REPERTOIRE: 'repertoire',
  STRUCTURE: 'structure',
  TRAJECTORY: 'trajectory',
  PROGRAM: 'program'
});

export function analyticalCategory(discovery) {
  const kind = String(discovery?.kind || '');
  const mechanism = discovery?.metrics?.mechanism || '';
  if (kind.includes('program') || kind === 'disc_program_practice') return ANALYTICAL_CATEGORY.PROGRAM;
  if (kind.includes('sleep')) return ANALYTICAL_CATEGORY.SLEEP;
  if (/muscle|push_pull|share|ratio|repartition/.test(kind)) return ANALYTICAL_CATEGORY.STRUCTURE;
  if (/arc|quarter|emergence|monthly/.test(kind) || mechanism === 'resumed_former_level') {
    return ANALYTICAL_CATEGORY.TRAJECTORY;
  }
  if (/rhythm|streak|calendar|rest_assoc/.test(kind)) return ANALYTICAL_CATEGORY.RHYTHM;
  if (/repertoire|format_consolidation|stability/.test(kind) || mechanism === 'historical_maintenance') {
    return ANALYTICAL_CATEGORY.REPERTOIRE;
  }
  if (/progress|resistance|milestone|pr_|consolidation/.test(kind)) return ANALYTICAL_CATEGORY.PROGRESSION;
  return ANALYTICAL_CATEGORY.ACTIVITY;
}
