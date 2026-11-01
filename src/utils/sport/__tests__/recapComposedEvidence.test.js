import { describe, it, expect } from 'vitest';
import {
  classifyVolumeAttribution,
  classifyContinuity,
  buildComposedEvidenceFromTrajectory,
  resolveVolumeLexicon,
  enrichDiscoveryWithComposedEvidence
} from '../recapComposedEvidence';
import {
  buildExerciseTrajectory,
  renderExerciseTrajectoryCopy,
  trajectoryToMetrics
} from '../exerciseTrajectoryAnalysis';

function ymd(offset, base = '2026-09-01') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function snapFromSessions(exerciseId, sessions, extraExercises = []) {
  const checkedExercises = {};
  const reps = {};
  const exerciseSetLogs = {};
  const add = (id, list) => {
    list.forEach((s) => {
      const key = `${s.date}_${id}`;
      checkedExercises[key] = true;
      reps[key] = String(s.total);
      if (s.sets) {
        exerciseSetLogs[key] = { sets: s.sets.map((r) => ({ reps: r })) };
      }
    });
  };
  add(exerciseId, sessions);
  extraExercises.forEach((ex) => add(ex.id, ex.sessions));
  return { checkedExercises, reps, exerciseSetLogs };
}

const nameMap = {
  101: 'Pompes déclinées',
  102: 'Pompes',
  103: 'Dips',
  201: 'Hyperextension'
};
const getName = (id) => nameMap[String(id)] || nameMap[id] || '';

describe('F3 classifyVolumeAttribution', () => {
  it('B3 — hausse de total expliquée par la fréquence', () => {
    const a = classifyVolumeAttribution({
      windowSessionCount: 6,
      prevSessionCount: 3,
      meanPerSession: 40,
      prevMeanPerSession: 38,
      windowTotal: 240,
      prevComparable: 114
    });
    expect(a?.kind).toBe('frequency_driven_total_rise');
  });

  it('contenu de séance change à fréquence stable', () => {
    const a = classifyVolumeAttribution({
      windowSessionCount: 4,
      prevSessionCount: 4,
      meanPerSession: 48,
      prevMeanPerSession: 36,
      windowTotal: 192,
      prevComparable: 144
    });
    expect(a?.kind).toBe('per_session_driven_rise');
  });
});

describe('F3 scénario A — recul localisé avec décomposition', () => {
  it('5 séances decline, sets stables, témoins stables → composition A', () => {
    const main = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 33, sets: [11, 11, 11] },
      { date: ymd(10), total: 27, sets: [9, 9, 9] },
      { date: ymd(15), total: 24, sets: [8, 8, 8] },
      { date: ymd(20), total: 19, sets: [7, 6, 6] }
    ];
    const peers = [
      {
        id: 102,
        sessions: [
          { date: ymd(1), total: 60, sets: [20, 20, 20] },
          { date: ymd(6), total: 60, sets: [20, 20, 20] },
          { date: ymd(11), total: 62, sets: [21, 21, 20] },
          { date: ymd(16), total: 60, sets: [20, 20, 20] }
        ]
      },
      {
        id: 103,
        sessions: [
          { date: ymd(2), total: 36, sets: [12, 12, 12] },
          { date: ymd(7), total: 36, sets: [12, 12, 12] },
          { date: ymd(12), total: 36, sets: [12, 12, 12] },
          { date: ymd(17), total: 35, sets: [12, 12, 11] }
        ]
      }
    ];
    const window = { start: ymd(0), end: ymd(20) };
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, main, peers),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window,
      getExerciseNameById: getName,
      mode: 'progress'
    });
    expect(traj.ok).toBe(true);
    expect(traj.setMechanism.available).toBe(true);
    expect(traj.setMechanism.kind).toMatch(/fewer_reps|same_sets/);
    expect(['net_decline', 'partial_recovery']).toContain(traj.shape.primaryStory);

    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.composed).toBe(true);
    expect(composed.factCount).toBeGreaterThanOrEqual(2);
    expect(composed.decomposition.available !== false || composed.decomposition.kind).toBeTruthy();
    expect(composed.forbiddenConclusions).toContain('adaptation_physiologique');

    const rendered = renderExerciseTrajectoryCopy(traj);
    expect(rendered.usedTrajectory).toBe(true);
    expect(rendered.body).toMatch(/série|volume|répétitions/i);
    // Pas de causalité physiologique
    expect(rendered.body.toLowerCase()).not.toMatch(/physiolog|surentraînement|force générale/);
  });
});

