import { describe, expect, it } from 'vitest';
import {
  collectCatalogCheckHistory,
  computeCatalogPeriodRecords
} from '../exerciseGradeCheckHistory';
import {
  extractMetricsForCatalogKey,
  collectCatalogActivityByDate
} from '../exerciseGradeCatalogMetrics';

describe('collectCatalogCheckHistory', () => {
  it('liste les coches programme avec reps', () => {
    const getName = (id) => (String(id) === '42' ? 'Pompes' : '');
    const snapshot = {
      checkedExercises: {
        '2026-08-10_42': true,
        '2026-08-09_42': true
      },
      reps: {
        '2026-08-10_42': '20',
        '2026-08-09_42': '15'
      }
    };
    const rows = collectCatalogCheckHistory(snapshot, 'pushups', getName);
    expect(rows).toHaveLength(2);
    expect(rows[0].dateStr).toBe('2026-08-10');
    expect(rows[0].reps).toBe(20);
    expect(rows[0].source).toBe('workout');
  });

  it('inclut les défis pompes uniquement sur la fiche pompes tout court', () => {
    const snapshot = {
      checkedExercises: {},
      reps: {},
      enduranceData: {
        sessions: {
          pushups: [{ date: '2026-01-10', count: 50 }]
        }
      }
    };
    const rowsPlain = collectCatalogCheckHistory(snapshot, 'name:pompes', () => 'Pompes');
    expect(rowsPlain).toHaveLength(1);
    expect(rowsPlain[0].source).toBe('endurance');
    const rowsVariant = collectCatalogCheckHistory(
      snapshot,
      'name:pompes-en-tension-continue',
      () => 'Pompes en tension continue'
    );
    expect(rowsVariant).toHaveLength(0);
  });
});

describe('computeCatalogPeriodRecords', () => {
  it('calcule meilleur jour, semaine et mois', () => {
    const getName = () => 'Pompes';
    const snapshot = {
      checkedExercises: {
        '2026-08-04_42': true,
        '2026-08-05_42': true,
        '2026-08-06_42': true
      },
      reps: {
        '2026-08-04_42': '10',
        '2026-08-05_42': '30',
        '2026-08-06_42': '5'
      }
    };
    const rec = computeCatalogPeriodRecords(snapshot, 'pushups', getName);
    expect(rec.bestDay.reps).toBe(30);
    expect(rec.bestDay.dateStr).toBe('2026-08-05');
    expect(rec.bestDay.dateHeadline).toBeTruthy();
    expect(rec.bestWeek.reps).toBe(45);
    expect(rec.bestMonth.reps).toBe(45);
    const metrics = extractMetricsForCatalogKey(snapshot, 'pushups', getName);
    expect(rec.bestDay.reps).toBe(metrics.maxDailyTotalReps);
  });
});

describe('reps structurées (alignement récap)', () => {
  it('somme les séries pour dips hebdo', () => {
    const keyMon = '2026-08-03_88';
    const keyWed = '2026-08-05_88';
    const snapshot = {
      checkedExercises: { [keyMon]: true, [keyWed]: true },
      reps: { [keyMon]: '10', [keyWed]: '8' },
      exerciseSetLogs: {
        [keyMon]: {
          sets: [
            { reps: 48, weight: null },
            { reps: 48, weight: null }
          ],
          schemaVersion: 1
        },
        [keyWed]: {
          sets: [{ reps: 40, weight: null }, { reps: 40, weight: null }],
          schemaVersion: 1
        }
      }
    };
    const getName = () => 'Dip aux barres parallèles';
    const rec = computeCatalogPeriodRecords(snapshot, 'dips', getName);
    expect(rec.bestWeek.reps).toBe(96 + 80);
    const byDate = collectCatalogActivityByDate(snapshot, 'dips', getName);
    let sum = 0;
    byDate.forEach((v) => {
      sum += v.reps;
    });
    expect(sum).toBe(96 + 80);
  });
});

describe('ventilation pompes', () => {
  it('ne mélange plus défis endurance sur fiche name:', () => {
    const snapshot = {
      checkedExercises: {
        '2026-08-04_104': true
      },
      reps: { '2026-08-04_104': '20' },
      enduranceData: {
        sessions: {
          pushups: [{ date: '2026-08-06', count: 50 }]
        }
      }
    };
    const getName = () => 'Pompes inclinées pieds sur banc';
    const key = 'name:pompes-inclinees';
    const rec = computeCatalogPeriodRecords(snapshot, key, getName);
    expect(rec.bestWeek.reps).toBe(20);
    expect(rec.bestWeek.pushupChannels).toBeNull();
  });
});

describe('isolation par clé catalogue', () => {
  it('ex:99999 ne voit pas les coches des pompes', () => {
    const snapshot = {
      checkedExercises: {
        '2026-08-10_42': true,
        '2026-08-10_99999': true
      },
      reps: { '2026-08-10_42': '50', '2026-08-10_99999': '8' }
    };
    const getName = (id) => (String(id) === '42' ? 'Pompes' : 'Autre');
    const push = collectCatalogCheckHistory(snapshot, 'pushups', getName);
    const ex = collectCatalogCheckHistory(snapshot, 'ex:99999', getName);
    expect(push).toHaveLength(1);
    expect(push[0].reps).toBe(50);
    expect(ex).toHaveLength(1);
    expect(ex[0].reps).toBe(8);
  });
});
