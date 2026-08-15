/**
 * Transitions d'état entre deux snapshots UserTrainingState (fenêtre précédente → actuelle).
 */

/** @typedef {'rising'|'stable'|'falling'|'unknown'} TrendDir */

/**
 * @typedef {object} StateTransition
 * @property {string} id
 * @property {string} axis
 * @property {string} from
 * @property {string} to
 * @property {string} narrative
 * @property {number} confidence
 */

const AXES = ['load', 'performance', 'recovery', 'fatigue', 'adherence', 'programResponse'];

function axisSnapshot(state, key) {
  const ax = state?.[key];
  if (!ax) return { value: 'unknown', trend: 'unknown', confidence: 0 };
  return { value: ax.value || 'unknown', trend: ax.trend || 'unknown', confidence: ax.confidence || 0 };
}

function transitionNarrative(axis, from, to, fromTrend, toTrend) {
  const labels = {
    load: 'charge',
    performance: 'performance',
    recovery: 'récupération',
    fatigue: 'fatigue',
    adherence: 'adhérence',
    programResponse: 'réponse au programme'
  };
  const name = labels[axis] || axis;

  if (fromTrend === 'stable' && toTrend === 'rising') {
    return `${name} en hausse après une phase stable`;
  }
  if (fromTrend === 'rising' && toTrend === 'falling') {
    return `${name} qui redescend après une montée`;
  }
  if (from === 'declining' && to !== 'declining' && to !== 'unknown') {
    return `${name} qui se reprend après un creux`;
  }
  if (from === 'insufficient' && (to === 'sufficient' || to === 'uncertain')) {
    return `${name} en amélioration`;
  }
  if (from === 'sufficient' && to === 'insufficient') {
    return `${name} qui se dégrade`;
  }
  if (from !== to && from !== 'unknown' && to !== 'unknown') {
    return `${name} : ${from} → ${to}`;
  }
  return null;
}

/**
 * @param {import('./userTrainingState.js').UserTrainingState|null} priorState
 * @param {import('./userTrainingState.js').UserTrainingState|null} currentState
 * @returns {StateTransition[]}
 */
export function detectStateTransitions(priorState, currentState) {
  if (!priorState || !currentState) return [];

  const out = [];
  AXES.forEach((axis) => {
    const prev = axisSnapshot(priorState, axis);
    const curr = axisSnapshot(currentState, axis);
    if (prev.value === curr.value && prev.trend === curr.trend) return;

    const narrative = transitionNarrative(axis, prev.value, curr.value, prev.trend, curr.trend);
    if (!narrative) return;

    const confidence = Math.min(prev.confidence || 0.4, curr.confidence || 0.4);
    if (confidence < 0.35) return;

    out.push({
      id: `transition.${axis}.${prev.value}_to_${curr.value}`,
      axis,
      from: prev.value,
      to: curr.value,
      narrative,
      confidence: Math.round(confidence * 100) / 100
    });
  });

  if (priorState.lifePhase !== currentState.lifePhase && currentState.lifePhase) {
    out.push({
      id: `transition.phase.${currentState.lifePhase}`,
      axis: 'lifePhase',
      from: priorState.lifePhase || 'none',
      to: currentState.lifePhase,
      narrative: `phase sportive : ${currentState.lifePhase}`,
      confidence: 0.65
    });
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

/**
 * @param {StateTransition[]} transitions
 * @returns {string|null}
 */
export function buildTransitionNarrative(transitions) {
  if (!transitions?.length) return null;
  const top = transitions.slice(0, 2).map((t) => t.narrative);
  return top.join(' ; ') + '.';
}