describe('F3 scénario A2 — recul partagé', () => {
  it('ne conclut pas à un recul isolé si témoins baissent aussi', () => {
    const mkDecline = (startTotal) => [
      { date: ymd(0), total: startTotal, sets: [12, 12, 12] },
      { date: ymd(5), total: Math.round(startTotal * 0.85), sets: [10, 10, 10] },
      { date: ymd(10), total: Math.round(startTotal * 0.7), sets: [8, 8, 9] },
      { date: ymd(15), total: Math.round(startTotal * 0.55), sets: [7, 7, 6] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, mkDecline(36), [
        { id: 102, sessions: mkDecline(60) },
        { id: 103, sessions: mkDecline(36) }
      ]),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(15) },
      getExerciseNameById: getName,
      mode: 'progress'
    });
    if (traj.peers.available) {
      expect(traj.peers.verdict).not.toBe('localized');
    }
    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.forbiddenConclusions).toContain('recul_isole_a_cet_exercice');
  });
});

describe('F3 scénario A4 — séries non fiables', () => {
  it('n’invente pas la décomposition', () => {
    const sessions = [
      { date: ymd(0), total: 36 },
      { date: ymd(5), total: 30 },
      { date: ymd(10), total: 24 },
      { date: ymd(15), total: 20 }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(15) },
      getExerciseNameById: getName,
      mode: 'progress'
    });
    expect(traj.setMechanism.available).toBe(false);
    const lex = resolveVolumeLexicon(traj);
    expect(lex.maySayPerformance).toBe(false);
    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.forbiddenConclusions).toContain('decomposition_series_vs_reps');
    const body = renderExerciseTrajectoryCopy(traj).body || '';
    expect(body.toLowerCase()).not.toMatch(/\d+\s*×\s*\d+/);
  });
});

describe('F3 scénario B — format maintenu', () => {
  it('3×12 → 4×12 consolidé', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(28), total: 48, sets: [12, 12, 12, 12] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, sessions),
      exerciseId: 201,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      getExerciseNameById: getName,
      mode: 'emergence'
    });
    expect(traj.setMechanism.kind).toBe('more_sets_same_reps');
    expect(traj.setMechanism.maintained).toBe(true);
    expect(traj.setMechanism.volumeDeltaPct).toBeCloseTo(33.3, 0);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).toBe('consolidated_format');
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    expect(composed.composed).toBe(true);
    expect(composed.continuity.kind).toBe('consolidated_format');
  });
});

describe('F3 scénario B2 — pic isolé', () => {
  it('pas de consolidation', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 36, sets: [12, 12, 12] },
      { date: ymd(28), total: 36, sets: [12, 12, 12] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, sessions),
      exerciseId: 201,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    // maintained false ou continuity punctual
    if (traj.setMechanism.available && traj.setMechanism.kind === 'more_sets_same_reps') {
      expect(traj.setMechanism.maintained).toBe(false);
    }
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).not.toBe('consolidated_format');
  });
});

