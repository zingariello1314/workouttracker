/**
 * v4 — Single source of truth pour la charge (globalLoadFactor).
 *
 * Hiérarchie (dominance décroissante) :
 * 1. Global Load Engine → scalaire unique + trace causale
 * 2. Distribution (caps familles / muscles fins) — dérivé du scalaire
 * 3. Recovery nerveux — flags booléens (plyo, fractionné), pas de re-volume
 * 4. Session limits — plafonds dérivés du scalaire (pas de 2e index volume)
 * 5. Génération — applique effectiveVolumeFactor une fois sur le schedule
 * 6. Live — cycle semaine + micro session (≤12 %), sans recalcul volumeResponse
 */

export const LOAD_ENGINE_VERSION = 5;

const ARCHETYPE_ENVELOPE = {
  hybrid_street_home_strict: { center: 1, min: 0.86, max: 1.04 },
  hybrid_street_home_dense: { center: 1.04, min: 0.9, max: 1.12 },
  street_intermediate: { center: 1, min: 0.88, max: 1.08 },
  gym_hypertrophy_5d: { center: 1.02, min: 0.9, max: 1.1 },
  busy_minimum: { center: 0.78, min: 0.68, max: 0.88 },
  recovery_sensitive: { center: 0.74, min: 0.66, max: 0.86 },
  endurance_hybrid: { center: 0.96, min: 0.88, max: 1.05 },
  advanced_street_volume: { center: 1.08, min: 0.94, max: 1.14 }
};

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

/**
 * @param {object} p
 * @returns {Array<{ key: string, delta: number, reason: string }>}
 */
function collectStructuralSignals(constraints = {}) {
  const signals = [];
  if (constraints.forceRecoveryMode) {
    signals.push({ key: 'recovery_mode', delta: -0.14, reason: 'Mode récupération (quiz)' });
  }
  const rec = Number(constraints.recoveryScore);
  if (Number.isFinite(rec)) {
    if (rec >= 78) signals.push({ key: 'recovery_high', delta: 0.04, reason: 'Bonne récupération déclarée' });
    else if (rec < 42) signals.push({ key: 'recovery_low', delta: -0.1, reason: 'Récupération limitée (sommeil/stress)' });
    else if (rec < 52) signals.push({ key: 'recovery_mid_low', delta: -0.05, reason: 'Récupération moyenne-basse' });
  }
  return signals;
}

function collectHistorySignals({ trainingEvidence = null, loadRatio = null }) {
  const signals = [];
  const ev = trainingEvidence;
  if (!ev || ev.maturity === 'none') {
    if (loadRatio != null && loadRatio > 1.05) {
      signals.push({
        key: 'nervous_overload',
        delta: -0.04,
        reason: 'Charge nerveuse hebdo élevée'
      });
    }
    return signals;
  }

  const reg = Number(ev.regularityScore);
  if (reg >= 0.88 && ev.maturity === 'rich') {
    signals.push({ key: 'regularity_high', delta: 0.05, reason: 'Bonne régularité sur 28 j' });
  } else if (reg < 0.42) {
    signals.push({ key: 'regularity_low', delta: -0.08, reason: 'Régularité faible vs objectif quiz' });
  } else if (reg > 0.72) {
    signals.push({ key: 'regularity_ok', delta: 0.02, reason: 'Régularité correcte' });
  }

  const align = ev.sessionLoadAlignment28;
  if (align?.sessionDaysScored >= 3 && align.avgScore0to100 != null) {
    if (align.avgScore0to100 >= 88) {
      signals.push({ key: 'alignment_high', delta: 0.04, reason: 'Tu atteins souvent le haut des fourchettes' });
    } else if (align.avgScore0to100 < 52) {
      signals.push({ key: 'alignment_low', delta: -0.04, reason: 'Écart fréquent prévu / réalisé' });
    }
  }

  if (ev.maturity === 'rich' && ev.restGap14 >= 9) {
    signals.push({ key: 'rest_gap', delta: -0.07, reason: 'Reprise après plusieurs jours sans activité' });
  }

  if (ev.adjustments?.adherenceVolumeCut) {
    signals.push({ key: 'adherence', delta: -0.06, reason: 'Adhérence en baisse — volume modéré' });
  }

  const a = ev.adjustments || {};
  if (a.volumeMulDelta) {
    signals.push({
      key: 'history_delta',
      delta: clamp(-0.1, 0.1, a.volumeMulDelta),
      reason: 'Ajustement historique Sport (pivot / reprise)'
    });
  }

  if (loadRatio != null && Number.isFinite(loadRatio)) {
    if (loadRatio > 1.05) {
      signals.push({
        key: 'nervous_overload',
        delta: -0.06 * Math.min(1.5, loadRatio - 1),
        reason: 'Charge nerveuse hebdo au-dessus de ta tolérance'
      });
    } else if (loadRatio < 0.72 && ev.maturity === 'rich') {
      signals.push({ key: 'nervous_headroom', delta: 0.02, reason: 'Marge nerveuse sur la semaine type' });
    }
  }

  return signals;
}

