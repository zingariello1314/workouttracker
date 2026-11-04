/**
 * F3 — Composition multi-faits (preuves structurées).
 *
 * Compose à partir de trajectoires / métriques déjà calculées — jamais depuis
 * le parsing de textes de discoveries. E0 non modifié.
 * F4 branche la narration depuis composedEvidence (opt-in, défaut actif).
 *
 * @see docs/analyses-documentation/moteur analyse v1/MATRICE-COMPOSITIONS-F3-2026-11-01.md
 */

import { applyComposedNarrationToDiscovery } from './recapComposedNarration';

/**
 * Attribution d’une hausse/baisse de volume de période.
 * @returns {{ kind: string, stance: string, detail: string, metrics: object }|null}
 */
export function classifyVolumeAttribution({
  windowSessionCount = 0,
  prevSessionCount = 0,
  meanPerSession = null,
  prevMeanPerSession = null,
  windowTotal = 0,
  prevComparable = 0
} = {}) {
  if (!(windowSessionCount >= 2) || !(prevSessionCount >= 1)) return null;
  if (meanPerSession == null || !(prevMeanPerSession > 0)) {
    // Approximation si moyenne précédente absente
    if (prevComparable > 0 && prevSessionCount > 0) {
      prevMeanPerSession = prevComparable / prevSessionCount;
    } else return null;
  }

  const sessionDelta = windowSessionCount - prevSessionCount;
  const perSessionPct =
    prevMeanPerSession > 0
      ? Math.round(((meanPerSession - prevMeanPerSession) / prevMeanPerSession) * 1000) / 10
      : null;
  const totalPct =
    prevComparable > 0
      ? Math.round(((windowTotal - prevComparable) / prevComparable) * 1000) / 10
      : null;

  const perNear =
    perSessionPct != null && Math.abs(perSessionPct) <= 8;
  const perMoved =
    perSessionPct != null && Math.abs(perSessionPct) >= 15;
  const freqMovedUp = sessionDelta >= 2;
  const freqMovedDown = sessionDelta <= -2;

  // Les deux leviers bougent : ne jamais dire « volume/séance reste proche »
  if (
    totalPct != null &&
    Math.abs(totalPct) >= 15 &&
    perMoved &&
    (freqMovedUp || freqMovedDown)
  ) {
    const freqBit = `${prevSessionCount} → ${windowSessionCount} séances`;
    const densBit = `≈${Math.round(prevMeanPerSession)} → ≈${Math.round(meanPerSession)} reps/séance (${perSessionPct > 0 ? '+' : ''}${perSessionPct} %)`;
    return {
      kind: totalPct > 0 ? 'combined_frequency_and_density_rise' : 'combined_frequency_and_density_decline',
      stance: 'probable',
      detail: `Le total change via les deux leviers à la fois : fréquence (${freqBit}) et volume par séance (${densBit}). On ne peut pas attribuer la variation à un seul facteur.`,
      metrics: { sessionDelta, perSessionPct, totalPct, windowSessionCount, prevSessionCount }
    };
  }

  // Hausse de total surtout via fréquence (séances ↑, volume/séance ≈ stable)
  if (freqMovedUp && totalPct != null && totalPct >= 15 && perNear) {
    return {
      kind: 'frequency_driven_total_rise',
      stance: 'probable',
      detail: `Le total de la période augmente surtout parce que tu as pratiqué plus souvent (${prevSessionCount} → ${windowSessionCount} séances), alors que le volume par séance reste proche (≈${Math.round(prevMeanPerSession)} → ≈${Math.round(meanPerSession)} reps, ${perSessionPct > 0 ? '+' : ''}${perSessionPct} %).`,
      metrics: { sessionDelta, perSessionPct, totalPct, windowSessionCount, prevSessionCount }
    };
  }

  // Baisse de total surtout via fréquence
  if (freqMovedDown && totalPct != null && totalPct <= -15 && perNear) {
    return {
      kind: 'frequency_driven_total_decline',
      stance: 'probable',
      detail: `Le total de la période diminue surtout parce que tu as moins de séances (${prevSessionCount} → ${windowSessionCount}), alors que le volume par séance reste proche (≈${Math.round(prevMeanPerSession)} → ≈${Math.round(meanPerSession)} reps, ${perSessionPct > 0 ? '+' : ''}${perSessionPct} %).`,
      metrics: { sessionDelta, perSessionPct, totalPct, windowSessionCount, prevSessionCount }
    };
  }

  // Contenu de séance change, fréquence stable
  if (Math.abs(sessionDelta) <= 1 && perMoved) {
    return {
      kind: perSessionPct > 0 ? 'per_session_driven_rise' : 'per_session_driven_decline',
      stance: 'probable',
      detail: `Le nombre de séances est resté proche (${prevSessionCount} → ${windowSessionCount}), mais le volume par séance a changé (≈${Math.round(prevMeanPerSession)} → ≈${Math.round(meanPerSession)}, ${perSessionPct > 0 ? '+' : ''}${perSessionPct} %).`,
      metrics: { sessionDelta, perSessionPct, totalPct, windowSessionCount, prevSessionCount }
    };
  }

  return null;
}

