import { describe, expect, it } from 'vitest';
import { buildSpanStoryCandidates } from '../recapSpanStory';
import { contextualMagnitude, informationGain, markTold } from '../recapReasoning';

function add(snapshot, date, reps, exercise = 501) {
  snapshot.reps[`${date}_${exercise}`] = reps;
  snapshot.checkedExercises[`${date}_${exercise}`] = true;
}

describe('contextualMagnitude', () => {
  it('donne moins de force au même pourcentage sur une petite base', () => {
    const small = contextualMagnitude({ rel: 30, abs: 36, base: 120, n: 3 });
    const large = contextualMagnitude({ rel: 30, abs: 600, base: 2000, n: 12 });
    expect(large.strength).toBeGreaterThan(small.strength);
    expect(contextualMagnitude({ rel: 80, abs: 80, base: 0, n: 4 }).strength).toBe(0);
  });
});

describe('informationGain', () => {
  it('laisse passer une décomposition et bloque la répétition du même constat', () => {
    const told = new Set();
    expect(informationGain(['volume_change:from_frequency'], told)).toBe(1);
    markTold(told, ['volume_change:from_frequency'], ['volume_up', 'reps_up']);
    expect(informationGain(['volume_up'], told)).toBe(0);
    expect(informationGain(['volume_change:from_density'], told)).toBe(1);
  });
});

describe('questions de raisonnement', () => {
  it('décompose une hausse de volume par la fréquence et signale un répertoire différent', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    ['2026-07-06', '2026-07-08', '2026-07-10'].forEach((d) => add(snapshot, d, 80, 501));
    ['2026-08-03', '2026-08-05', '2026-08-07', '2026-08-10', '2026-08-12', '2026-08-14'].forEach((d) =>
      add(snapshot, d, 80, 880)
    );
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-08-01', end: '2026-08-28' },
      period: '30d'
    });
    const volume = cards.find((c) => (c.findings || []).some((f) => String(f).startsWith('volume_change')));
    expect(volume).toBeTruthy();
    expect(volume.context.body).toMatch(/séances/i);
    expect(volume.context.body).toMatch(/composition|mouvements/i);
    expect(volume.context.body).not.toMatch(/0 reps/);
  });

  it('ne transforme pas une fenêtre précédente vide en volume nul', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    ['2026-08-10', '2026-08-12', '2026-08-14', '2026-08-17'].forEach((d) => add(snapshot, d, 50));
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-08-10', end: '2026-08-17' },
      period: '7d'
    });
    expect(cards.some((c) => (c.findings || []).includes('volume_up'))).toBe(false);
    expect(cards.map((c) => c.context.body).join('\n')).not.toMatch(/0 reps|volume nul/i);
  });

  it('oppose une fréquence plus haute à une dispersion plus haute', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    ['2026-06-02', '2026-06-04', '2026-06-09', '2026-06-11', '2026-06-16', '2026-06-18', '2026-06-23', '2026-06-25'].forEach(
      (d) => add(snapshot, d, 40)
    );
    ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17'].forEach(
      (d) => add(snapshot, d, 40)
    );
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: '2026-06-29', end: '2026-07-26' },
      period: '30d'
    });
    const card = cards.find((c) => (c.findings || []).includes('regularity:more_often_less_stable'));
    expect(card?.context?.body || '').toMatch(/dispersion|inégal/i);
  });

  it('distingue le rythme des 90 jours, de l’année intermédiaire et du parcours', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 10; i += 1) add(snapshot, `2024-03-${String(2 + i).padStart(2, '0')}`, 30);
    for (let i = 0; i < 20; i += 1) add(snapshot, `2025-06-${String((i % 27) + 1).padStart(2, '0')}`, 40);
    for (let i = 0; i < 40; i += 1) {
      const day = (i % 27) + 1;
      add(snapshot, `2026-08-${String(day).padStart(2, '0')}`, 50);
    }
    const cards = buildSpanStoryCandidates({
      snapshot,
      window: { start: null, end: '2026-08-31' },
      period: 'all'
    });
    const history = cards.find((c) => (c.findings || []).some((f) => String(f).startsWith('history:')));
    expect(history).toBeTruthy();
    expect(history.context.body).toMatch(/90/);
    expect(history.context.body).not.toMatch(/cette semaine/i);
  });
});
