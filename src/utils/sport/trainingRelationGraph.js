/**
 * Bibliothèque de relations déclaratives (graphe) — règles composées extensibles.
 */

/**
 * @typedef {object} RelationContext
 * @property {import('./userTrainingState.js').UserTrainingState} state
 * @property {object} features
 * @property {boolean} volUp
 * @property {boolean} volDown
 * @property {boolean} perfUp
 * @property {boolean} perfStable
 * @property {boolean} perfDown
 * @property {boolean} perfHolding
 * @property {boolean} recoveryDown
 * @property {boolean} recoveryOk
 * @property {boolean} fatigueUp
 * @property {boolean} adherenceHigh
 * @property {boolean} adherenceLow
 * @property {object} enrichment
 * @property {object} assessment
 * @property {import('./trainingStateTransitions.js').StateTransition[]} stateTransitions
 * @property {import('./trainingEventDetector.js').TrainingEvent[]} events
 */

/** @type {Array<(ctx: RelationContext) => import('./trainingRelationEngine.js').InterpretationCandidate|null>} */
export const RELATION_GRAPH_RULES = [];

function rule(def) {
  RELATION_GRAPH_RULES.push((ctx) => {
    if (!def.when(ctx)) return null;
    const confidence = typeof def.confidence === 'function' ? def.confidence(ctx) : def.confidence;
    const relevance = def.relevance ?? 0.8;
    if ((confidence ?? 0) < 0.45 || relevance < 0.45) return null;
    return {
      id: def.id,
      type: def.type,
      pillar: def.pillar || 'interpretation',
      horizon: def.horizon || 'medium',
      state: def.state || def.type,
      evidence: def.evidence?.(ctx) || [],
      metrics: def.metrics?.(ctx) || {},
      confidence,
      relevance,
      novelty: def.novelty ?? 0.82,
      actionability: def.actionability ?? 0.55,
      severity: def.severity ?? 0.2,
      context: { ...(ctx.state?.context || {}), phase: ctx.state?.lifePhase }
    };
  });
}

rule({
  id: 'relation.sleep_good_perf_up',
  type: 'recovery_supports_progress',
  horizon: 'medium',
  when: (c) => c.recoveryOk && c.perfUp && !c.volDown,
  confidence: (c) => Math.min(c.state.recovery.confidence, c.state.performance.confidence),
  relevance: 0.84,
  evidence: (c) => [...c.state.recovery.evidence.slice(0, 1), ...c.state.performance.evidence.slice(0, 1)],
  metrics: (c) => ({ sleepDeltaPct: c.features.sleepDeltaPct })
});

rule({
  id: 'relation.volume_down_recovery_up',
  type: 'recovery_rebound',
  horizon: 'medium',
  when: (c) => c.volDown && c.recoveryOk && c.state.recovery.trend === 'rising',
  confidence: (c) => Math.min(c.state.load.confidence, c.state.recovery.confidence) * 0.9,
  relevance: 0.81,
  evidence: (c) => [...c.state.load.evidence.slice(0, 1), ...c.state.recovery.evidence.slice(0, 1)],
  metrics: (c) => ({ volumeDeltaPct: c.features.volumeDeltaPct, sleepDeltaPct: c.features.sleepDeltaPct })
});

rule({
  id: 'relation.push_pull_imbalance',
  type: 'structural_imbalance',
  horizon: 'medium',
  when: (c) => {
    const r = c.enrichment?.pushPull?.ratio;
    return r != null && (r >= 1.65 || r <= 0.75);
  },
  confidence: () => 0.74,
  relevance: 0.79,
  evidence: (c) => {
    const pp = c.enrichment.pushPull;
    return [`push/pull ${pp.ratio} (${pp.pushPct} % push)`];
  },
  metrics: (c) => ({
    pushPullRatio: c.enrichment?.pushPull?.ratio,
    pushPct: c.enrichment?.pushPull?.pushPct
  })
});

