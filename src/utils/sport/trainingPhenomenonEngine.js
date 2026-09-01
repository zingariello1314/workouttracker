/**
 * Phénomènes d'entraînement : unité d'analyse au-dessus des features.
 * Pas de texte UI. Une cause → un phénomène, pas trois cartes.
 *
 * Signal → relation → phénomène. La lecture utilisateur est une projection.
 */

import { identityFrequencyStatus } from './athleteTrainingIdentity';

function num(n) {
  return n != null && Number.isFinite(n) ? n : null;
}

/**
 * @typedef {object} TrainingPhenomenon
 * @property {string} id
 * @property {string} type
 * @property {string[]} signals
 * @property {number} strength
 * @property {number} confidence
 * @property {object} interpretation
 * @property {string[]} suppresses — kinds d'essays redondants si ce phénomène est retenu
 * @property {'now'|'trajectory'|'journey'} [nature]
 * @property {{ unusual?: boolean, goalRelevant?: boolean }} [priority]
 */

/**
 * @param {{ features?: object, identity?: object|null, goal?: string|null, extras?: object }} opts
 * @returns {TrainingPhenomenon[]}
 */
export function buildTrainingPhenomena(opts = {}) {
  const features = opts.features || {};
  const identity = opts.identity || null;
  const goal = opts.goal || null;
  const extras = opts.extras || {};
  const d28 = num(features.volumeDelta28Pct ?? features.volumeDeltaPct ?? features.repExposureDelta28Pct);
  const d7 = num(features.volumeDelta7Pct ?? features.repExposureDelta7Pct);
  const freq = num(features.frequencyDeltaPct);
  const pushPct = num(features.pushPct);
  const programPct = num(features.programCompletionPct);
  const mom = num(features.performanceMomentumPct ?? extras.mom);
  const idStatus = identityFrequencyStatus(identity);
  const idConf = identity?.ready ? identity.confidence : 0.4;
  const out = [];

  const freqDown = freq != null && freq <= -12;
  const expoDown = d28 != null && d28 <= -12;
  const weekUp = d7 != null && d7 >= 5;
  const weekDown = d7 != null && d7 <= -8;
  const inside = idStatus === 'inside';

  if (expoDown || freqDown) {
    const rebound = weekUp;
    const stillFalling = weekDown || (!weekUp && expoDown);
    out.push({
      id: rebound ? 'recent_contraction_rebound' : 'recent_contraction',
      type: rebound ? 'contraction_with_rebound' : 'contraction',
      signals: [
        freqDown ? 'frequency_down' : null,
        expoDown ? 'rep_exposure_28_down' : null,
        rebound ? 'rep_exposure_7_up' : null,
        stillFalling && !rebound ? 'rep_exposure_7_down' : null,
        inside ? 'identity_inside' : idStatus === 'low' ? 'identity_low' : null
      ].filter(Boolean),
      strength: rebound ? 0.88 : 0.8,
      confidence: Math.max(0.62, idConf),
      interpretation: {
        exposure: 'reduced',
        recentDirection: rebound ? 'recovering' : stillFalling ? 'still_falling' : 'unclear',
        identityStatus: inside ? 'normal' : idStatus === 'low' ? 'unusual' : 'unknown',
        identityMeans: 'observed_habit'
      },
      nature: 'now',
      priority: { unusual: !inside && idStatus === 'low', goalRelevant: true },
      suppresses: [
        'volume_traj',
        'capacity_vs_exposure',
        inside ? 'recent_vs_identity' : null
      ].filter(Boolean)
    });
  }

  if (pushPct != null && pushPct >= 60) {
    const street = goal === 'street_skills';
    out.push({
      id: 'push_shift',
      type: 'specialization_push',
      signals: [
        'push_share_high',
        features.pushPullRatio != null ? `ratio_${features.pushPullRatio}` : null
      ].filter(Boolean),
      strength: pushPct >= 70 ? 0.86 : 0.78,
      confidence: 0.72,
      interpretation: { mix: 'push_dominant', pushPct },
      nature: 'trajectory',
      priority: { unusual: true, goalRelevant: street },
      suppresses: ['specialization']
    });
  }

  if (programPct != null && programPct < 55) {
    out.push({
      id: 'program_drift',
      type: 'low_adherence',
      signals: ['program_completion_low'],
      strength: programPct < 40 ? 0.84 : 0.74,
      confidence: 0.7,
      interpretation: { adherence: 'low', programPct },
      nature: 'trajectory',
      priority: { unusual: true, goalRelevant: true },
      suppresses: []
    });
  }

  const cardio = extras.cardioGone;
  if (cardio && (cardio.daysSince >= 14 || cardio.sessionsSince >= 8)) {
    const street = goal === 'street_skills';
    out.push({
      id: 'quality_out_run',
      type: 'quality_absent',
      signals: ['run_absent', cardio.daysSince != null ? `gap_${cardio.daysSince}d` : null].filter(Boolean),
      strength: cardio.daysSince >= 45 ? 0.84 : 0.76,
      confidence: 0.74,
      interpretation: { quality: 'run', daysSince: cardio.daysSince },
      nature: 'now',
      priority: { unusual: true, goalRelevant: !street },
      suppresses: []
    });
  }

  if (mom != null && mom <= -12 && (expoDown || freqDown)) {
    out.push({
      id: 'output_indeterminate',
      type: 'observed_output_indeterminate',
      signals: ['rep_momentum_down', expoDown ? 'exposure_also_down' : 'frequency_also_down'],
      strength: 0.7,
      confidence: 0.58,
      interpretation: {
        observedOutput: 'down',
        performanceState: 'insufficient_evidence',
        comparable: false
      },
      nature: 'now',
      priority: { unusual: false, goalRelevant: true },
      suppresses: []
    });
  }

  return out.sort((a, b) => b.strength - a.strength);
}

export function phenomenonSuppresses(phenomena, kind) {
  return (phenomena || []).some((p) => (p.suppresses || []).includes(kind));
}

export function primaryPhenomenon(phenomena, type) {
  return (phenomena || []).find((p) => p.type === type) || null;
}