function sumDeltas(signals) {
  return signals.reduce((a, s) => a + (s.delta || 0), 0);
}

/**
 * Canaux orthogonaux : structurel (quiz/récup) vs historique (logs).
 */
function computeOrthogonalFactors(envelope, constraints, trainingEvidence, loadRatio) {
  const structuralSignals = collectStructuralSignals(constraints);
  const historySignals = collectHistorySignals({ trainingEvidence, loadRatio });

  let structural = envelope.center + sumDeltas(structuralSignals);
  let history = envelope.center + sumDeltas(historySignals);

  structural = clamp(envelope.min, envelope.max, structural);
  history = clamp(envelope.min, envelope.max, history);

  const globalLoadFactor = Math.round(clamp(envelope.min, envelope.max, structural * 0.55 + history * 0.45) * 1000) / 1000;
  const distributionFactor = Math.round(Math.sqrt(structural * history) * 1000) / 1000;
  const sessionLimitsFactor = Math.round(Math.min(structural, globalLoadFactor) * 1000) / 1000;

  return {
    structuralLoadFactor: Math.round(structural * 1000) / 1000,
    historyLoadFactor: Math.round(history * 1000) / 1000,
    globalLoadFactor,
    distributionFactor: clamp(envelope.min, envelope.max, distributionFactor),
    sessionLimitsFactor: clamp(envelope.min, envelope.max, sessionLimitsFactor),
    structuralSignals,
    historySignals
  };
}

/**
 * @param {object} input
 * @param {string} input.archetypeId
 * @param {object} [input.constraints]
 * @param {object|null} [input.trainingEvidence]
 * @param {number} [input.progressionCycleFactor] — semaine cycle (hors enveloppe archétype)
 * @param {number|null} [input.loadRatio] — post profils semaine
 */
export function computeGlobalLoadState(input = {}) {
  const archetypeId = input.archetypeId || 'hybrid_street_home_strict';
  const envelope = ARCHETYPE_ENVELOPE[archetypeId] || { center: 1, min: 0.85, max: 1.1 };
  const ortho = computeOrthogonalFactors(
    envelope,
    input.constraints,
    input.trainingEvidence,
    input.loadRatio
  );
  const signals = [...ortho.structuralSignals, ...ortho.historySignals];

  const globalLoadFactor = ortho.globalLoadFactor;
  const progressionCycleFactor = clamp(0.65, 1.05, Number(input.progressionCycleFactor) || 1);
  const effectiveVolumeFactor = Math.round(globalLoadFactor * progressionCycleFactor * 1000) / 1000;

  const trace = [
    {
      layer: 'envelope',
      key: archetypeId,
      value: envelope.center,
      reason: `Enveloppe archétype (${envelope.min}–${envelope.max})`
    },
    {
      layer: 'channel',
      key: 'structuralLoadFactor',
      value: ortho.structuralLoadFactor,
      reason: 'Canal structurel (récupération / mode)'
    },
    {
      layer: 'channel',
      key: 'historyLoadFactor',
      value: ortho.historyLoadFactor,
      reason: 'Canal historique (logs Sport)'
    },
    ...signals.map((s) => ({ layer: 'signal', ...s, value: s.delta })),
    {
      layer: 'scalar',
      key: 'globalLoadFactor',
      value: globalLoadFactor,
      reason: 'Mix 55 % structurel + 45 % historique'
    },
    {
      layer: 'derived',
      key: 'distributionFactor',
      value: ortho.distributionFactor,
      reason: 'Dérivé caps familles (√ structurel × historique)'
    },
    {
      layer: 'derived',
      key: 'sessionLimitsFactor',
      value: ortho.sessionLimitsFactor,
      reason: 'Dérivé limites séance (min structurel, global)'
    }
  ];

  if (progressionCycleFactor < 0.99) {
    trace.push({
      layer: 'cycle',
      key: 'progressionCycleFactor',
      value: progressionCycleFactor,
      reason: 'Phase du cycle (adaptation / deload) — canal séparé'
    });
  }

  let summaryFr = `Charge globale : ${Math.round(globalLoadFactor * 100)} %`;
  if (globalLoadFactor >= 1.05) summaryFr = 'Volume relevé prudemment (historique + récupération OK)';
  else if (globalLoadFactor <= 0.82) summaryFr = 'Volume modéré (récupération ou adhérence)';
  else summaryFr = 'Volume équilibré selon ton profil et tes logs';

  return {
    version: LOAD_ENGINE_VERSION,
    archetypeId,
    envelope,
    globalLoadFactor,
    structuralLoadFactor: ortho.structuralLoadFactor,
    historyLoadFactor: ortho.historyLoadFactor,
    distributionFactor: ortho.distributionFactor,
    sessionLimitsFactor: ortho.sessionLimitsFactor,
    progressionCycleFactor,
    effectiveVolumeFactor,
    signals,
    trace,
    summaryFr
  };
}