rule({
  id: 'relation.stretch_gap',
  type: 'adherence_gap',
  horizon: 'long',
  when: (c) => {
    const comp = c.enrichment?.completion;
    return comp?.exoPct != null && comp?.stretchPct != null && comp.exoPct - comp.stretchPct >= 22;
  },
  confidence: () => 0.72,
  relevance: 0.76,
  evidence: (c) => {
    const comp = c.enrichment.completion;
    return [`exos ~${comp.exoPct} % vs étirements ~${comp.stretchPct} %`];
  },
  metrics: (c) => ({
    exoPct: c.enrichment?.completion?.exoPct,
    stretchPct: c.enrichment?.completion?.stretchPct
  })
});

rule({
  id: 'relation.beginner_consistency_win',
  type: 'beginner_adherence',
  horizon: 'long',
  when: (c) =>
    (c.state.lifePhase === 'BEGINNER' || c.state.lifePhase === 'DEVELOPING') &&
    c.adherenceHigh &&
    c.perfHolding,
  confidence: (c) => Math.min(c.state.adherence.confidence, 0.8),
  relevance: 0.83,
  evidence: (c) => ['phase débutant — la régularité compte plus que le volume ou les records'],
  actionability: 0.7
});

rule({
  id: 'relation.advanced_micro_progress',
  type: 'advanced_phase',
  horizon: 'long',
  when: (c) =>
    c.state.context?.tier === 'Avancé' &&
    c.perfHolding &&
    !c.volUp &&
    (c.features.progressionVelocityPerWeek ?? 0) > 0 &&
    (c.features.progressionVelocityPerWeek ?? 0) < 15,
  confidence: () => 0.68,
  relevance: 0.78,
  evidence: (c) => [
    `micro-progression ~+${c.features.progressionVelocityPerWeek} reps/sem — normal à niveau avancé`
  ],
  metrics: (c) => ({ progressionVelocityPerWeek: c.features.progressionVelocityPerWeek })
});

rule({
  id: 'relation.low_adherence_high_history',
  type: 'veteran_slump',
  horizon: 'medium',
  when: (c) =>
    c.adherenceLow &&
    (c.assessment?.lifetimeReps ?? 0) >= 12000 &&
    (c.assessment?.regularityScore ?? 1) < 0.5,
  confidence: () => 0.7,
  relevance: 0.8,
  evidence: () => ['historique riche mais régularité récente basse — phase maintenance possible'],
  actionability: 0.68
});

rule({
  id: 'relation.motivation_low_plan_ok',
  type: 'motivation_gap',
  horizon: 'medium',
  when: (c) => {
    const m = c.enrichment?.feedback?.motivation;
    return m != null && m <= 5.5 && c.adherenceHigh;
  },
  confidence: () => 0.66,
  relevance: 0.77,
  evidence: (c) => [`motivation ~${c.enrichment.feedback.motivation}/10 malgré bonne exécution du plan`],
  actionability: 0.72
});

rule({
  id: 'relation.gtg_supports_frequency',
  type: 'gtg_synergy',
  horizon: 'long',
  when: (c) => {
    const gtgDays = c.assessment?.adaptiveKpis?.gtgDays;
    return gtgDays != null && gtgDays >= 6 && c.volUp;
  },
  confidence: () => 0.65,
  relevance: 0.74,
  evidence: (c) => [
    `GTG actif (${c.assessment.adaptiveKpis.gtgDays} j.) en parallèle de la montée de volume`
  ],
  actionability: 0.5
});

rule({
  id: 'relation.streak_momentum',
  type: 'consistency_streak',
  horizon: 'long',
  when: (c) => (c.enrichment?.streak?.current ?? 0) >= 7 && c.perfHolding,
  confidence: () => 0.72,
  relevance: 0.8,
  evidence: (c) => [`série ${c.enrichment.streak.current} j. — momentum comportemental favorable`],
  metrics: (c) => ({ streak: c.enrichment?.streak?.current })
});

