/**
 * Dix fils : sujets et champs requis.
 * Un fil n'est pas une carte. Le rédacteur ne lit pas cette table pour calculer.
 */

export const THREADS = {
  concentration: { family: 'th_concentration', sport: true },
  rhythm: { family: 'th_rhythm', sport: true },
  composition: { family: 'th_composition', sport: true },
  repertoire: { family: 'th_repertoire', sport: true },
  pushPull: { family: 'th_push_pull', sport: true },
  series: { family: 'th_series', sport: true },
  sleepPlacement: { family: 'th_sleep_placement', sport: false },
  sleepRegularity: { family: 'th_sleep_regularity', sport: false },
  sleepLink: { family: 'th_sleep_link', sport: false },
  continuity: { family: 'th_continuity', sport: true }
};

export const SENSE_NATURE = {
  fact: 'now',
  relation: 'trajectory',
  transformation: 'journey'
};

export function threadKind(thread, sense) {
  const nature = SENSE_NATURE[sense] || 'trajectory';
  return `disc_th_${thread}_${nature}`;
}
