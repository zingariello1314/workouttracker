import {
  getPyramidStatsDateRange,
  buildDailyPyramidSeriesWithZeros,
  aggregatePyramidByExercise
} from '../pyramidStatsAggregate';

describe('pyramidStatsAggregate', () => {
  test('buildDailyPyramidSeriesWithZeros inclut les zéros', () => {
    const log = [
      { dateStr: '2026-05-01', exerciseId: 1, repsDone: 10 },
      { dateStr: '2026-05-03', exerciseId: 1, repsDone: 5 }
    ];
    const series = buildDailyPyramidSeriesWithZeros(log, '2026-05-01', '2026-05-03');
    expect(series).toHaveLength(3);
    expect(series[1].reps).toBe(0);
    expect(series[1].sessions).toBe(0);
    expect(series[0].reps).toBe(10);
    expect(series[2].reps).toBe(5);
  });

  test('aggregatePyramidByExercise', () => {
    const log = [
      { dateStr: '2026-05-01', exerciseId: 1, exerciseName: 'A', repsDone: 10 },
      { dateStr: '2026-05-02', exerciseId: 1, exerciseName: 'A', repsDone: 10 },
      { dateStr: '2026-05-02', exerciseId: 2, exerciseName: 'B', repsDone: 50 }
    ];
    const { topByReps, topBySessions } = aggregatePyramidByExercise(log, '2026-05-01', '2026-05-02');
    expect(topBySessions[0].exerciseId).toBe('1');
    expect(topBySessions[0].value).toBe(2);
    expect(topByReps[0].exerciseId).toBe('2');
  });

  test('getPyramidStatsDateRange all sans log', () => {
    const r = getPyramidStatsDateRange('all', new Date('2026-06-01T12:00:00'), []);
    expect(r.endStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.startStr <= r.endStr).toBe(true);
  });
});
