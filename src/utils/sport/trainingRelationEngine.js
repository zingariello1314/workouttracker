import { buildRelationContext, evaluateRelationGraph } from './trainingRelationGraph';

/**
 * @typedef {import('./userTrainingState.js').UserTrainingState} UserTrainingState
 */

/**
 * @typedef {object} InterpretationCandidate
 * @property {string} id
 * @property {string} type
 * @property {string} pillar
 * @property {'short'|'medium'|'long'} horizon
 * @property {string} state
 * @property {string[]} evidence
 * @property {Record<string, number|null>} metrics
 * @property {number} confidence — 0–1
 * @property {number} relevance — 0–1
 * @property {number} novelty — 0–1
 * @property {number} [actionability]
 * @property {number} [severity]
 * @property {object} context
 */

/**
 * @param {Partial<InterpretationCandidate>} row
 * @returns {InterpretationCandidate|null}
 */
function candidate(row) {
  if (!row?.id || !row?.type) return null;
  const confidence = row.confidence ?? 0.5;
  const relevance = row.relevance ?? 0.5;
  if (confidence < 0.45 || relevance < 0.45) return null;
  return {
    id: row.id,
    type: row.type,
    pillar: row.pillar || 'interpretation',
    horizon: row.horizon || 'medium',
    state: row.state || row.type,
    evidence: row.evidence || [],
    metrics: row.metrics || {},
    confidence,
    relevance,
    novelty: row.novelty ?? 0.82,
    actionability: row.actionability ?? 0.5,
    severity: row.severity ?? 0.2,
    context: row.context || {}
  };
}

function relationConfidence(...axes) {
  const vals = axes.map((a) => a?.confidence ?? 0).filter((v) => v > 0);
  if (!vals.length) return 0.4;
  return Math.min(...vals);
}

function pushEvidence(state) {
  const bits = [];
  ['load', 'performance', 'recovery', 'fatigue', 'adherence', 'programResponse'].forEach((k) => {
    const ax = state[k];
    if (ax?.evidence?.length) bits.push(...ax.evidence.slice(0, 2));
  });
  return [...new Set(bits)].slice(0, 8);
}

/**
 * @param {UserTrainingState|null|undefined} state
 * @param {{ events?: import('./trainingEventDetector.js').TrainingEvent[], byType?: Map<string, import('./trainingEventDetector.js').TrainingEvent[]> }|null} [eventBundle]
 * @param {{ stateTransitions?: import('./trainingStateTransitions.js').StateTransition[], performanceRobustness?: object[], enrichment?: object, assessment?: object }} [meta]
 * @returns {InterpretationCandidate[]}
 */
