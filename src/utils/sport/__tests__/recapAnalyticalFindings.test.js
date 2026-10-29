import { describe, expect, it } from 'vitest';
import {
  buildVolumeDecompFinding,
  findingDepthLevel,
  proseFromFinding
} from '../recapAnalyticalFindings';
import { assertFindingDepth, assertAnalyticalDepthPositive } from '../recapAnalysisDepthAssert';
import { applyEditorialGate } from '../recapEditorialGate';

describe('recapAnalyticalFindings — profondeur volume (C1 / R1)', () => {
  it('produit un Finding niveau ≥2 avec driver fréquence', () => {
    const f = buildVolumeDecompFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      currentReps: 2000,
      previousReps: 1000,
      currentSessions: 12,
      previousSessions: 6,
      currentLen: 30,
      previousLen: 30,
      goal: 'muscular_defined'
    });
    expect(f).toBeTruthy();
    expect(f.metrics.driver).toBe('frequency');
    expect(findingDepthLevel(f)).toBeGreaterThanOrEqual(2);
    const depth = assertFindingDepth(f, 2);
    expect(depth.ok).toBe(true);
    const prose = proseFromFinding(f);
    expect(prose).toMatch(/fréquence/i);
    expect(prose).not.toMatch(/il faudra examiner/i);
    expect(assertAnalyticalDepthPositive(prose).ok).toBe(true);
  });

  it('attribue driver dose quand la dose domine', () => {
    const f = buildVolumeDecompFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      currentReps: 2400,
      previousReps: 1200,
      currentSessions: 8,
      previousSessions: 8,
      currentLen: 30,
      previousLen: 30
    });
    expect(f.metrics.driver).toBe('dose');
    expect(proseFromFinding(f)).toMatch(/dose par séance/i);
  });

  it('refuse un Finding sans sessions courantes', () => {
    expect(
      buildVolumeDecompFinding({
        currentReps: 100,
        previousReps: 200,
        currentSessions: 0,
        previousSessions: 4,
        currentLen: 30,
        previousLen: 30
      })
    ).toBeNull();
  });

  it('enrichit avec perf stable (C2) jusqu’à conséquence niveau 3', () => {
    const f = buildVolumeDecompFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      currentReps: 2360,
      previousReps: 2000,
      currentSessions: 12,
      previousSessions: 8,
      currentLen: 30,
      previousLen: 30,
      perfMomentumPct: 1
    });
    expect(f.relationIds).toContain('C2');
    expect(findingDepthLevel(f)).toBe(3);
    expect(proseFromFinding(f)).toMatch(/stable/i);
  });
});

describe('editorial gate — dérobade (R3)', () => {
  it('écarte une carte qui décrit une tâche au lieu d’un résultat', () => {
    const kept = applyEditorialGate(
      [
        {
          kind: 'disc_gtg_unplanned_role',
          title: 'Passages hors planning',
          body: 'Pour comprendre leur contribution à ta progression, Momentum doit rapprocher ces passages des exercices concernés.'
        },
        {
          kind: 'volume_traj',
          title: 'Le volume bouge via surtout la fréquence',
          body: 'Le volume de répétitions est passé de 1000 à 2000 (+100 %). Cette variation vient surtout de la fréquence. Tu accumules davantage de jours de travail.'
        }
      ],
      { voiceKey: 'month' }
    );
    expect(kept.some((c) => /Momentum doit rapprocher/i.test(c.body))).toBe(false);
    expect(kept.some((c) => c.kind === 'volume_traj')).toBe(true);
  });
});