describe('F3 scénario A3 — témoins insuffisants', () => {
  it('conserve l’analyse principale sans comparaison forcée', () => {
    const main = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 30, sets: [10, 10, 10] },
      { date: ymd(10), total: 24, sets: [8, 8, 8] },
      { date: ymd(15), total: 20, sets: [7, 7, 6] }
    ];
    // Un seul témoin, 2 séances (<3) → insufficient
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, main, [
        {
          id: 102,
          sessions: [
            { date: ymd(1), total: 60, sets: [20, 20, 20] },
            { date: ymd(8), total: 60, sets: [20, 20, 20] }
          ]
        }
      ]),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(15) },
      getExerciseNameById: getName,
      mode: 'progress'
    });
    expect(traj.ok).toBe(true);
    expect(traj.peers.verdict).toBe('insufficient');
    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.forbiddenConclusions).toContain('force_de_famille_intacte');
    expect(composed.primaryPhenomenon.primaryStory).toBeTruthy();
  });
});

describe('F3 scénario A5 — conditions différentes (pas de structure série)', () => {
  it('lexique volume, pas performance', () => {
    const sessions = [
      { date: ymd(0), total: 40 },
      { date: ymd(5), total: 32 },
      { date: ymd(10), total: 28 },
      { date: ymd(15), total: 24 }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(15) },
      mode: 'progress'
    });
    const lex = resolveVolumeLexicon(traj);
    expect(lex.maySayPerformance).toBe(false);
    const body = (renderExerciseTrajectoryCopy(traj).body || '').toLowerCase();
    expect(body).not.toMatch(/performances? (sont|ont) (baiss|progress)/);
  });
});

describe('F3 scénario C — stabilité', () => {
  it('plateau reconnu sans record inventé', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 36, sets: [12, 12, 12] },
      { date: ymd(21), total: 36, sets: [12, 12, 12] },
      { date: ymd(28), total: 37, sets: [13, 12, 12] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, sessions),
      exerciseId: 201,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'progress'
    });
    const continuity = classifyContinuity(traj);
    if (traj.shape?.primaryStory === 'plateau') {
      expect(continuity.kind).toBe('stable_plateau');
    }
    const body = renderExerciseTrajectoryCopy(traj).body || '';
    expect(body.toLowerCase()).not.toMatch(/record|meilleure séance de ta vie/);
  });
});

describe('F3 scénario D — fluctuation', () => {
  it('pas de progression linéaire artificielle', () => {
    const sessions = [
      { date: ymd(0), total: 40, sets: [10, 10, 10, 10] },
      { date: ymd(5), total: 24, sets: [8, 8, 8] },
      { date: ymd(10), total: 42, sets: [14, 14, 14] },
      { date: ymd(15), total: 22, sets: [11, 11] },
      { date: ymd(20), total: 40, sets: [10, 10, 10, 10] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).not.toBe('consolidated_format');
    if (traj.shape?.primaryStory === 'outlier_driven') {
      expect(continuity.kind).toBe('isolated_outlier');
      expect(buildComposedEvidenceFromTrajectory(traj).forbiddenConclusions).toContain(
        'tendance_lineaire'
      );
    }
  });
});

describe('F3 scénario E — retour après interruption', () => {
  it('distingue retour ponctuel et confirmé', () => {
    const sessions = [
      { date: ymd(-40), total: 36, sets: [12, 12, 12] },
      { date: ymd(0), total: 30, sets: [10, 10, 10] },
      { date: ymd(7), total: 32, sets: [11, 11, 10] },
      { date: ymd(14), total: 34, sets: [12, 11, 11] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(14) },
      mode: 'progress'
    });
    expect(traj.installation.kind).toBe('returning');
    const continuity = classifyContinuity(traj);
    expect(['confirmed_return', 'punctual_return']).toContain(continuity.kind);
    expect(continuity.kind).toBe('confirmed_return');
  });

  it('un seul retour → ponctuel, pas durable', () => {
    const sessions = [
      { date: ymd(-40), total: 36, sets: [12, 12, 12] },
      { date: ymd(0), total: 30, sets: [10, 10, 10] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(7) },
      mode: 'progress'
    });
    expect(traj.installation.kind).toBe('returning');
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).toBe('punctual_return');
    expect(buildComposedEvidenceFromTrajectory(traj).forbiddenConclusions).toContain(
      'reprise_durable'
    );
  });
});

