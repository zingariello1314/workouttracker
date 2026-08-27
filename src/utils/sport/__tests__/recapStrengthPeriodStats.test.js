import { describe, expect, it } from 'vitest';
import { buildRecapStrengthCompareModel } from '../recapStrengthPeriodStats';
import { buildTotalStrengthRepsByDate } from '../recapDailyChartData';
import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../../../services/endurance/pushupEnduranceWorkoutKeys';

describe('pompes défis — pas de double comptage', () => {
  const dateStr = '2026-08-27';
  const key = `${dateStr}_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
  const snapshot = {
    checkedExercises: { [key]: true },
    reps: { [key]: '100' },
    enduranceData: {
      sessions: {
        pushups: [
          {
            id: 's1',
            date: dateStr,
            count: 100,
            duration: 10.5
          }
        ]
      }
    }
  };

  it('Récap Analyse : une seule ligne Pompes (endurance) à 100', () => {
    const model = buildRecapStrengthCompareModel(snapshot, '30d', () => 'Pompes', new Date('2026-08-27T12:00:00'));
    expect(model.totalRepsCurr).toBe(100);
    expect(model.top3Exercises).toHaveLength(1);
    expect(model.top3Exercises[0].name).toBe('Pompes (endurance)');
    expect(model.top3Exercises[0].reps).toBe(100);
  });

  it('courbes journalières : 100 reps, pas 200', () => {
    const byDate = buildTotalStrengthRepsByDate(snapshot);
    expect(byDate.get(dateStr)).toBe(100);
  });

  it('session seule (pas encore sync) est toujours comptée', () => {
    const unsynced = {
      checkedExercises: {},
      reps: {},
      enduranceData: snapshot.enduranceData
    };
    const model = buildRecapStrengthCompareModel(unsynced, '30d', () => '', new Date('2026-08-27T12:00:00'));
    expect(model.totalRepsCurr).toBe(100);
    expect(model.top3Exercises[0].isEndurancePushups).toBe(true);
  });
});
