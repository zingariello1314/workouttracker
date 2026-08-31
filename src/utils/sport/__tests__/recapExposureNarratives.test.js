import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  deriveExposureWindows,
  summarizeExposure,
  periodPhrase,
  muscleProfile
} from '../recapExposureNarratives';

describe('recapExposureNarratives', () => {
  it('place l’habitude sur 3 semaines avant une fenêtre 7 j.', () => {
    const window = { start: '2026-06-18', end: '2026-06-24' };
    const w = deriveExposureWindows('7d', window);
    expect(w.habit.end).toBe('2026-06-17');
    expect(w.habit.start).toBe('2026-05-28');
    expect(periodPhrase('7d', window)).toMatch(/7 derniers jours/);
  });

  it('compare séances et muscles semaine vs 3 semaines', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, exId, reps) => {
      const key = `${date}_${exId}`;
      snapshot.reps[key] = reps;
      snapshot.checkedExercises[key] = true;
    };
    for (let i = 0; i < 6; i += 1) {
      const d = DateHelper.addDays('2026-06-17', -(i * 3 + 1));
      add(d, '101', 20);
      add(d, '104', 25);
    }
    add('2026-06-20', '104', 18);
    add('2026-06-23', '104', 16);

    const current = summarizeExposure(
      snapshot,
      { start: '2026-06-18', end: '2026-06-24' },
      (id) => (id === 101 ? 'Tractions' : id === 104 ? 'Pompes' : `Ex ${id}`)
    );
    expect(current.sessions).toBe(2);
    const profile = muscleProfile(current);
    expect(profile.total).toBeGreaterThan(0);
    expect(profile.muscles[0].sharePct).toBeGreaterThan(0);
  });
});
