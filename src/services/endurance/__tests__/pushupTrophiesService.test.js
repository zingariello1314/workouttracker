import {
  buildPushupTrophiesCatalog,
  evaluatePushupTrophies,
  computePushupTrophiesXpDetailed
} from '../pushupTrophiesService';

describe('pushupTrophiesService', () => {
  test('catalogue non vide', () => {
    expect(buildPushupTrophiesCatalog().length).toBeGreaterThan(10);
  });

  test('une séance débloque le trophée « première séance »', () => {
    const sessions = [{ id: '1', date: '2026-03-01', time: '10:00', count: 20, duration: 15 }];
    const ev = evaluatePushupTrophies({ sessions });
    expect(ev.stats.sessionCount).toBe(1);
    const first = ev.results.find((r) => r.id === 'pu_first');
    expect(first).toBeTruthy();
    expect(first.levels.find((l) => l.level === 'bronze')?.unlocked).toBe(true);
  });

  test('XP agrégée finie', () => {
    const ev = evaluatePushupTrophies({ sessions: [] });
    const xp = computePushupTrophiesXpDetailed(ev.results);
    expect(Number.isFinite(xp.xp)).toBe(true);
    expect(xp.xp).toBeGreaterThanOrEqual(0);
  });
});
