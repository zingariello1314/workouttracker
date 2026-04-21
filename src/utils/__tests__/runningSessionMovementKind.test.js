import { describe, it, expect } from 'vitest';
import { isWalkingLikeRunningSession, filterRunningSessionsExcludingWalk } from '../runningSessionMovementKind';
import { runningTrophyLevelXpReward } from '../../services/endurance/runningTrophiesService';

describe('runningSessionMovementKind', () => {
  it('détecte une sortie très lente comme marche', () => {
    const session = {
      id: '1',
      date: '2026-04-17',
      time: '18:07:10',
      distance: 4,
      duration: '01:02:00',
      pace: '15:30',
      type: 'endurance',
      avgHR: 95,
      maxHR: 120
    };
    expect(isWalkingLikeRunningSession(session, null)).toBe(true);
  });

  it('exclut la marche du filtre course', () => {
    const walk = {
      id: 'w',
      distance: 4,
      duration: '01:00:00',
      pace: '15:00',
      type: 'endurance'
    };
    const run = {
      id: 'r',
      distance: 5,
      duration: '00:30:00',
      pace: '6:00',
      type: 'endurance'
    };
    const out = filterRunningSessionsExcludingWalk([walk, run], new Map());
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('r');
  });
});

describe('runningTrophyLevelXpReward', () => {
  it('retourne un gain XP cohérent par difficulté et palier', () => {
    const elite = runningTrophyLevelXpReward('elite', 'elite');
    const bronze = runningTrophyLevelXpReward('elite', 'bronze');
    expect(elite).toBeGreaterThan(bronze);
    expect(bronze).toBeGreaterThan(0);
  });
});