rule({
  id: 'relation.undertraining_signal',
  type: 'undertraining',
  horizon: 'medium',
  when: (c) => c.volDown && c.perfDown && !c.fatigueUp,
  confidence: (c) => Math.min(c.state.load.confidence, c.state.performance.confidence) * 0.85,
  relevance: 0.79,
  evidence: (c) => [...c.state.load.evidence.slice(0, 1), ...c.state.performance.evidence.slice(0, 1)],
  severity: 0.3
});

rule({
  id: 'relation.high_efficiency',
  type: 'efficient_training',
  horizon: 'long',
  when: (c) =>
    c.state.adaptationCost === 'low' &&
    c.perfUp &&
    !c.volUp,
  confidence: () => 0.74,
  relevance: 0.82,
  evidence: (c) => [
    `efficacité élevée (coût ${c.state.adaptationCost})`,
    ...c.state.performance.evidence.slice(0, 1)
  ],
  metrics: (c) => ({ progressionEfficiency: c.features.progressionEfficiency })
});

rule({
  id: 'relation.stress_high_load_up',
  type: 'stress_load',
  horizon: 'short',
  when: (c) => c.volUp && c.recoveryDown && c.state.recovery.evidence.some((e) => /stress/i.test(e)),
  confidence: (c) => Math.min(c.state.load.confidence, c.state.recovery.confidence),
  relevance: 0.85,
  evidence: (c) => c.state.recovery.evidence.filter((e) => /stress|sommeil/i.test(e)).slice(0, 2),
  severity: 0.5,
  actionability: 0.7
});

/**
 * @param {RelationContext} ctx
 * @returns {import('./trainingRelationEngine.js').InterpretationCandidate[]}
 */
export function evaluateRelationGraph(ctx) {
  if (!ctx?.state) return [];
  const out = [];
  const seen = new Set();
  RELATION_GRAPH_RULES.forEach((fn) => {
    const hit = fn(ctx);
    if (!hit || seen.has(hit.id)) return;
    seen.add(hit.id);
    out.push(hit);
  });
  return out.sort((a, b) => b.relevance * b.confidence - a.relevance * a.confidence);
}

/**
 * @param {object} params
 * @returns {RelationContext}
 */
export function buildRelationContext(params) {
  const {
    state,
    enrichment = null,
    assessment = null,
    stateTransitions = [],
    events = []
  } = params;

  const { load, performance, recovery, fatigue, adherence, programResponse, features } = state;
  const volUp = load.trend === 'rising' || (features.volumeDeltaPct ?? 0) >= 12;
  const volDown = load.trend === 'falling' || (features.volumeDeltaPct ?? 0) <= -10;
  const perfUp =
    performance.trend === 'rising' ||
    performance.value === 'slightly_improving' ||
    performance.value === 'improving';
  const perfStable = performance.trend === 'stable' || performance.value === 'stable';
  const perfDown = performance.trend === 'falling' || performance.value === 'declining';
  const perfHolding = !perfDown;
  const recoveryDown =
    recovery.trend === 'falling' ||
    recovery.value === 'insufficient' ||
    (features.sleepDeltaPct ?? 0) <= -8;
  const recoveryOk = recovery.value === 'sufficient' && recovery.trend !== 'falling';
  const fatigueUp =
    fatigue.trend === 'rising' || fatigue.value === 'high' || (features.difficultyDeltaPct ?? 0) >= 12;
  const adherenceHigh = adherence.value === 'high';
  const adherenceLow = adherence.value === 'low';

  return {
    state,
    features,
    volUp,
    volDown,
    perfUp,
    perfStable,
    perfDown,
    perfHolding,
    recoveryDown,
    recoveryOk,
    fatigueUp,
    adherenceHigh,
    adherenceLow,
    enrichment,
    assessment,
    stateTransitions,
    events
  };
}
