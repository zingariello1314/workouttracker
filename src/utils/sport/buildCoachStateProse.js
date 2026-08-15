/**
 * Paragraphe Vision Coach composé depuis UserTrainingState + relations + événements.
 */

import { renderInterpretationText } from './interpretationRenderer';

/**
 * @param {object} opts
 * @returns {string|null}
 */
export function buildCoachStateProse(opts = {}) {
  const {
    trainingState = null,
    composedInterpretations = [],
    trainingEvents = null,
    stateTransitions = []
  } = opts;

  if (!trainingState) return null;

  const top = Array.isArray(composedInterpretations) ? composedInterpretations[0] : null;
  if (top?.text) {
    let prose = top.text.trim();
    const pr = trainingEvents?.events?.find((e) => e.type === 'pr_reps');
    if (pr && !prose.includes(pr.exerciseName || '')) {
      prose += ` Tu viens aussi d'aligner un record sur ${pr.exerciseName} (${pr.value} reps).`;
    }
    if (stateTransitions?.[0]?.narrative && !prose.includes(stateTransitions[0].narrative.slice(0, 20))) {
      prose += ` ${stateTransitions[0].narrative}.`;
    }
    return prose;
  }

  if (top) {
    const rendered = renderInterpretationText(top, trainingState);
    if (rendered) return rendered;
  }

  const { load, performance, recovery, fatigue, programResponse } = trainingState;
  const bits = [];

  if (load.trend === 'rising' && load.metrics?.deltaPct != null) {
    bits.push(`charge en hausse (~${load.metrics.deltaPct >= 0 ? '+' : ''}${load.metrics.deltaPct} %)`);
  } else if (load.trend === 'falling') {
    bits.push('volume en baisse');
  }

  if (performance.value === 'improving' || performance.trend === 'rising') {
    bits.push('progression en cours');
  } else if (performance.value === 'declining') {
    bits.push('performances en retrait');
  } else if (performance.value === 'stable') {
    bits.push('performances stables');
  }

  if (recovery.value === 'insufficient' || recovery.trend === 'falling') {
    bits.push('récupération à surveiller');
  } else if (recovery.value === 'sufficient') {
    bits.push('récupération correcte');
  }

  if (fatigue.value === 'high') {
    bits.push('fatigue perceptible');
  }

  if (programResponse.value === 'adapting' || programResponse.value === 'adapting_with_strain') {
    bits.push('le corps semble encore s\'adapter');
  } else if (programResponse.value === 'regressing') {
    bits.push('réponse au programme en baisse');
  }

  if (!bits.length) return null;

  return `Lecture globale : ${bits.join(', ')} — croise ça avec ton ressenti avant d'ajouter du volume.`;
}
