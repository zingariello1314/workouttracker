import { describe, expect, it } from 'vitest';
import { calculateSportXP, countLoggedEnduranceChallengeSessions } from '../xpCalculations';
import { computeLifetimeExerciseAndChallengeMinutes } from '../../../utils/calendarPhysicalSessionStripes';

describe('XP sport — défis loggés et temps cumulé', () => {
  it('compte les séances pompes Défis même sans fiche challenges[]', () => {
    const endurance = {
      sessions: {
        pushups: [
          { id: 'a', date: '2026-08-27', count: 100, duration: 10.5 },
          { id: 'b', date: '2026-08-12', count: 100, duration: 10 },
          { id: 'c', date: '2026-08-11', count: 100 }
        ]
      },
      challenges: []
    };
    expect(countLoggedEnduranceChallengeSessions(endurance.sessions)).toBe(3);

    const result = calculateSportXP(
      { checkedExercises: {}, reps: {}, enduranceData: endurance },
      null,
      endurance
    );
    expect(result.breakdown.challenges).toBe(3);
    expect(result.breakdown.challengesXp).toBe(150);
    expect(result.breakdown.sessionMinutes).toBeGreaterThanOrEqual(20);
    expect(result.breakdown.timeMinutes).toBe(0);
  });

  it('ajoute la durée Garmin muscu au temps cumulé', () => {
    const workoutData = { checkedExercises: {}, reps: {}, enduranceData: { sessions: {} } };
    const garminData = {
      activities: {
        cardio: [
          {
            garminId: 'street1',
            date: '2026-08-27',
            duration: 3780,
            activityName: 'Pessac Cardio',
            activityType: 'strength_training'
          }
        ]
      }
    };
    const min = computeLifetimeExerciseAndChallengeMinutes(workoutData, garminData);
    expect(min).toBeGreaterThanOrEqual(60);

    const result = calculateSportXP(workoutData, garminData, workoutData.enduranceData);
    expect(result.breakdown.sessionMinutes).toBeGreaterThanOrEqual(60);
    expect(result.breakdown.timeMinutes).toBe(0);
  });
});
