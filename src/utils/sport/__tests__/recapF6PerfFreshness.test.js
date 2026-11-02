/**
 * F6 — non-régression analytique + fraîcheur de scope + isolation clé.
 */
import { describe, it, expect } from 'vitest';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries.js';
import {
  createRecapComputeScope,
  snapshotRevisionOf,
  scopeStats
} from '../recapComputeScope.js';
import { buildExerciseTrajectory } from '../exerciseTrajectoryAnalysis.js';

function miniSnap() {
  return {
    reps: {
      '2026-10-20_101': 40,
      '2026-10-22_101': 44,
      '2026-10-24_101': 48,
      '2026-10-26_101': 50,
      '2026-10-28_101': 52,
      '2026-10-20_201': 20,
      '2026-10-24_201': 22,
      '2026-10-28_201': 24
    },
    checkedExercises: {
      '2026-10-20_101': true,
      '2026-10-22_101': true,
      '2026-10-24_101': true,
      '2026-10-26_101': true,
      '2026-10-28_101': true,
      '2026-10-20_201': true,
      '2026-10-24_201': true,
      '2026-10-28_201': true
    },
    enduranceData: { gtg: { days: {} }, sessions: {} }
  };
}

const getName = (id) => {
  if (String(id) === '101') return 'Tractions';
  if (String(id) === '201') return 'Dips';
  return `Ex ${id}`;
};

const window = { start: '2026-10-01', end: '2026-10-30' };

function fingerprint(bundle) {
  return (bundle.selected || []).map((d) => ({
    kind: d.kind,
    title: d.title,
    body: d.body,
    informativeValue: d.informativeValue,
    exerciseId: d.metrics?.exerciseId ?? null,
    composedOk: Boolean(d.metrics?.composedOk),
    continuity: d.metrics?.composedEvidence?.continuity?.kind ?? null,
    attribution: d.metrics?.composedEvidence?.volumeAttribution?.kind ?? null
  }));
}

describe('F6 compute scope', () => {
  it('réutilise une trajectoire identique dans la même portée', () => {
    const snapshot = miniSnap();
    const scope = createRecapComputeScope({ snapshot });
    const a = buildExerciseTrajectory({
      snapshot,
      exerciseId: 101,
      exerciseName: 'Tractions',
      window,
      getExerciseNameById: getName,
      mode: 'progress',
      computeScope: scope
    });
    const b = buildExerciseTrajectory({
      snapshot,
      exerciseId: 101,
      exerciseName: 'Tractions',
      window,
      getExerciseNameById: getName,
      mode: 'progress',
      computeScope: scope
    });
    expect(a).toBe(b);
    expect(scope.counters.trajectoryMisses).toBe(1);
    expect(scope.counters.trajectoryHits).toBe(1);
  });

  it('ne partage pas entre révisions de snapshot différentes', () => {
    const snapshot = miniSnap();
    const scopeA = createRecapComputeScope({ snapshot });
    const first = buildExerciseTrajectory({
      snapshot,
      exerciseId: 101,
      exerciseName: 'Tractions',
      window,
      mode: 'progress',
      computeScope: scopeA
    });
    const mutated = {
      ...snapshot,
      reps: { ...snapshot.reps, '2026-10-28_101': 99 }
    };
    expect(snapshotRevisionOf(mutated)).not.toBe(snapshotRevisionOf(snapshot));
    const scopeB = createRecapComputeScope({ snapshot: mutated });
    const second = buildExerciseTrajectory({
      snapshot: mutated,
      exerciseId: 101,
      exerciseName: 'Tractions',
      window,
      mode: 'progress',
      computeScope: scopeB
    });
    expect(first).not.toBe(second);
    expect(second.volume?.windowTotal || second.ok).toBeTruthy();
  });

  it('conserve les cartes sélectionnées avec ou sans scope (non-régression)', () => {
    const snapshot = miniSnap();
    const without = buildPeriodDiscoveryBundle({
      snapshot,
      window,
      period: '30d',
      getExerciseNameById: getName
    });
    const scope = createRecapComputeScope({ snapshot, period: '30d', window });
    const withScope = buildPeriodDiscoveryBundle({
      snapshot,
      window,
      period: '30d',
      getExerciseNameById: getName,
      computeScope: scope
    });
    expect(fingerprint(withScope)).toEqual(fingerprint(without));
    const stats = scopeStats(scope);
    expect(stats.lifetimeHits + stats.lifetimeMisses).toBeGreaterThan(0);
  });

  it('prend en compte une mutation de reps (fraîcheur)', () => {
    const snapshot = miniSnap();
    const before = buildPeriodDiscoveryBundle({
      snapshot,
      window,
      period: '30d',
      getExerciseNameById: getName
    });
    const afterSnap = {
      ...snapshot,
      reps: { ...snapshot.reps, '2026-10-28_101': 120 },
      checkedExercises: { ...snapshot.checkedExercises }
    };
    const after = buildPeriodDiscoveryBundle({
      snapshot: afterSnap,
      window,
      period: '30d',
      getExerciseNameById: getName,
      computeScope: createRecapComputeScope({ snapshot: afterSnap })
    });
    // Le moteur a bien recalculé : fingerprint différent OU volumes trajectoire différents
    const beforeFp = JSON.stringify(fingerprint(before));
    const afterFp = JSON.stringify(fingerprint(after));
    const beforeVol = (before.all || [])
      .filter((d) => String(d.metrics?.exerciseId) === '101')
      .map((d) => d.metrics?.volume?.windowTotal);
    const afterVol = (after.all || [])
      .filter((d) => String(d.metrics?.exerciseId) === '101')
      .map((d) => d.metrics?.volume?.windowTotal);
    expect(beforeFp !== afterFp || JSON.stringify(beforeVol) !== JSON.stringify(afterVol)).toBe(
      true
    );
  });
});
