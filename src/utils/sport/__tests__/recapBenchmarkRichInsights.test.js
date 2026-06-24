import { describe, it, expect } from 'vitest';
import {
  buildTierGapInsights,
  buildPersonalRecordInsights,
  buildFunAndVolumeInsights,
  buildPushPullBalanceInsight,
  buildSmartTonnageInsight
} from '../recapBenchmarkRichInsights';

describe('recapBenchmarkRichInsights', () => {
  it('propose un écart concret jusqu’au palier suivant', () => {
    const strengthExtract = {
      byBenchmarkKey: new Map([
        [
          'dips',
          {
            maxSetReps: 38,
            bestRecord: { exerciseName: 'Dips', dateYmd: '2026-06-09', value: 38 }
          }
        ]
      ])
    };
    const rows = buildTierGapInsights(strengthExtract);
    expect(rows.length).toBe(1);
    expect(rows[0].text).toMatch(/il vous manque 3 reps/i);
    expect(rows[0].text).toMatch(/exceptionnel/i);
  });

  it('détecte un record perso battu sur la période', () => {
    const k1 = '2026-05-01_101';
    const k2 = '2026-06-01_101';
    const snapshot = {
      checkedExercises: { [k1]: true, [k2]: true },
      exerciseSetLogs: {
        [k1]: { sets: [{ reps: 8, weight: null }], schemaVersion: 1 },
        [k2]: { sets: [{ reps: 12, weight: null }], schemaVersion: 1 }
      },
      reps: { [k1]: '8', [k2]: '12' }
    };
    const window = { start: '2026-05-01', end: '2026-06-30' };
    const rows = buildPersonalRecordInsights(
      snapshot,
      window,
      (id) => (id === 101 || id === '101' ? 'Tractions' : '')
    );
    expect(rows.some((r) => /Record perso/i.test(r.text))).toBe(true);
  });

  it('génère des comparaisons fun volume', () => {
    const rows = buildFunAndVolumeInsights({
      windowTonnageKg: 12_000,
      windowKm: 90,
      kmYear: 500,
      totalRepsWindow: 12_000,
      trainingDaysInWindow: 24,
      weeks: 8,
      garminData: null,
      window: null,
      bodyWeightKg: 75
    });
    expect(rows.some((r) => /équivalent de .* marathon/i.test(r.text))).toBe(true);
  });

  it('tonnage contextualisé remplace les analogies bateau', () => {
    const row = buildSmartTonnageInsight({
      windowTonnageKg: 19_000,
      bodyWeightKg: 75,
      weeks: 8,
      halfTrend: { trend: 'up', volDeltaPct: 12 }
    });
    expect(row?.text).toMatch(/19 t/i);
    expect(row?.text).not.toMatch(/éléphant|autobus/i);
    expect(row?.text).toMatch(/palier/i);
  });

  it('décrit le profil push/pull', () => {
    const row = buildPushPullBalanceInsight(
      { totalReps: 200 },
      { totalReps: 300 },
      { totalReps: 100 }
    );
    expect(row?.text).toMatch(/poussée/i);
  });
});
