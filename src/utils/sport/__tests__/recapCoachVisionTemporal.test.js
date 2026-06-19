import { describe, expect, it } from 'vitest';
import {
  VisionComposer,
  buildMonthlyCoachStats,
  buildTemporalVisionSections
} from '../recapCoachVisionTemporal';
import { buildCoachVisionNarrative } from '../recapCoachVision';

const program = {
  name: 'Plan',
  schedule: {
    lundi: { active: true, exercises: [{ id: 101, name: 'Tractions', series: '4×5' }] },
    mercredi: { active: true, exercises: [{ id: 104, name: 'Pompes', series: '4×15' }] },
    vendredi: { active: true, exercises: [{ id: 101, name: 'Tractions', series: '4×5' }] }
  }
};

const ctx = { activeProgram: program, programs: [program], alignWithCalendar: true };

function seed(snapshot, dateStr, ids = [101, 104]) {
  ids.forEach((id) => {
    const key = `${dateStr}_${id}`;
    snapshot.reps[key] = '10';
    snapshot.checkedExercises[key] = true;
  });
}

describe('recapCoachVisionTemporal', () => {
  it('VisionComposer évite les doublons par tag', () => {
    const c = new VisionComposer();
    expect(c.add('Premier.', ['yoy'])).toBe(true);
    expect(c.add('Doublon.', ['yoy'])).toBe(false);
    expect(c.paragraphs).toHaveLength(1);
  });

  it('compare 2026 vs 2025 en mode Toujours', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    ['2025-05-05', '2025-05-07', '2025-05-09'].forEach((d) => seed(snapshot, d, [101]));
    ['2026-05-05', '2026-05-07', '2026-05-09', '2026-05-12', '2026-05-14', '2026-05-16'].forEach((d) =>
      seed(snapshot, d)
    );

    const composer = buildTemporalVisionSections({
      snapshot,
      endYmd: '2026-06-05',
      windowStart: null,
      windowDays: 999,
      ctx
    });

    const text = composer.join();
    expect(/2026/.test(text)).toBe(true);
    expect(/2025/.test(text)).toBe(true);
  });

  it('fusionne meilleur mois et mois en cours si identiques', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    for (let d = 1; d <= 12; d += 1) {
      seed(snapshot, `2026-06-${String(d).padStart(2, '0')}`);
    }
    for (let d = 1; d <= 8; d += 1) {
      seed(snapshot, `2026-05-${String(d).padStart(2, '0')}`, [101]);
    }

    const composer = buildTemporalVisionSections({
      snapshot,
      endYmd: '2026-06-12',
      windowStart: '2026-01-01',
      windowDays: 160,
      ctx
    });

    const text = composer.join();
    expect(/meilleur mois/i.test(text)).toBe(true);
    expect(composer.paragraphs.filter((p) => /meilleur mois/i.test(p)).length).toBeLessThanOrEqual(1);
  });

  it('buildMonthlyCoachStats agrège par mois', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    seed(snapshot, '2026-05-05');
    seed(snapshot, '2026-05-07');
    const months = buildMonthlyCoachStats(snapshot, '2026-06-05', ctx, { windowStart: '2026-01-01' });
    expect(months.some((m) => m.monthKey === '2026-05' && m.trainedDays >= 2)).toBe(true);
  });

  it('vision Toujours produit plusieurs paragraphes denses', () => {
    const snapshot = { reps: {}, checkedExercises: {}, checkedStretches: {} };
    ['2025-03-03', '2025-06-02', '2025-09-04'].forEach((d) => seed(snapshot, d, [101]));
    for (let i = 1; i <= 20; i += 1) {
      seed(snapshot, `2026-05-${String(i).padStart(2, '0')}`);
    }
    for (let i = 1; i <= 5; i += 1) {
      seed(snapshot, `2026-06-${String(i).padStart(2, '0')}`);
    }

    const text = buildCoachVisionNarrative({
      activeProgram: program,
      snapshot,
      window: { start: null, end: '2026-06-05' },
      enrichment: { streak: { current: 5, longest: 10 }, digest: { perActivity: {} } },
      programs: [program]
    });

    expect(text.split('\n\n').length).toBeGreaterThanOrEqual(3);
    expect(text.length).toBeGreaterThan(200);
  });
});
