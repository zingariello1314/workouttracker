/**
 * Mission 30 — population d’effectifs alignée sur les totaux de fenêtre
 * (pas sur la longueur de l’arc historique).
 */
import { describe, expect, it } from 'vitest';
import { applyParallelTrajectoryComposition } from '../parallelTrajectoryComposition';
import {
  resolvePrimaryWindowSessionPopulation,
  validateSumMeanSampleConsistency,
  METRIC_REFERENT
} from '../recapMetricContract';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';

function wrap(discovery) {
  return {
    discovery: {
      ...discovery,
      claim: discovery.claim || {
        id: `c:${discovery.kind}:${discovery.metrics?.exerciseId}`,
        statement: discovery.title,
        proof: { observedValues: discovery.metrics?.observedValues || [] },
        assertions: []
      }
    },
    claim: discovery.claim || null,
    wasPriority: true
  };
}

/** Fixtures génériques (pas Hyperextension) : arc plus long que la fenêtre. */
function arcInflatedRow({
  exerciseId,
  name,
  windowDates,
  arcExtraDates,
  repsPerSession,
  prevReps
}) {
  const windowSessionCount = windowDates.length;
  const recentReps = repsPerSession * windowSessionCount;
  const arcDates = [...arcExtraDates, ...windowDates].sort();
  return wrap({
    kind: 'disc_structural_memory',
    title: `${name} : volume fenêtre`,
    body: `${recentReps} reps sur ${windowSessionCount} séances`,
    nature: 'trajectory',
    informativeValue: 72,
    metrics: {
      exerciseId,
      name,
      // Défaut historique bugogène : dates = arc, sessionCount = fenêtre
      dates: arcDates,
      arcDates,
      sessionCount: windowSessionCount,
      recentReps,
      windowTotalReps: recentReps,
      prevReps,
      windowMeanPerSession: repsPerSession,
      sessions: arcDates.map((date) => ({
        date,
        reps: repsPerSession,
        inSelectedWindow: windowDates.includes(date)
      })),
      temporalScope: { windowDates },
      observedValues: [
        { id: 'recentReps', value: recentReps, unit: 'reps' },
        { id: 'windowMeanPerSession', value: repsPerSession, unit: 'reps' },
        { id: 'sessionCount', value: windowSessionCount, unit: 'sessions' }
      ]
    }
  });
}

describe('Mission 30 — contrat population effectifs', () => {
  it('édition population (Mission 30+)', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v(29|30|31|32|33)/);
    expect(ANALYSIS_EDITION_PARTS.composition).toMatch(/metric-population-v[12]/);
  });

  it('resolvePrimaryWindowSessionPopulation ignore l’arc hors fenêtre', () => {
    const pop = resolvePrimaryWindowSessionPopulation({
      sessionCount: 6,
      dates: [
        '2026-09-01',
        '2026-09-08',
        '2026-10-02',
        '2026-10-16',
        '2026-10-30',
        '2026-11-06',
        '2026-11-13',
        '2026-11-20'
      ],
      sessions: [
        { date: '2026-09-01', inSelectedWindow: false },
        { date: '2026-09-08', inSelectedWindow: false },
        { date: '2026-10-02', inSelectedWindow: true },
        { date: '2026-10-16', inSelectedWindow: true },
        { date: '2026-10-30', inSelectedWindow: true },
        { date: '2026-11-06', inSelectedWindow: true },
        { date: '2026-11-13', inSelectedWindow: true },
        { date: '2026-11-20', inSelectedWindow: true }
      ]
    });
    expect(pop.sessionCount).toBe(6);
    expect(pop.source).toBe('sessions.inSelectedWindow');
    expect(pop.referent).toBe(METRIC_REFERENT.PRIMARY_WINDOW);
    expect(pop.distinctFromArc).toBe(true);
  });

  it('validateSumMeanSampleConsistency détecte 336 sur 8 vs moyenne 48', () => {
    const bad = validateSumMeanSampleConsistency({ total: 336, mean: 48, sampleSize: 8 });
    expect(bad.applicable).toBe(true);
    expect(bad.ok).toBe(false);
    const good = validateSumMeanSampleConsistency({ total: 336, mean: 48, sampleSize: 7 });
    expect(good.ok).toBe(true);
  });

  it('composition parallèle publie 7 et 6 séances (pas 8 et 7) pour totaux fenêtre', () => {
    const a = arcInflatedRow({
      exerciseId: 'exA',
      name: 'Tractions',
      windowDates: [
        '2026-10-02',
        '2026-10-16',
        '2026-10-30',
        '2026-11-06',
        '2026-11-13',
        '2026-11-20'
      ],
      arcExtraDates: ['2026-09-04', '2026-09-18'],
      repsPerSession: 48,
      prevReps: 96
    });
    const b = arcInflatedRow({
      exerciseId: 'exB',
      name: 'Tractions',
      windowDates: [
        '2026-09-28',
        '2026-10-12',
        '2026-10-19',
        '2026-10-26',
        '2026-11-02',
        '2026-11-09',
        '2026-11-16'
      ],
      arcExtraDates: ['2026-09-14'],
      repsPerSession: 48,
      prevReps: 144
    });
    // Totaux indépendants : 6×48=288, 7×48=336
    expect(a.discovery.metrics.recentReps).toBe(288);
    expect(b.discovery.metrics.recentReps).toBe(336);

    const applied = applyParallelTrajectoryComposition([a, b], {
      voiceKey: '3m',
      window: { start: '2026-08-24', end: '2026-11-21' }
    });
    expect(applied.composedCount).toBe(1);
    const parent = applied.rows.find(
      (r) => r.discovery?.kind === 'disc_composed_parallel_trajectories'
    );
    const trajs = parent.discovery.metrics.trajectories;
    const byId = Object.fromEntries(trajs.map((t) => [t.subject, t]));
    expect(byId['ex:exA'].sessions).toBe(6);
    expect(byId['ex:exB'].sessions).toBe(7);
    expect(byId['ex:exA'].recentReps).toBe(288);
    expect(byId['ex:exB'].recentReps).toBe(336);
    expect(parent.discovery.body).toMatch(/sur 6 séances/);
    expect(parent.discovery.body).toMatch(/sur 7 séances/);
    expect(parent.discovery.body).not.toMatch(/sur 8 séances/);
  });

  it('validateCardClaimConsistency refuse total/effectif incohérents', () => {
    const card = {
      id: 'c1',
      title: 'Rowing',
      body: '336 répétitions sur 8 séances',
      metrics: {
        recentReps: 336,
        windowMeanPerSession: 48,
        sessionCount: 7,
        sessions: [
          { date: '2026-10-01', inSelectedWindow: true },
          { date: '2026-10-08', inSelectedWindow: true },
          { date: '2026-10-15', inSelectedWindow: true },
          { date: '2026-10-22', inSelectedWindow: true },
          { date: '2026-10-29', inSelectedWindow: true },
          { date: '2026-11-05', inSelectedWindow: true },
          { date: '2026-11-12', inSelectedWindow: true },
          { date: '2026-09-01', inSelectedWindow: false }
        ]
      }
    };
    const claim = {
      statement: card.body,
      proof: {
        observedValues: [
          { id: 'recentReps', value: 336 },
          { id: 'windowMeanPerSession', value: 48 }
        ]
      }
    };
    // population = 7 (inSelectedWindow) → 336 = 48×7 OK sur triple ;
    // prose dit 8 → conflit prose
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(false);
    expect(check.conflicts.some((c) => c.metric === 'session_count_prose_vs_population')).toBe(
      true
    );
  });
});
