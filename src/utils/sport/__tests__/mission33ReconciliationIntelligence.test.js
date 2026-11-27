/**
 * Mission 33 — LIVE_INPUTS autorité, populations ±/noncomp, Jeu A prose, densité, familles.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { buildLiveReplayInputPack } from '../evaluation/buildLiveReplayInputPack';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { claimFromDiscovery } from '../analyticalClaim';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { runGameBDiscoveryQuality, referenceCasesForGameB } from '../evaluation/gameBDiscoveryQuality';
import { runGameCCollective } from '../evaluation/gameCCollective';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';

describe('Mission 33 — édition', () => {
  it('bumpe editorial v32', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[2-5]$/);
  });
});

describe('Mission 33 — Porte A LIVE_INPUTS autorité', () => {
  const snapshot = {
    reps: { '2026-11-18_1': 40, '2026-11-20_2': 48 },
    checkedExercises: { '2026-11-18_1': true, '2026-11-20_2': true },
    exerciseWeights: {},
    exerciseSetLogs: {}
  };
  const program = { id: 'default-program', name: 'Prog', schedule: { mon: { exercises: [] } } };
  const garmin = {
    dailyMetrics: Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [`2026-11-${String(10 + i).padStart(2, '0')}`, { sleep: 7.5 }])
    )
  };

  it('fingerprint avec programme+garmin ≠ fingerprint snapshot seul', () => {
    const alone = snapshotFingerprint(snapshot);
    const full = snapshotFingerprint(snapshot, { activeProgram: program, garminData: garmin });
    expect(alone.digest).not.toBe(full.digest);
    expect(alone.programId).toBeNull();
    expect(full.programId).toBe('default-program');
    expect(full.garminSleepDays).toBe(5);
  });

  it('pack complet : reproductible ; pack sans contextes vs engine : non_reproductible', () => {
    const engineFp = snapshotFingerprint(snapshot, { activeProgram: program, garminData: garmin });
    const incomplete = buildLiveReplayInputPack({
      snapshot,
      engineFingerprint: engineFp,
      analysisWindowEnd: '2026-11-23'
    });
    expect(incomplete.reproducibility.status).toBe('non_reproductible');
    expect(incomplete.program).toBeNull();
    expect(incomplete.garmin).toBeNull();
    expect(incomplete.parameters.lastSessionDate).toBe('2026-11-20');
    expect(incomplete.parameters.analysisWindowEnd).toBe('2026-11-23');
    expect(incomplete.parameters.anchorDateMeaning).toMatch(/lastSessionDate/);

    const complete = buildLiveReplayInputPack({
      snapshot,
      activeProgram: program,
      garminData: garmin,
      engineFingerprint: engineFp,
      analysisWindowEnd: '2026-11-23'
    });
    expect(complete.reproducibility.status).toBe('reproductible_si_sources_completes');
    expect(complete.program.id).toBe('default-program');
    expect(complete.garmin.dailyMetricsDays).toBe(5);
    expect(complete.fingerprints.digest).toBe(engineFp.digest);
  });

  it('ne fabrique pas program/garmin inventés', () => {
    const pack = buildLiveReplayInputPack({ snapshot });
    expect(pack.program).toBeNull();
    expect(pack.garmin).toBeNull();
  });
});

describe('Mission 33 — Porte B populations', () => {
  it('PASS : total / moyenne / effectif liés', () => {
    const card = {
      kind: 'disc_traj',
      title: 'Curl',
      body: '480 répétitions sur 8 séances',
      metrics: {
        recentReps: 480,
        windowMeanPerSession: 60,
        sessionCount: 8,
        sessions: Array.from({ length: 8 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          inSelectedWindow: true
        })),
        observedValues: [
          { id: 'recentReps', value: 480 },
          { id: 'windowMeanPerSession', value: 60 },
          { id: 'sessionCount', value: 8 }
        ]
      }
    };
    card.claim = claimFromDiscovery(card, { start: '2026-10-01', end: '2026-10-31' });
    const check = validateCardClaimConsistency(card, card.claim);
    expect(check.ok).toBe(true);
    expect(check.notes || []).toHaveLength(0);
  });

  it('FAIL : contradiction volontaire total ≠ mean × n', () => {
    const card = {
      kind: 'disc_traj',
      title: 'Curl faux',
      body: '480 répétitions sur 8 séances',
      metrics: {
        recentReps: 480,
        windowMeanPerSession: 48,
        sessionCount: 8,
        sessions: Array.from({ length: 8 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          inSelectedWindow: true
        })),
        observedValues: [
          { id: 'recentReps', value: 480 },
          { id: 'windowMeanPerSession', value: 48 },
          { id: 'sessionCount', value: 8 }
        ]
      }
    };
    card.claim = claimFromDiscovery(card, { start: '2026-10-01', end: '2026-10-31' });
    const check = validateCardClaimConsistency(card, card.claim);
    expect(check.ok).toBe(false);
    expect(check.conflicts.some((c) => c.metric === 'sum_mean_sample_consistency')).toBe(true);
  });

  it('NONCOMPARABLE : fenêtres / arcs non liés', () => {
    const card = {
      kind: 'disc_emergence',
      title: 'Pompes',
      body: '718 sur 18 séances',
      metrics: {
        recentReps: 718,
        windowMeanPerSession: 39.9,
        dates: ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29', '2026-11-05', '2026-11-12', '2026-11-19']
      }
    };
    card.claim = claimFromDiscovery(card, { start: '2026-08-01', end: '2026-11-21' });
    const check = validateCardClaimConsistency(card, card.claim);
    expect(check.ok).toBe(true);
    expect(check.notes.some((n) => n.note === 'populations_not_bound_skip_triple')).toBe(true);
  });

  it('NOT_EVALUATED : pas de triple numérique', () => {
    const card = {
      kind: 'disc_pending_session',
      title: 'Attente',
      body: 'Séance non commencée',
      metrics: { documentaryOnly: true, observedValues: [{ id: 'periodReps', value: 0 }] }
    };
    card.claim = claimFromDiscovery(card, { start: '2026-11-23', end: '2026-11-23' });
    const check = validateCardClaimConsistency(card, card.claim);
    expect(check.ok).toBe(true);
    expect(check.notes || []).toHaveLength(0);
    expect(check.conflicts || []).toHaveLength(0);
  });
});

describe('Mission 33 — Porte C Jeu A', () => {
  it('pending avec preuves observées : pas priority_without_numeric_proof', () => {
    const pending = {
      kind: 'disc_pending_session',
      id: 'disc_pending_session|t',
      disposition: 'priority',
      title: "La séance d'aujourd'hui n'est pas encore commencée",
      body: '0 répétition. Dernière séance 40 reps.',
      evidence: 'dernière séance 20 novembre · 40 reps',
      metrics: {
        documentaryOnly: true,
        observedValues: [
          { id: 'periodReps', value: 0, unit: 'reps' },
          { id: 'lastSessionReps', value: 40, unit: 'reps' }
        ]
      }
    };
    pending.claim = claimFromDiscovery(pending, { start: '2026-11-23', end: '2026-11-23' });
    const report = runGameAAccuracy({
      insights: { shortTerm: [pending], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.issue === 'priority_without_numeric_proof')).toBe(false);
  });

  it('prose technique snapshots= / reconstruct= : signalée ; prose sportive : OK', () => {
    const bad = {
      kind: 'disc_plan_data_insufficient',
      id: 'bad',
      disposition: 'priority',
      title: 'Suivi',
      body: 'Indisponible',
      evidence: 'snapshots=0 · reconstruct=0',
      claim: {
        proof: { observedValues: [{ id: 'x', value: 0 }], documentary: true },
        assertions: [{ value: 0 }],
        limitations: ['non_numeric_documentary_proof']
      }
    };
    const good = {
      kind: 'disc_plan_data_insufficient',
      id: 'good',
      disposition: 'priority',
      title: 'Suivi de plan : preuve historique indisponible',
      body: 'Aucun jour de cette fenêtre n’a de plan figé.',
      evidence: 'aucun jour de plan figé · 0 jour de réalisé seul',
      claim: {
        proof: { observedValues: [{ id: 'snap', value: 0 }], documentary: true },
        assertions: [{ value: 0 }],
        limitations: ['non_numeric_documentary_proof']
      }
    };
    const badReport = runGameAAccuracy({
      insights: { shortTerm: [bad], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    const goodReport = runGameAAccuracy({
      insights: { shortTerm: [good], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(badReport.cases.some((c) => c.issue === 'technical_code_in_user_prose')).toBe(true);
    expect(goodReport.cases.some((c) => c.issue === 'technical_code_in_user_prose')).toBe(false);
  });
});

describe('Mission 33 — Porte D/E Jeux B/C', () => {
  it('Jeu B étendu ≥ 11 cas de référence', () => {
    expect(referenceCasesForGameB().length).toBeGreaterThanOrEqual(11);
    const b = runGameBDiscoveryQuality({ insights: null });
    expect(b.referenceHits).toBeGreaterThanOrEqual(4);
    expect(b.passScope).toBe('synthetic_refs_only');
    expect(b.humanBlindPerformed).toBe(false);
  });

  it('Jeu C sur packs multi-horizons (structure)', () => {
    const mk = (period, title, body) => ({
      id: `card|${period}|${title}`,
      kind: 'disc_x',
      title,
      body,
      disposition: 'priority'
    });
    const report = runGameCCollective({
      periodPacks: [
        {
          period: '7d',
          insights: {
            shortTerm: [mk('7d', 'A', 'texte A')],
            mediumTerm: [],
            longTerm: [],
            accessibleReserve: []
          },
          p6: { counters: { reconciled: true }, priority: [mk('7d', 'A', 'texte A')], reserve: [] }
        },
        {
          period: '30d',
          insights: {
            shortTerm: [mk('30d', 'A', 'texte A')],
            mediumTerm: [],
            longTerm: [],
            accessibleReserve: []
          },
          p6: { counters: { reconciled: true }, priority: [mk('30d', 'A', 'texte A')], reserve: [] }
        }
      ]
    });
    expect(report.cases.length).toBeGreaterThanOrEqual(2);
  });
});