/**
 * Applique le scalaire unique aux deformers — seul endroit où volumeMul / caps sont dérivés.
 */
export function deformersFromGlobalLoad(baseDeformers, loadState) {
  const f = loadState?.globalLoadFactor ?? 1;
  const limitsF = loadState?.sessionLimitsFactor ?? f;
  const base = baseDeformers || {};
  const countMul = base.exerciseCountMul ?? 1;

  const maxEx = Math.round(clamp(4, 10, (base.maxExercisesPerSession ?? 7) * limitsF * countMul));
  const maxSets = Math.round(clamp(14, 32, (base.maxEffectiveSetsPerSession ?? 25) * limitsF));
  const maxHeavy = Math.round(clamp(1, 3, (base.maxHeavyBlocksPerSession ?? 2) * (0.88 + f * 0.12)));
  const maxPull = Math.round(clamp(2, 5, (base.maxPullingPatternsPerSession ?? 3) * (0.9 + f * 0.1)));

  return {
    ...base,
    preferredGroupWeights: { ...(base.preferredGroupWeights || {}) },
    volumeMul: f,
    maxExercisesPerSession: maxEx,
    maxEffectiveSetsPerSession: maxSets,
    maxHeavyBlocksPerSession: maxHeavy,
    maxPullingPatternsPerSession: maxPull,
    globalLoadFactor: f,
    effectiveVolumeFactor: loadState?.effectiveVolumeFactor ?? f,
    globalLoadTrace: loadState?.trace ?? []
  };
}

/**
 * Après analyse nerveuse : une seule mise à jour du scalaire (pas de 2e compression).
 */
export function refineGlobalLoadState(loadState, loadAnalysis) {
  if (!loadState || !loadAnalysis) return loadState;
  return computeGlobalLoadState({
    archetypeId: loadState.archetypeId,
    constraints: loadState._constraints,
    trainingEvidence: loadState._trainingEvidence,
    progressionCycleFactor: loadState.progressionCycleFactor,
    loadRatio: loadAnalysis.loadRatio ?? null
  });
}

/** Attache contexte pour refine (interne pipeline). */
export function attachLoadContextForRefine(state, constraints, trainingEvidence) {
  return { ...state, _constraints: constraints, _trainingEvidence: trainingEvidence };
}

/**
 * Live : perturbation bornée (bande dynamique via shadow), ne recalcule pas globalLoadFactor.
 * @param {number} frozenGlobalLoad — persisté à la génération
 * @param {{ min?: number, max?: number, allowUplift?: boolean }} [opts.liveBand]
 */
export function computeLiveSessionAdjustment(frozenGlobalLoad, opts = {}) {
  const missed = Number(opts.missedFactor);
  const daily = Number(opts.dailyFactor);
  const uplift = Number(opts.dailyUpliftFactor);
  const band = opts.liveBand || { min: 0.85, max: 1.05, allowUplift: false };
  const minMul = band.min ?? 0.85;
  const maxMul = band.max ?? 1.05;

  let sessionMul = 1;
  const trace = [];

  if (Number.isFinite(missed) && missed < 1) {
    sessionMul *= missed;
    trace.push({ layer: 'live', key: 'missed_yesterday', value: missed, reason: 'Séance veille manquée' });
  }
  if (Number.isFinite(daily) && daily < 1) {
    sessionMul *= daily;
    trace.push({ layer: 'live', key: 'daily_compression', value: daily, reason: 'Charge récente 72 h' });
  }
  if (band.allowUplift && Number.isFinite(uplift) && uplift > 1) {
    sessionMul *= Math.min(uplift, 1.08);
    trace.push({ layer: 'live', key: 'headroom_uplift', value: uplift, reason: 'Marge détectée (shadow) — séance peut monter légèrement' });
  }

  sessionMul = clamp(minMul, maxMul, sessionMul);
  const effective = Math.round(frozenGlobalLoad * sessionMul * 1000) / 1000;

  return {
    frozenGlobalLoad,
    liveSessionMul: sessionMul,
    effectiveSessionFactor: effective,
    liveBand: { min: minMul, max: maxMul },
    trace,
    maxSwingApplied: sessionMul !== 1
  };
}

export { ARCHETYPE_ENVELOPE };