/**
 * Continuité du phénomène (pas seulement l’événement).
 */
export function classifyContinuity(trajectory) {
  if (!trajectory?.ok) {
    return { kind: 'insufficient', stance: 'indeterminate', detail: trajectory?.reason || null };
  }
  const mech = trajectory.setMechanism || {};
  const inst = trajectory.installation || {};
  const shape = trajectory.shape || {};
  const story = shape.primaryStory || null;

  if (mech.available && mech.maintained === false && (mech.kind || '').includes('more_sets')) {
    return {
      kind: 'punctual_format_spike',
      stance: 'established',
      detail: 'Augmentation de format observée sans reproduction sur les séances suivantes'
    };
  }
  if (mech.available && mech.maintained === true && (mech.kind === 'more_sets_same_reps' || mech.kind === 'same_sets_more_reps')) {
    if (inst.kind === 'installed' || inst.kind === 'installing' || inst.kind === 'repeated') {
      return {
        kind: 'consolidated_format',
        stance: 'probable',
        detail: 'Nouveau format de séries × reps reproduit sur plusieurs séances'
      };
    }
  }
  if (story === 'outlier_driven') {
    return {
      kind: 'isolated_outlier',
      stance: 'watch',
      detail: 'Écart tiré par une séance atypique'
    };
  }
  if (story === 'net_decline' && (shape.path === 'progressive_decline' || shape.kind === 'steady_decline')) {
    return {
      kind: 'confirmed_decline',
      stance: 'probable',
      detail: 'Recul confirmé sur plusieurs séances'
    };
  }
  if (story === 'recovered') {
    return {
      kind: 'decline_then_recovery',
      stance: 'probable',
      detail: 'Creux puis retour près du niveau de départ'
    };
  }
  if (story === 'plateau') {
    return {
      kind: 'stable_plateau',
      stance: 'probable',
      detail: 'Volume par séance récemment stable'
    };
  }
  if (inst.kind === 'returning') {
    return {
      kind: inst.sessionsInWindow >= 3 ? 'confirmed_return' : 'punctual_return',
      stance: inst.sessionsInWindow >= 3 ? 'probable' : 'established',
      detail: inst.detail || null
    };
  }
  if (inst.kind === 'first_session') {
    return { kind: 'single_introduction', stance: 'established', detail: inst.detail };
  }
  if (story === 'net_rise' || story === 'partial_recovery' || story === 'net_decline') {
    return { kind: 'directional_change', stance: 'probable', detail: story };
  }
  return { kind: 'unclear', stance: 'indeterminate', detail: shape.detail || null };
}

/**
 * Lexique autorisé : performance vs volume enregistré.
 */
