import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildAdaptiveRecapInsights,
  collectCheckedExerciseRepHistory,
  selectBalancedInsightTexts
} from '../recapAdaptiveInsights';
import { publishSleepCandidates } from '../recapSleepCorrelation';
import { buildSessionCatalog } from '../recapPersonalBaselines';

describe('recapAdaptiveInsights', () => {
  it('ne remplit plus les colonnes avec des faits d’exercice isolés', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const exId = '101';
    for (let w = 0; w < 4; w += 1) {
      for (let d = 1; d <= 2; d += 1) {
        const day = String(d + w * 7).padStart(2, '0');
        const date = `2026-05-${day}`;
        const key = `${date}_${exId}`;
        snapshot.reps[key] = 20;
        snapshot.checkedExercises[key] = true;
      }
    }
    const key21 = '2026-06-05_101';
    snapshot.reps[key21] = 21;
    snapshot.checkedExercises[key21] = true;

    const window = { start: '2026-05-01', end: '2026-06-05' };
    const hist = collectCheckedExerciseRepHistory(snapshot, window);
    expect(hist.get('101')?.length).toBeGreaterThanOrEqual(5);

    const result = buildAdaptiveRecapInsights({
      legacyPistes: { shortTerm: ['Volume -89 % vs ta 1re moitié'], mediumTerm: [], longTerm: [] },
      snapshot,
      window,
      getExerciseNameById: (id) => (id === 101 ? 'Tractions pronation' : `Ex ${id}`)
    });

    const all = [...result.insights.shortTerm, ...result.insights.mediumTerm, ...result.insights.longTerm];
    expect(result.insights.shortTerm.length).toBeLessThanOrEqual(8);
    const flat = all.map((t) => (typeof t === 'string' ? t : `${t.title || ''} ${t.body || ''} ${t.text || ''}`)).join('\n');
    expect(/Volume -89|1re moitié/i.test(flat)).toBe(false);
  });

  it('diversifie les piliers dans la sélection', () => {
    const candidates = [
      { id: 'a', horizon: 'short', pillar: 'training', weight: 80, text: 'A' },
      { id: 'b', horizon: 'short', pillar: 'training', weight: 75, text: 'B' },
      { id: 'c', horizon: 'short', pillar: 'cardio', weight: 70, text: 'C' },
      { id: 'd', horizon: 'short', pillar: 'gtg', weight: 65, text: 'D' }
    ];
    const picked = selectBalancedInsightTexts(candidates, 'short', 3, 'sig');
    expect(picked).toHaveLength(3);
    expect(picked).toContain('A');
    expect(picked).toContain('C');
  });

  it('fait arriver au moins une carte sommeil dans Court ou Trajectoire si 12 paires existent', () => {
    const end = '2026-08-31';
    const snapshot = { reps: {}, checkedExercises: {} };
    const dailyMetrics = {};
    for (let i = 0; i < 12; i += 1) {
      const d = DateHelper.addDays(end, -i * 2);
      snapshot.reps[`${d}_501`] = i % 2 === 0 ? 340 : 210;
      snapshot.checkedExercises[`${d}_501`] = true;
      dailyMetrics[d] = {
        sleep: {
          duration: i % 2 === 0 ? 7.8 : 6.5,
          deep: 1.05,
          rem: 1.4,
          light: 5.0,
          awake: 0.25
        }
      };
    }
    const garminPartial = { status: 'ready', dailyMetrics, activities: { cardio: [] } };
    const getName = (id) => (Number(id) === 501 ? 'Dips parallèles' : `Ex ${id}`);
    const catalog = buildSessionCatalog({
      snapshot,
      getExerciseNameById: getName,
      garminData: { dailyMetrics },
      endYmd: end
    });
    expect(publishSleepCandidates(catalog).length).toBeGreaterThan(0);

    const kindsOf = (result) =>
      [...result.insights.shortTerm, ...result.insights.mediumTerm, ...result.insights.longTerm]
        .map((c) => c.kind || '')
        .join(' ');

    const today = buildAdaptiveRecapInsights({
      snapshot,
      window: { start: end, end },
      period: 'today',
      getExerciseNameById: getName,
      garminPartial,
      garminDailyMetrics: dailyMetrics
    });
    expect(kindsOf(today)).toMatch(/disc_sleep_/);

    const week = buildAdaptiveRecapInsights({
      snapshot,
      window: { start: '2026-08-25', end },
      period: '7d',
      getExerciseNameById: getName,
      garminPartial,
      garminDailyMetrics: dailyMetrics
    });
    expect(kindsOf(week)).toMatch(/disc_sleep_/);
  });
});
