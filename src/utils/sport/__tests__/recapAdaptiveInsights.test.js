import { describe, expect, it } from 'vitest';
import {
  buildAdaptiveRecapInsights,
  collectCheckedExerciseRepHistory,
  selectBalancedInsightTexts
} from '../recapAdaptiveInsights';

describe('recapAdaptiveInsights', () => {
  it('détecte une micro-progression sur habitude stable (20 → 21 tractions)', () => {
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
      legacyPistes: { shortTerm: [], mediumTerm: [], longTerm: [] },
      snapshot,
      window,
      getExerciseNameById: (id) => (id === 101 ? 'Tractions pronation' : `Ex ${id}`)
    });

    const all = [...result.insights.shortTerm, ...result.insights.mediumTerm, ...result.insights.longTerm];
    expect(all.some((t) => /21|Tractions|\+1|micro/i.test(t))).toBe(true);
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
});
