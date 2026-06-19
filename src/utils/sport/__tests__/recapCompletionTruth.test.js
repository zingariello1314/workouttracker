import { describe, expect, it } from 'vitest';
import {
  averageExoCompletionPct,
  compareExoCompletionWeekBlocks,
  getCompletionForWindow,
  buildDailyExoCompletionSeries
} from '../recapCompletionTruth';

const program = {
  name: 'Test',
  schedule: {
    lundi: {
      active: true,
      exercises: [
        { id: 104, name: 'Pompes', series: '4×15' },
        { id: 101, name: 'Tractions', series: '4×5' },
        { id: 103, name: 'Dips', series: '4×8' },
        { id: 105, name: 'Pompes incl', series: '4×12' }
      ]
    },
    mercredi: {
      active: true,
      exercises: [
        { id: 104, name: 'Pompes', series: '4×15' },
        { id: 101, name: 'Tractions', series: '4×5' },
        { id: 103, name: 'Dips', series: '4×8' },
        { id: 105, name: 'Pompes incl', series: '4×12' }
      ]
    },
    vendredi: {
      active: true,
      exercises: [
        { id: 104, name: 'Pompes', series: '4×15' },
        { id: 101, name: 'Tractions', series: '4×5' },
        { id: 103, name: 'Dips', series: '4×8' },
        { id: 105, name: 'Pompes incl', series: '4×12' }
      ]
    }
  }
};

const ctx = { activeProgram: program, programs: [program], alignWithCalendar: true };

function seedDay(snapshot, dateStr, exoIds, checkAll = true) {
  exoIds.forEach((id) => {
    const key = `${dateStr}_${id}`;
    snapshot.reps[key] = '10';
    if (checkAll) snapshot.checkedExercises[key] = true;
  });
}

describe('recapCompletionTruth', () => {
  it('exoPct reste élevé même sans étirements cochés', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    const trainingDays = ['2026-05-05', '2026-05-07', '2026-05-09', '2026-05-12', '2026-05-14'];
    trainingDays.forEach((d) => seedDay(snapshot, d, [104, 101, 103, 105]));

    const m = getCompletionForWindow(snapshot, { start: '2026-05-01', end: '2026-05-15' }, ctx);
    expect(m.exoPct).toBe(100);
    expect(m.globalPct).toBeLessThan(85);
  });

  it('compare deux semaines sur exoPct (pas globalPct)', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    const recentDays = ['2026-06-01', '2026-06-03', '2026-06-05'];
    const priorDays = ['2026-05-25', '2026-05-27', '2026-05-29'];
    recentDays.forEach((d) => seedDay(snapshot, d, [104, 101, 103, 105]));
    priorDays.forEach((d) => seedDay(snapshot, d, [104, 101], true));

    const cmp = compareExoCompletionWeekBlocks(snapshot, '2026-06-05', '2026-05-01', ctx);
    expect(cmp).not.toBeNull();
    expect(cmp.recentPct).toBe(100);
    expect(cmp.priorPct).toBe(50);
  });

  it('buildDailyExoCompletionSeries utilise le ratio exos uniquement', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    seedDay(snapshot, '2026-06-02', [104, 101, 103, 105]);
    const series = buildDailyExoCompletionSeries(
      snapshot,
      { start: '2026-06-01', end: '2026-06-05' },
      ctx
    );
    const trained = series.find((d) => d.date === '2026-06-02');
    expect(trained?.value).toBe(100);
    expect(averageExoCompletionPct(snapshot, '2026-06-01', '2026-06-05', ctx)).toBe(100);
  });
});