describe('F3 scénario H — fenêtre courte + historique', () => {
  it('W centrée, H seulement comme contexte', () => {
    const sessions = [
      { date: '2026-08-01', total: 40, sets: [10, 10, 10, 10] },
      { date: '2026-08-15', total: 38, sets: [10, 10, 10, 8] },
      { date: '2026-09-01', total: 36, sets: [12, 12, 12] },
      { date: '2026-10-24', total: 24, sets: [8, 8, 8] },
      { date: '2026-10-27', total: 22, sets: [8, 7, 7] },
      { date: '2026-10-30', total: 20, sets: [7, 7, 6] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: '2026-10-24', end: '2026-10-30' },
      mode: 'progress'
    });
    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.windows.primary).toEqual({ start: '2026-10-24', end: '2026-10-30' });
    if (composed.windows.historical) {
      expect(composed.windows.historical.role).toBe('historicalContextWindow');
    }
  });
});

describe('F3 scénario I — données manquantes', () => {
  it('abstention composition sans supprimer le fait élémentaire', () => {
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, [{ date: ymd(0), total: 36, sets: [12, 12, 12] }]),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(7) },
      mode: 'progress'
    });
    const composed = buildComposedEvidenceFromTrajectory(traj);
    // Une seule séance : ok trajectoire possible, composition multi-faits limitée
    if (composed.ok) {
      expect(composed.factCount).toBeLessThan(4);
    }
    expect(traj.installation.kind).toBe('first_session');
  });
});

describe('F3 scénario J — sommeil / causalités', () => {
  it('interdit toujours la causalité sommeil → performance', () => {
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, [
        { date: ymd(0), total: 36, sets: [12, 12, 12] },
        { date: ymd(7), total: 30, sets: [10, 10, 10] },
        { date: ymd(14), total: 24, sets: [8, 8, 8] }
      ]),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(14) },
      mode: 'progress'
    });
    const forbidden = buildComposedEvidenceFromTrajectory(traj).forbiddenConclusions;
    expect(forbidden).toContain('causalite_sommeil_performance');
    expect(forbidden).toContain('adaptation_physiologique');
    expect(forbidden).toContain('diagnostic_medical');
  });
});

describe('F3 scénario K — identité non fiable', () => {
  it('pas de rapprochement arbitraire sans famille', () => {
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(9999, [
        { date: ymd(0), total: 36, sets: [12, 12, 12] },
        { date: ymd(5), total: 30, sets: [10, 10, 10] },
        { date: ymd(10), total: 24, sets: [8, 8, 8] },
        { date: ymd(15), total: 20, sets: [7, 7, 6] }
      ]),
      exerciseId: 9999,
      exerciseName: 'Mouvement obscur XYZ',
      window: { start: ymd(0), end: ymd(15) },
      getExerciseNameById: () => 'Mouvement obscur XYZ',
      mode: 'progress'
    });
    expect(traj.peers.available === false || traj.peers.verdict === 'insufficient').toBe(true);
    const composed = buildComposedEvidenceFromTrajectory(traj);
    expect(composed.comparators.verdict).toBe('insufficient');
  });
});

describe('F3 métriques discovery', () => {
  it('trajectoryToMetrics expose composedEvidence', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 30, sets: [10, 10, 10] },
      { date: ymd(14), total: 24, sets: [8, 8, 8] },
      { date: ymd(21), total: 21, sets: [7, 7, 7] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, sessions),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(21) },
      mode: 'progress'
    });
    const m = trajectoryToMetrics(traj);
    expect(m.composedEvidence?.ok).toBe(true);
    expect(m.composedFactCount).toBeGreaterThanOrEqual(1);

    const card = enrichDiscoveryWithComposedEvidence({
      kind: 'disc_exercise_progress',
      title: 'x',
      body: 'y',
      metrics: m
    });
    expect(card.metrics.composedOk != null).toBe(true);
  });
});