export function detectTrainingRelations(state, eventBundle = null, meta = {}) {
  if (!state) return [];

  const events = eventBundle?.events || [];
  const stateTransitions = meta.stateTransitions || [];
  const performanceRobustness = meta.performanceRobustness || [];
  const hasPr = events.some((e) => e.type === 'pr_reps');
  const hasPrOutlier = events.some((e) => e.type === 'pr_outlier');
  const prEvent = events.find((e) => e.type === 'pr_reps' || e.type === 'pr_outlier');
  const levelEstablished = performanceRobustness.find((r) => r.kind === 'LEVEL_ESTABLISHED');

  const { load, performance, recovery, fatigue, adherence, programResponse, lifePhase, context, features } =
    state;
  const out = [];
  const ctx = { ...context, phase: lifePhase };

  const volUp = load.trend === 'rising' || (features.volumeDeltaPct ?? 0) >= 12;
  const volDown = load.trend === 'falling' || (features.volumeDeltaPct ?? 0) <= -10;
  const perfUp =
    performance.trend === 'rising' ||
    performance.value === 'slightly_improving' ||
    performance.value === 'improving';
  const perfStable = performance.trend === 'stable' || performance.value === 'stable';
  const perfDown = performance.trend === 'falling' || performance.value === 'declining';
  /** Performance qui ne s'effondre pas (stable, en progrès ou signal insuffisant). */
  const perfHolding = !perfDown;
  const recoveryDown =
    recovery.trend === 'falling' ||
    recovery.value === 'insufficient' ||
    (features.sleepDeltaPct ?? 0) <= -8;
  const recoveryOk = recovery.value === 'sufficient' && recovery.trend !== 'falling';
  const fatigueUp =
    fatigue.trend === 'rising' || fatigue.value === 'high' || (features.difficultyDeltaPct ?? 0) >= 12;
  const adherenceHigh = adherence.value === 'high';

  if (volUp && perfHolding && recoveryDown && fatigueUp) {
    out.push(
      candidate({
        id: 'relation.adaptation_with_recovery_warning',
        type: 'adaptation_with_recovery_warning',
        horizon: 'short',
        state: 'adaptation',
        evidence: pushEvidence(state),
        metrics: {
          volumeDeltaPct: features.volumeDeltaPct,
          sleepDeltaPct: features.sleepDeltaPct,
          difficultyDeltaPct: features.difficultyDeltaPct,
          performanceMomentumPct: features.performanceMomentumPct
        },
        confidence: relationConfidence(load, recovery, fatigue),
        relevance: 0.94,
        novelty: 0.88,
        actionability: 0.72,
        severity: 0.45,
        context: ctx
      })
    );
  }

  if (volUp && perfDown && (recoveryDown || fatigueUp)) {
    out.push(
      candidate({
        id: 'relation.possible_overreach',
        type: 'possible_overreach',
        horizon: 'short',
        state: 'overreach',
        evidence: pushEvidence(state),
        metrics: {
          volumeDeltaPct: features.volumeDeltaPct,
          sleepDeltaPct: features.sleepDeltaPct,
          difficultyDeltaPct: features.difficultyDeltaPct
        },
        confidence: relationConfidence(load, performance, recovery, fatigue),
        relevance: 0.92,
        novelty: 0.86,
        actionability: 0.78,
        severity: 0.72,
        context: ctx
      })
    );
  }

  if (volUp && perfUp && recoveryOk && !fatigueUp) {
    out.push(
      candidate({
        id: 'relation.adaptation_success',
        type: 'adaptation_success',
        horizon: 'medium',
        state: 'adaptation',
        evidence: pushEvidence(state),
        metrics: { volumeDeltaPct: features.volumeDeltaPct },
        confidence: relationConfidence(load, performance, recovery),
        relevance: 0.9,
        novelty: 0.84,
        actionability: 0.55,
        severity: 0.15,
        context: ctx
      })
    );
  }

  if (volUp && perfHolding && !recoveryDown && programResponse.value === 'adapting') {
    out.push(
      candidate({
        id: 'relation.adaptation_under_load',
        type: 'adaptation_under_load',
        horizon: 'medium',
        state: 'adaptation',
        evidence: pushEvidence(state),
        metrics: { volumeDeltaPct: features.volumeDeltaPct },
        confidence: relationConfidence(load, programResponse),
        relevance: 0.86,
        novelty: 0.8,
        actionability: 0.58,
        severity: 0.2,
        context: ctx
      })
    );
  }

  if (adherenceHigh && volUp && perfHolding && !perfUp) {
    out.push(
      candidate({
        id: 'relation.effort_without_return',
        type: 'effort_without_return',
        horizon: 'medium',
        state: 'stagnation',
        evidence: pushEvidence(state),
        metrics: {
          volumeDeltaPct: features.volumeDeltaPct,
          programCompletionPct: features.programCompletionPct
        },
        confidence: relationConfidence(adherence, load),
        relevance: 0.88,
        novelty: 0.85,
        actionability: 0.7,
        severity: 0.35,
        context: ctx
      })
    );
  }

  if (recoveryDown && perfDown) {
    out.push(
      candidate({
        id: 'relation.recovery_limiting',
        type: 'recovery_limiting',
        horizon: 'short',
        state: 'recovery',
        evidence: pushEvidence(state),
        metrics: {
          sleepDeltaPct: features.sleepDeltaPct,
          performanceMomentumPct: features.performanceMomentumPct
        },
        confidence: relationConfidence(recovery, performance),
        relevance: 0.87,
        novelty: 0.83,
        actionability: 0.74,
        severity: 0.55,
        context: ctx
      })
    );
  }

  if (!volUp && perfUp && recoveryOk) {
    out.push(
      candidate({
        id: 'relation.efficient_progression',
        type: 'efficient_progression',
        horizon: 'long',
        state: 'progression',
        evidence: pushEvidence(state),
        metrics: { performanceMomentumPct: features.performanceMomentumPct },
        confidence: relationConfidence(performance, recovery),
        relevance: 0.84,
        novelty: 0.78,
        actionability: 0.48,
        severity: 0.1,
        context: ctx
      })
    );
  }

  if (lifePhase === 'RETURNING' && (perfUp || perfStable) && !perfDown) {
    out.push(
      candidate({
        id: 'relation.successful_return',
        type: 'successful_return',
        horizon: 'long',
        state: 'return',
        evidence: pushEvidence(state),
        metrics: { volumeDeltaPct: features.volumeDeltaPct },
        confidence: Math.max(0.62, relationConfidence(performance, load)),
        relevance: 0.86,
        novelty: 0.87,
        actionability: 0.52,
        severity: 0.12,
        context: ctx
      })
    );
  }

  if (lifePhase === 'PLATEAU' && volUp && perfHolding && !perfUp) {
    out.push(
      candidate({
        id: 'relation.plateau_despite_volume',
        type: 'plateau_despite_volume',
        horizon: 'medium',
        state: 'plateau',
        evidence: pushEvidence(state),
        metrics: { volumeDeltaPct: features.volumeDeltaPct },
        confidence: relationConfidence(load, performance),
        relevance: 0.85,
        novelty: 0.81,
        actionability: 0.68,
        severity: 0.4,
        context: ctx
      })
    );
  }

  if (volDown && perfHolding && programResponse.value === 'deloading') {
    out.push(
      candidate({
        id: 'relation.natural_deload',
        type: 'natural_deload',
        horizon: 'medium',
        state: 'deload',
        evidence: pushEvidence(state),
        metrics: { volumeDeltaPct: features.volumeDeltaPct },
        confidence: relationConfidence(load, performance, programResponse),
        relevance: 0.78,
        novelty: 0.75,
        actionability: 0.45,
        severity: 0.15,
        context: ctx
      })
    );
  }

  if (recovery.trend === 'rising' && perfDown) {
    out.push(
      candidate({
        id: 'relation.contradiction_sleep_up_perf_down',
        type: 'contradiction_sleep_perf',
        horizon: 'short',
        state: 'contradiction',
        evidence: pushEvidence(state),
        metrics: {
          sleepDeltaPct: features.sleepDeltaPct,
          performanceMomentumPct: features.performanceMomentumPct
        },
        confidence: relationConfidence(recovery, performance),
        relevance: 0.82,
        novelty: 0.9,
        actionability: 0.6,
        severity: 0.35,
        context: ctx
      })
    );
  }

  if (hasPr && fatigueUp && perfHolding) {
    out.push(
      candidate({
        id: 'relation.pr_under_fatigue',
        type: 'pr_under_fatigue',
        horizon: 'short',
        state: 'event',
        evidence: [
          ...(prEvent?.evidence || []),
          ...fatigue.evidence.slice(0, 2)
        ],
        metrics: {
          prReps: prEvent?.value ?? null,
          difficultyDeltaPct: features.difficultyDeltaPct
        },
        confidence: relationConfidence(fatigue, { confidence: prEvent?.confidence ?? 0.7 }),
        relevance: 0.89,
        novelty: 0.91,
        actionability: 0.65,
        severity: 0.4,
        context: { ...ctx, exerciseName: prEvent?.exerciseName }
      })
    );
  }

  if (
    state.adaptationCost === 'high' &&
    volUp &&
    perfHolding &&
    features.progressionEfficiency != null
  ) {
    out.push(
      candidate({
        id: 'relation.costly_progression',
        type: 'costly_progression',
        horizon: 'medium',
        state: 'efficiency',
        evidence: [
          `efficacité progression ~${features.progressionEfficiency}`,
          ...load.evidence.slice(0, 1)
        ],
        metrics: {
          volumeDeltaPct: features.volumeDeltaPct,
          progressionEfficiency: features.progressionEfficiency,
          performanceMomentumPct: features.performanceMomentumPct,
          progressionVelocityPerWeek: features.progressionVelocityPerWeek
        },
        confidence: relationConfidence(load),
        relevance: 0.86,
        novelty: 0.84,
        actionability: 0.68,
        severity: 0.38,
        context: ctx
      })
    );
  }

  if (hasPrOutlier && !hasPr) {
    out.push(
      candidate({
        id: 'relation.pr_outlier',
        type: 'pr_outlier',
        horizon: 'short',
        state: 'event',
        evidence: prEvent?.evidence || [],
        metrics: { prReps: prEvent?.value ?? null },
        confidence: prEvent?.confidence ?? 0.62,
        relevance: 0.8,
        novelty: 0.88,
        actionability: 0.55,
        severity: 0.2,
        context: { ...ctx, exerciseName: prEvent?.exerciseName }
      })
    );
  }

  if (levelEstablished && perfHolding) {
    out.push(
      candidate({
        id: 'relation.level_established',
        type: 'level_established',
        horizon: 'long',
        state: 'progression',
        evidence: levelEstablished.evidence,
        metrics: { maxReps: levelEstablished.maxReps },
        confidence: levelEstablished.confidence,
        relevance: 0.83,
        novelty: 0.79,
        actionability: 0.45,
        severity: 0.08,
        context: { ...ctx, exerciseName: levelEstablished.exerciseName }
      })
    );
  }

  const loadRisingTransition = stateTransitions.find(
    (t) => t.axis === 'load' && t.to === 'rising'
  );
  const perfRecoverTransition = stateTransitions.find(
    (t) => t.axis === 'performance' && t.from === 'declining'
  );
  if (loadRisingTransition && perfRecoverTransition) {
    out.push(
      candidate({
        id: 'relation.transition_volume_then_recovery',
        type: 'transition_narrative',
        horizon: 'medium',
        state: 'transition',
        evidence: [loadRisingTransition.narrative, perfRecoverTransition.narrative],
        metrics: {},
        confidence: relationConfidence(load, performance),
        relevance: 0.87,
        novelty: 0.92,
        actionability: 0.58,
        severity: 0.15,
        context: ctx
      })
    );
  } else if (stateTransitions[0]?.confidence >= 0.5) {
    const t0 = stateTransitions[0];
    out.push(
      candidate({
        id: `relation.transition.${t0.id}`,
        type: 'transition_narrative',
        horizon: 'medium',
        state: 'transition',
        evidence: [t0.narrative],
        metrics: {},
        confidence: t0.confidence,
        relevance: 0.8,
        novelty: 0.9,
        actionability: 0.5,
        severity: 0.12,
        context: ctx
      })
    );
  }

  if (
    features.progressionAcceleration != null &&
    features.progressionAcceleration >= 5 &&
    perfUp
  ) {
    out.push(
      candidate({
        id: 'relation.progression_accelerating',
        type: 'progression_accelerating',
        horizon: 'medium',
        state: 'progression',
        evidence: [
          `accélération progression ~+${features.progressionAcceleration} reps/sem²`,
          ...(performance.evidence.slice(0, 1))
        ],
        metrics: {
          progressionVelocityPerWeek: features.progressionVelocityPerWeek,
          progressionAcceleration: features.progressionAcceleration
        },
        confidence: Math.max(0.55, performance.confidence),
        relevance: 0.84,
        novelty: 0.86,
        actionability: 0.52,
        severity: 0.1,
        context: ctx
      })
    );
  }

  const graphCtx = buildRelationContext({
    state,
    enrichment: meta.enrichment,
    assessment: meta.assessment,
    stateTransitions,
    events
  });
  const graphHits = evaluateRelationGraph(graphCtx);
  const existingIds = new Set(out.map((r) => r.id));
  graphHits.forEach((hit) => {
    if (!existingIds.has(hit.id)) {
      out.push(hit);
      existingIds.add(hit.id);
    }
  });

  return out.filter(Boolean).sort((a, b) => b.relevance * b.confidence - a.relevance * a.confidence);
}

/**
 * Convertit un InterpretationCandidate en candidat legacy pour la sélection existante.
 * @param {InterpretationCandidate} interp
 * @returns {{ id: string, horizon: string, pillar: string, weight: number, text: string, interpretation?: InterpretationCandidate }}
 */
export function interpretationToLegacyCandidate(interp) {
  if (!interp?.text) return null;
  const weight = Math.round(
    62 + interp.relevance * 22 + interp.confidence * 12 + (interp.novelty ?? 0) * 6
  );
  return {
    id: interp.id,
    horizon: interp.horizon,
    pillar: interp.pillar,
    weight: Math.min(92, weight),
    text: interp.text,
    interpretation: interp
  };
}
