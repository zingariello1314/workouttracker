import { describe, it, expect } from 'vitest';
import {
  listMatchingChallengeIds,
  sumPushupRepsInChallengeWindow
} from '../enduranceChallengesService';

describe('pushups_cumul', () => {
  const challenge = {
    id: 'c1',
    type: 'pushups_cumul',
    activityType: 'pushups',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    goalTotalCount: 100,
    status: 'active'
  };

  it('somme les reps uniquement dans la fenêtre', () => {
    const sessions = [
      { id: 'a', date: '2025-12-30', count: 50, time: '10:00' },
      { id: 'b', date: '2026-01-05', count: 40, time: '10:00' },
      { id: 'c', date: '2026-01-06', count: 70, time: '10:00' }
    ];
    expect(sumPushupRepsInChallengeWindow(challenge, sessions)).toBe(110);
  });

  it('marque la session où le seuil est franchi pour la première fois', () => {
    const sessions = [
      { id: 'a', date: '2026-01-02', count: 30, time: '08:00' },
      { id: 'b', date: '2026-01-03', count: 40, time: '08:00' },
      { id: 'c', date: '2026-01-04', count: 40, time: '08:00' }
    ];
    const idsB = listMatchingChallengeIds([challenge], sessions[1], 'pushups', { relatedPushupSessions: sessions });
    expect(idsB).toEqual([]);
    const idsC = listMatchingChallengeIds([challenge], sessions[2], 'pushups', { relatedPushupSessions: sessions });
    expect(idsC).toEqual(['c1']);
  });
});