export function resolveVolumeLexicon(trajectory) {
  const mech = trajectory?.setMechanism;
  const peers = trajectory?.peers;
  const comparableStructure =
    Boolean(mech?.available) &&
    (mech.granularity === 'full' || mech.granularity === 'partial') &&
    (mech.kind === 'same_sets_fewer_reps' ||
      mech.kind === 'same_sets_more_reps' ||
      mech.kind === 'more_sets_same_reps' ||
      mech.kind === 'fewer_sets_same_reps' ||
      mech.kind === 'mixed');
  const peersOk =
    peers?.available &&
    peers.verdict &&
    peers.verdict !== 'insufficient';

  if (comparableStructure && peersOk) {
    return {
      subjectNoun: 'performances',
      maySayPerformance: true,
      reason: 'structure de séries lisible + témoins comparables'
    };
  }
  return {
    subjectNoun: 'volume de répétitions enregistré',
    maySayPerformance: false,
    reason: !mech?.available
      ? 'séries non trusted — volume enregistré seulement'
      : !peersOk
        ? 'témoins insuffisants pour parler de performance relative'
        : 'conditions de structure non assez comparables'
  };
}

export function forbiddenConclusionsFor(trajectory, continuity, lexicon) {
  const out = [
    'adaptation_physiologique',
    'causalite_sommeil_performance',
    'diagnostic_medical'
  ];
  if (!lexicon?.maySayPerformance) out.push('baisse_ou_hausse_de_performance_globale');
  if (continuity?.kind === 'punctual_format_spike') out.push('consolidation_durable');
  if (continuity?.kind === 'punctual_return') out.push('reprise_durable');
  if (continuity?.kind === 'isolated_outlier') out.push('tendance_lineaire');
  if (trajectory?.peers?.verdict === 'shared') out.push('recul_isole_a_cet_exercice');
  if (trajectory?.peers?.verdict === 'insufficient') out.push('force_de_famille_intacte');
  if (!trajectory?.setMechanism?.available) out.push('decomposition_series_vs_reps');
  return out;
}

/**
 * Contrat composé attachable à metrics.composedEvidence.
 */
