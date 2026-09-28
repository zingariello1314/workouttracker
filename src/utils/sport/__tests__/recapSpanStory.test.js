import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import { buildSpanStoryCandidates } from '../recapSpanStory';
import { resolveEvidence } from '../recapQuestionEngine';

function add(snapshot, date, reps) {
  snapshot.reps[`${date}_501`] = reps;
  snapshot.checkedExercises[`${date}_501`] = true;
}

describe('resolveEvidence', () => {
  it('baisse la précision sans preuve directe, et garde le conflit comme conclusion', () => {
    const direct = resolveEvidence({
      proofs: [
        { id: 'rpe', role: 'primary', strength: 1, present: true, direction: 'up', coverage: 1, n: 4 }
      ]
    });
    const substituted = resolveEvidence({
      proofs: [
        { id: 'rpe', role: 'primary', strength: 1, present: false },
        { id: 'volume', role: 'secondary', strength: 0.6, present: true, direction: 'up', coverage: 1, n: 4 },
        { id: 'sleep', role: 'context', strength: 0.35, present: true, direction: 'down', coverage: 0.7, n: 5 }
      ]
    });
    const conflict = resolveEvidence({
      proofs: [
        { id: 'sleep', role: 'context', strength: 0.35, present: true, direction: 'down', coverage: 1, n: 4 },
        { id: 'volume', role: 'secondary', strength: 0.6, present: true, direction: 'up', coverage: 1, n: 4 }
      ],
      contradictions: [{ id: 'performance_holds' }]
    });
    expect(direct.route).toBe('A');
    expect(direct.confidence).toBeGreaterThan(substituted.confidence);
    expect(substituted.route).toBe('B');
    expect(substituted.level).toBeLessThanOrEqual(2);
    expect(conflict.route).toBe('conflict');
    expect(conflict.level).toBeGreaterThanOrEqual(3);
  });
});

describe('buildSpanStoryCandidates', () => {
  it('sur Toujours, raconte le parcours et pas la semaine en cours', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 8; i += 1) add(snapshot, DateHelper.addDays('2026-01-06', i * 14), 80);
    for (let i = 0; i < 12; i += 1) add(snapshot, DateHelper.addDays('2026-06-02', i * 4), 140);
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: null, end: '2026-08-31' },
      period: 'all'
    });
    const blob = cards.map((c) => `${c.context.title} ${c.context.body}`).join('\n');
    expect(cards.length).toBeGreaterThan(0);
    expect(blob).not.toMatch(/cette semaine/i);
    expect(blob).toMatch(/janvier|juin|séance/i);
    expect(cards.some((c) => c.horizon === 'long')).toBe(true);
  });

  it('sur 7 jours sans signal fort, ne force pas de carte', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    add(snapshot, '2026-08-25', 100);
    add(snapshot, '2026-08-27', 120);
    add(snapshot, '2026-08-29', 90);
    add(snapshot, '2026-08-31', 110);
    expect(
      buildSpanStoryCandidates({
        snapshot,
        window: { start: '2026-08-25', end: '2026-08-31' },
        period: '7d'
      })
    ).toEqual([]);
  });

  it('sans ressenti, le coût passe par la charge et ne invente pas de note', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    ['2026-08-18', '2026-08-20', '2026-08-22'].forEach((d) => add(snapshot, d, 100));
    ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'].forEach((d) => add(snapshot, d, 140));
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d'
    });
    const cost = cards.find((c) => (c.concepts || []).includes('session_cost'));
    expect(cost).toBeTruthy();
    expect(cost.context.body).toMatch(/ressenti/i);
    expect(cost.context.body).not.toMatch(/\d+\/10/);
    expect(cost.context.body).toMatch(/volume|tonnage|jour/i);
  });

  it('un ressenti partiel ne devient pas la moyenne de toute la période', () => {
    const snapshot = { reps: {}, checkedExercises: {}, sessionFeedbacks: {} };
    ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-30'].forEach((d, i) => {
      add(snapshot, d, 80);
      if (i < 2) snapshot.sessionFeedbacks[d] = { difficulte: 8 };
    });
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d'
    });
    const cost = cards.find((c) => (c.concepts || []).includes('session_cost'));
    expect(cost.context.body).toMatch(/2/);
    expect(cost.context.body).toMatch(/5|40 %/);
    expect(cost.context.body).toMatch(/ne décrit pas|partie/i);
  });

  it('publie le coût d’énergie seulement si l’écart est net, et une seule carte de ressenti', () => {
    const snapshot = {
      reps: { '2026-08-31_501': 80 },
      checkedExercises: { '2026-08-31_501': true },
      sessionFeedbacks: {
        '2026-08-31': { energieDebut: 8, energieFin: 4, difficulte: 7 }
      }
    };
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today'
    });
    const felt = cards.filter((c) => c.family === 'ressenti' || c.family === 'cout');
    expect(felt.length).toBe(1);
    expect(cards[0].context.body).toMatch(/8\/10/);
    expect(cards.map((c) => c.family).filter((f, i, a) => a.indexOf(f) !== i)).toEqual([]);
  });
});
