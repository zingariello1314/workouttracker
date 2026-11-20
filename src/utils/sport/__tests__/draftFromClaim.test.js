import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { draftFromClaim } from '../draftFromClaim';
import { exploreNearEqualSessions, COVERAGE } from '../analyticalExploration';

describe('draftFromClaim', () => {
  it('rédige depuis la thèse et évite de répéter le titre dans le corps', () => {
    const discovery = {
      kind: 'disc_volume_shape',
      title: 'La fréquence explique l’essentiel du recul',
      body: 'La fréquence explique l’essentiel du recul. Les journées actives baissent.',
      evidence: '22 → 12 jours',
      metrics: { totalReps: 3704, previousReps: 6947 }
    };
    const claim = claimFromDiscovery(discovery);
    const drafted = draftFromClaim(discovery, claim, {
      coverage: COVERAGE.CONCLUDED,
      conclusion: 'La baisse de volume s’explique par 22 séances puis 12.',
      hypotheses: [{ id: 'more_sessions', status: 'supported', detail: '22 séances puis 12' }]
    });
    expect(drafted.title).toMatch(/fréquence|recul/i);
    expect(drafted.body.startsWith(drafted.title)).toBe(false);
    expect(drafted.drafting.authority).toBe('claim');
    expect(drafted.body).toMatch(/22 séances puis 12/);
  });
});

describe('exploreNearEqualSessions', () => {
  it('conclut quand des volumes proches diffèrent par le défi et le répertoire', () => {
    const explored = exploreNearEqualSessions([
      { date: '2026-11-14', reps: 332, challengeReps: 100, exerciseCount: 8, pushReps: 188, pullReps: 80 },
      { date: '2026-11-16', reps: 319, challengeReps: 0, exerciseCount: 11, pushReps: 140, pullReps: 110 },
      { date: '2026-11-17', reps: 332, challengeReps: 100, exerciseCount: 7, pushReps: 190, pullReps: 70 }
    ]);
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.retained.map((row) => row.id)).toContain('challenge_share_differs');
    expect(explored.conclusion).toMatch(/volume proche/);
  });
});