export function buildComposedEvidenceFromTrajectory(trajectory, { volumeAttribution = null } = {}) {
  if (!trajectory?.ok) {
    return {
      ok: false,
      reason: trajectory?.reason || 'trajectory_unavailable',
      composed: false
    };
  }

  const continuity = classifyContinuity(trajectory);
  const lexicon = resolveVolumeLexicon(trajectory);
  const attribution =
    volumeAttribution ||
    classifyVolumeAttribution({
      windowSessionCount: trajectory.volume?.windowSessionCount,
      prevSessionCount: trajectory.volume?.prevSessionCount,
      meanPerSession: trajectory.volume?.meanPerSession,
      prevMeanPerSession:
        trajectory.volume?.prevSessionCount > 0 && trajectory.volume?.prevComparable > 0
          ? trajectory.volume.prevComparable / trajectory.volume.prevSessionCount
          : null,
      windowTotal: trajectory.volume?.windowTotal,
      prevComparable: trajectory.volume?.prevComparable
    });

  const observations = (trajectory.sessions?.trace || []).map((s) => ({
    date: s.date,
    // metrics.sessions sérialise parfois `reps` (trajectoryToMetrics) au lieu de totalReps
    totalReps: s.totalReps != null ? s.totalReps : s.reps != null ? s.reps : null,
    setCount: s.setCount,
    setReps: s.setReps,
    setsTrusted: s.setsTrusted,
    schemeLabel: s.schemeLabel,
    inSelectedWindow: trajectory.temporalScope?.windowDates?.includes(s.date) ?? null
  }));

  const f = trajectory.findings || {};
  const levels = {
    observed: f.main
      ? { stance: f.main.stance, text: f.main.text }
      : null,
    interpreted: f.mechanism
      ? { stance: f.mechanism.stance, text: f.mechanism.text }
      : attribution
        ? { stance: attribution.stance, text: attribution.detail }
        : null,
    implication: f.implication
      ? { stance: f.implication.stance, text: f.implication.text, ruleId: f.implication.ruleId }
      : null
  };

  const factCount =
    (f.main ? 1 : 0) +
    (f.mechanism ? 1 : 0) +
    (f.peerScope ? 1 : 0) +
    (f.pathNote ? 1 : 0) +
    (attribution ? 1 : 0) +
    (continuity.kind !== 'unclear' && continuity.kind !== 'insufficient' ? 1 : 0);

  return {
    ok: true,
    composed: factCount >= 2,
    factCount,
    primaryPhenomenon: {
      exerciseId: trajectory.identity?.id || null,
      name: trajectory.identity?.name || null,
      family: trajectory.identity?.family || null,
      mode: trajectory.mode,
      primaryStory: trajectory.shape?.primaryStory || null,
      path: trajectory.shape?.path || null,
      earlyMean: trajectory.shape?.earlyMean ?? null,
      lateMean: trajectory.shape?.lateMean ?? null,
      deltaPct: trajectory.shape?.deltaPct ?? null
    },
    windows: {
      primary: trajectory.windows?.selected || null,
      comparison: trajectory.windows?.previousComparable || null,
      historical: trajectory.temporalScope?.interpretingWithHistory
        ? {
            role: 'historicalContextWindow',
            arcStart: trajectory.temporalScope.arcStartDate,
            arcEnd: trajectory.temporalScope.arcEndDate,
            contextBefore: trajectory.temporalScope.contextSessionCountBeforeWindow
          }
        : null
    },
    observations,
    decomposition: trajectory.setMechanism?.available
      ? {
          kind: trajectory.setMechanism.kind,
          before: trajectory.setMechanism.before,
          after: trajectory.setMechanism.after,
          maintained: trajectory.setMechanism.maintained,
          granularity: trajectory.setMechanism.granularity,
          detail: trajectory.setMechanism.detail
        }
      : { available: false, reason: trajectory.setMechanism?.reason || null },
    continuity,
    volumeAttribution: attribution,
    comparators: {
      verdict: trajectory.peers?.verdict || 'insufficient',
      items: trajectory.peers?.items || [],
      detail: trajectory.peers?.detail || null,
      skipped: trajectory.peers?.skippedSameLabel || []
    },
    lexicon,
    levels,
    proof: {
      positions: f.positions || [],
      limits: f.limits || [],
      stances: (f.positions || []).map((p) => `${p.claim}:${p.stance}`)
    },
    caveats: (f.limits || []).map((l) => l.text),
    forbiddenConclusions: forbiddenConclusionsFor(trajectory, continuity, lexicon),
    conclusion: levels.interpreted || levels.observed,
    sources: ['buildExerciseTrajectory', 'readTrustedSessionSets', 'analyzePeers', 'classifyInstallation']
  };
}

/**
 * Enrichit une discovery existante sans toucher score/kind (E0 intact).
 * @param {object} discovery
 * @param {object|null} trajectory
 * @param {{ getExerciseNameById?: Function|null, applyNarration?: boolean }} [opts]
 */
export function enrichDiscoveryWithComposedEvidence(discovery, trajectory = null, opts = {}) {
  if (!discovery || typeof discovery !== 'object') return discovery;
  const traj =
    trajectory ||
    (discovery.metrics?.trajectoryOk
      ? {
          ok: true,
          mode: discovery.metrics.trajectoryMode,
          identity: {
            id: discovery.metrics.exerciseId,
            name: discovery.metrics.name || discovery.title,
            family: discovery.metrics.family
          },
          windows: { selected: discovery.metrics.window || null, previousComparable: null },
          temporalScope: discovery.metrics.temporalScope,
          sessions: {
            trace: (discovery.metrics.sessions || []).map((s) => ({
              ...s,
              totalReps: s.totalReps != null ? s.totalReps : s.reps
            }))
          },
          volume: discovery.metrics.volume,
          setMechanism: discovery.metrics.setMechanism || { available: false },
          shape: discovery.metrics.shape || {
            primaryStory: discovery.metrics.trajectoryPrimaryStory,
            path: discovery.metrics.trajectoryPath
          },
          peers: discovery.metrics.peers || { verdict: discovery.metrics.trajectoryPeers },
          installation: discovery.metrics.installation || {
            kind: discovery.metrics.trajectoryInstallation
          },
          findings: {
            main: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'main'),
            mechanism: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'mechanism'),
            peerScope: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'peers'),
            pathNote: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'path'),
            implication: discovery.metrics.trajectoryImplicationRule
              ? {
                  ruleId: discovery.metrics.trajectoryImplicationRule,
                  text: null,
                  stance: 'probable'
                }
              : null,
            positions: discovery.metrics.trajectoryPositions || [],
            limits: (discovery.metrics.trajectoryLimits || []).map((id) => ({ id, text: id }))
          }
        }
      : null);

  if (!traj?.ok && !discovery.metrics?.trajectoryOk) return discovery;

  // Si metrics portent déjà la trajectoire complète, reconstruire depuis ces champs
  const fullTraj =
    trajectory ||
    (discovery.metrics?.setMechanism != null && discovery.metrics?.shape != null
      ? {
          ok: true,
          mode: discovery.metrics.trajectoryMode || 'progress',
          identity: {
            id: discovery.metrics.exerciseId,
            name: discovery.metrics.name,
            family: null
          },
          windows: {
            selected: discovery.metrics.temporalScope
              ? {
                  start: discovery.metrics.temporalScope.windowStart,
                  end: discovery.metrics.temporalScope.windowEnd
                }
              : null,
            previousComparable: null
          },
          temporalScope: discovery.metrics.temporalScope,
          sessions: {
            trace: (discovery.metrics.sessions || []).map((s) => ({
              ...s,
              totalReps: s.totalReps != null ? s.totalReps : s.reps
            }))
          },
          volume: discovery.metrics.volume,
          setMechanism: discovery.metrics.setMechanism,
          shape: discovery.metrics.shape,
          peers: discovery.metrics.peers,
          installation: discovery.metrics.installation,
          findings: {
            main: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'main'),
            mechanism: (discovery.metrics.trajectoryPositions || []).find(
              (p) => p.claim === 'mechanism'
            ),
            peerScope: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'peers'),
            pathNote: (discovery.metrics.trajectoryPositions || []).find((p) => p.claim === 'path'),
            implication: discovery.metrics.trajectoryImplicationRule
              ? { ruleId: discovery.metrics.trajectoryImplicationRule, stance: 'probable', text: null }
              : null,
            positions: discovery.metrics.trajectoryPositions || [],
            limits: (discovery.metrics.trajectoryLimits || []).map((id) => ({ id, text: id }))
          }
        }
      : null);

  if (!fullTraj?.ok) return discovery;

  const composed = buildComposedEvidenceFromTrajectory(fullTraj);
  let next = {
    ...discovery,
    metrics: {
      ...(discovery.metrics || {}),
      composedEvidence: composed,
      composedFactCount: composed.factCount || 0,
      composedOk: Boolean(composed.composed),
      draftTitleBeforeF4: discovery.metrics?.draftTitleBeforeF4 || discovery.title,
      draftBodyBeforeF4: discovery.metrics?.draftBodyBeforeF4 || discovery.body
    }
  };

  // F4 — narration depuis preuves structurées (opt-in, défaut true)
  if (opts.applyNarration !== false && composed.composed) {
    next = applyComposedNarrationToDiscovery(next, {
      getExerciseNameById: opts.getExerciseNameById || null
    });
  }
  return next;
}

/**
 * Applique l’enrichissement F3 (+ narration F4) sur une liste de discoveries.
 * N’utilise que les trajectoires déjà sérialisées dans metrics (pas de recalcul massif).
 * @param {object[]} discoveries
 * @param {{ getExerciseNameById?: Function|null, applyNarration?: boolean }} [opts]
 */
export function enrichDiscoveriesWithComposedEvidence(discoveries = [], opts = {}) {
  return (discoveries || []).map((d) => {
    if (!d?.metrics?.trajectoryOk) return d;
    return enrichDiscoveryWithComposedEvidence(d, null, opts);
  });
}
